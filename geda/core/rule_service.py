from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import re

from geda.models import MappingRule, Category

class RuleService:
    """Service for managing mapping rules"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_rules(self, source: Optional[str] = None) -> List[MappingRule]:
        """
        Get all mapping rules, optionally filtered by source.
        
        Args:
            source: Optional source filter
            
        Returns:
            List of mapping rules
        """
        query = self.db.query(MappingRule).order_by(MappingRule.priority.desc())
        
        if source:
            query = query.filter(
                (MappingRule.source == source) | (MappingRule.source == None)
            )
        
        return query.all()
    
    def get_rule(self, rule_id: int) -> Optional[MappingRule]:
        """Get a rule by ID"""
        return self.db.query(MappingRule).filter(MappingRule.id == rule_id).first()
    
    def create_rule(self, rule_data: Dict[str, Any]) -> MappingRule:
        """
        Create a new mapping rule.
        
        Args:
            rule_data: Data for the rule
            
        Returns:
            The created rule
        """
        # Validate regex if is_regex is True
        if rule_data.get("is_regex", 0) == 1:
            try:
                re.compile(rule_data["pattern"])
            except re.error:
                raise ValueError(f"Invalid regex pattern: {rule_data['pattern']}")
        
        # Create MappingRule object
        rule = MappingRule(
            pattern=rule_data["pattern"],
            category_id=rule_data["category_id"],
            source=rule_data.get("source"),
            is_regex=rule_data.get("is_regex", 0),
            priority=rule_data.get("priority", 1),
        )
        
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        
        return rule
    
    def update_rule(self, rule_id: int, rule_data: Dict[str, Any]) -> Optional[MappingRule]:
        """
        Update a mapping rule.
        
        Args:
            rule_id: ID of the rule to update
            rule_data: New data for the rule
            
        Returns:
            The updated rule, or None if not found
        """
        rule = self.get_rule(rule_id)
        if not rule:
            return None
        
        # Update fields
        if "pattern" in rule_data:
            # Validate regex if is_regex is True
            if rule.is_regex == 1 or rule_data.get("is_regex", rule.is_regex) == 1:
                try:
                    re.compile(rule_data["pattern"])
                except re.error:
                    raise ValueError(f"Invalid regex pattern: {rule_data['pattern']}")
                    
            rule.pattern = rule_data["pattern"]
            
        if "category_id" in rule_data:
            rule.category_id = rule_data["category_id"]
            
        if "source" in rule_data:
            rule.source = rule_data["source"]
            
        if "is_regex" in rule_data:
            rule.is_regex = rule_data["is_regex"]
            
        if "priority" in rule_data:
            rule.priority = rule_data["priority"]
        
        # Update updated_at timestamp
        rule.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(rule)
        
        return rule
    
    def delete_rule(self, rule_id: int) -> bool:
        """
        Delete a mapping rule.
        
        Args:
            rule_id: ID of the rule to delete
            
        Returns:
            True if deleted, False if not found
        """
        rule = self.get_rule(rule_id)
        if not rule:
            return False
        
        self.db.delete(rule)
        self.db.commit()
        
        return True
    
    def create_default_rules(self) -> List[MappingRule]:
        """
        Create default mapping rules if they don't exist.
        
        Returns:
            List of created rules
        """
        # Get category IDs
        food = self.db.query(Category).filter(Category.name == "Food & Dining").first()
        shopping = self.db.query(Category).filter(Category.name == "Shopping").first()
        transport = self.db.query(Category).filter(Category.name == "Transportation").first()
        bills = self.db.query(Category).filter(Category.name == "Bills & Utilities").first()
        entertainment = self.db.query(Category).filter(Category.name == "Entertainment").first()
        income = self.db.query(Category).filter(Category.name == "Income").first()
        transfer = self.db.query(Category).filter(Category.name == "Transfer").first()
        
        # Default rules
        default_rules = []
        
        if food:
            default_rules.extend([
                {"pattern": "RESTAURANT", "category_id": food.id, "is_regex": 0, "priority": 2},
                {"pattern": "CAFE", "category_id": food.id, "is_regex": 0, "priority": 2},
                {"pattern": "GROCERY", "category_id": food.id, "is_regex": 0, "priority": 2},
                {"pattern": "MCDONALD", "category_id": food.id, "is_regex": 0, "priority": 3},
                {"pattern": "STARBUCKS", "category_id": food.id, "is_regex": 0, "priority": 3},
                {"pattern": "UBER EATS", "category_id": food.id, "is_regex": 0, "priority": 3},
            ])
            
        if shopping:
            default_rules.extend([
                {"pattern": "AMAZON", "category_id": shopping.id, "is_regex": 0, "priority": 3},
                {"pattern": "WALMART", "category_id": shopping.id, "is_regex": 0, "priority": 3},
                {"pattern": "TARGET", "category_id": shopping.id, "is_regex": 0, "priority": 3},
                {"pattern": "CLOTHING", "category_id": shopping.id, "is_regex": 0, "priority": 2},
            ])
            
        if transport:
            default_rules.extend([
                {"pattern": "UBER(?!\\s+EATS)", "category_id": transport.id, "is_regex": 1, "priority": 3},
                {"pattern": "LYFT", "category_id": transport.id, "is_regex": 0, "priority": 3},
                {"pattern": "GAS", "category_id": transport.id, "is_regex": 0, "priority": 2},
                {"pattern": "TRANSIT", "category_id": transport.id, "is_regex": 0, "priority": 2},
                {"pattern": "PARKING", "category_id": transport.id, "is_regex": 0, "priority": 2},
            ])
            
        if bills:
            default_rules.extend([
                {"pattern": "PHONE", "category_id": bills.id, "is_regex": 0, "priority": 2},
                {"pattern": "INTERNET", "category_id": bills.id, "is_regex": 0, "priority": 2},
                {"pattern": "CABLE", "category_id": bills.id, "is_regex": 0, "priority": 2},
                {"pattern": "UTILITY", "category_id": bills.id, "is_regex": 0, "priority": 2},
                {"pattern": "NETFLIX", "category_id": bills.id, "is_regex": 0, "priority": 3},
                {"pattern": "SPOTIFY", "category_id": bills.id, "is_regex": 0, "priority": 3},
            ])
            
        if entertainment:
            default_rules.extend([
                {"pattern": "CINEMA", "category_id": entertainment.id, "is_regex": 0, "priority": 2},
                {"pattern": "MOVIE", "category_id": entertainment.id, "is_regex": 0, "priority": 2},
                {"pattern": "THEATRE", "category_id": entertainment.id, "is_regex": 0, "priority": 2},
                {"pattern": "CONCERT", "category_id": entertainment.id, "is_regex": 0, "priority": 2},
            ])
            
        if income:
            default_rules.extend([
                {"pattern": "SALARY", "category_id": income.id, "is_regex": 0, "priority": 2},
                {"pattern": "PAYROLL", "category_id": income.id, "is_regex": 0, "priority": 2},
                {"pattern": "DEPOSIT", "category_id": income.id, "is_regex": 0, "priority": 1},
            ])
            
        if transfer:
            default_rules.extend([
                {"pattern": "TRANSFER", "category_id": transfer.id, "is_regex": 0, "priority": 2},
                {"pattern": "E-TRANSFER", "category_id": transfer.id, "is_regex": 0, "priority": 3},
                {"pattern": "INTERAC", "category_id": transfer.id, "is_regex": 0, "priority": 3},
            ])
        
        # Create rules
        created = []
        for rule_data in default_rules:
            # Skip if rule already exists
            existing = self.db.query(MappingRule).filter(
                MappingRule.pattern == rule_data["pattern"],
                MappingRule.category_id == rule_data["category_id"],
                MappingRule.is_regex == rule_data["is_regex"]
            ).first()
            
            if not existing:
                created.append(self.create_rule(rule_data))
        
        return created