import re
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import openai
import os
from geda.models import Transaction, Category, MappingRule

class TransactionCategorizer:
    """Service for auto-categorizing transactions"""
    
    def __init__(self, db: Session):
        self.db = db
        self.openai_api_key = os.environ.get("OPENAI_API_KEY")
        self.cache = {}  # Simple in-memory cache for this session
    
    def categorize_transaction(self, transaction: Transaction) -> Optional[Category]:
        """
        Categorize a transaction using rules and LLM.
        
        The categorization process follows this order:
        1. Check if there is a user override (transaction already has category_id)
        2. Check if there are matching rules in the database
        3. Check the cache for similar descriptions
        4. Call the LLM to categorize
        
        Args:
            transaction: The transaction to categorize
            
        Returns:
            The category for the transaction, or None if no category can be determined
        """
        # Skip if already categorized
        if transaction.category_id is not None:
            return transaction.category
        
        # Check for rule-based matches
        category = self._apply_rules(transaction)
        if category:
            return category
        
        # Check cache
        if transaction.description in self.cache:
            category_id = self.cache[transaction.description]
            return self.db.query(Category).filter(Category.id == category_id).first()
        
        # Call LLM
        if self.openai_api_key:
            category = self._categorize_with_llm(transaction)
            if category:
                # Update cache
                self.cache[transaction.description] = category.id
                return category
        
        # Default to Uncategorized if we have it
        uncategorized = self.db.query(Category).filter(Category.name == "Uncategorized").first()
        return uncategorized
    
    def _apply_rules(self, transaction: Transaction) -> Optional[Category]:
        """Apply rules to categorize transaction"""
        # Get all rules, ordered by priority
        rules = self.db.query(MappingRule).order_by(MappingRule.priority.desc()).all()
        
        # First, try source-specific rules
        source_rules = [r for r in rules if r.source == transaction.source]
        for rule in source_rules:
            if self._rule_matches(rule, transaction):
                return rule.category
        
        # Then try generic rules
        generic_rules = [r for r in rules if r.source is None]
        for rule in generic_rules:
            if self._rule_matches(rule, transaction):
                return rule.category
        
        return None
    
    def _rule_matches(self, rule: MappingRule, transaction: Transaction) -> bool:
        """Check if a rule matches a transaction"""
        if rule.is_regex:
            try:
                pattern = re.compile(rule.pattern, re.IGNORECASE)
                return bool(pattern.search(transaction.description))
            except re.error:
                # Invalid regex, skip this rule
                return False
        else:
            # Simple case-insensitive substring match
            return rule.pattern.lower() in transaction.description.lower()
    
    def _categorize_with_llm(self, transaction: Transaction) -> Optional[Category]:
        """Use LLM to categorize transaction"""
        if not self.openai_api_key:
            return None
        
        # Get all categories
        categories = self.db.query(Category).all()
        category_names = [c.name for c in categories]
        
        try:
            # Call OpenAI API
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": (
                        "You are a financial transaction categorizer. "
                        "Your task is to categorize a transaction into one of the predefined categories. "
                        "Respond with ONLY the category name."
                    )},
                    {"role": "user", "content": (
                        f"Categorize this transaction: '{transaction.description}' (${abs(transaction.amount):.2f}) "
                        f"into one of these categories: {', '.join(category_names)}. "
                        "Respond with ONLY the category name."
                    )}
                ],
                max_tokens=20,
                temperature=0.3
            )
            
            # Extract prediction
            prediction = response.choices[0].message.content.strip()
            
            # Find closest category match
            for category in categories:
                if category.name.lower() == prediction.lower():
                    return category
            
            # If exact match not found, try fuzzy match
            for category in categories:
                if category.name.lower() in prediction.lower() or prediction.lower() in category.name.lower():
                    return category
            
        except Exception as e:
            # Log error and continue
            print(f"Error calling LLM: {e}")
        
        return None
    
    def batch_categorize(self, transactions: List[Transaction]) -> None:
        """Categorize a batch of transactions"""
        for transaction in transactions:
            category = self.categorize_transaction(transaction)
            if category:
                transaction.category_id = category.id