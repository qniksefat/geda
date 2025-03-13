from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from geda.models import Category, Transaction

class CategoryService:
    """Service for managing categories"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_categories(self) -> List[Category]:
        """Get all categories"""
        return self.db.query(Category).order_by(Category.name).all()
    
    def get_category(self, category_id: int) -> Optional[Category]:
        """Get a category by ID"""
        return self.db.query(Category).filter(Category.id == category_id).first()
    
    def get_category_by_name(self, name: str) -> Optional[Category]:
        """Get a category by name"""
        return self.db.query(Category).filter(Category.name == name).first()
    
    def create_category(self, category_data: Dict[str, Any]) -> Category:
        """
        Create a new category.
        
        Args:
            category_data: Data for the category
            
        Returns:
            The created category
        """
        # Create Category object
        category = Category(
            name=category_data["name"],
            description=category_data.get("description"),
            is_default=category_data.get("is_default", False),
        )
        
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        
        return category
    
    def update_category(self, category_id: int, category_data: Dict[str, Any]) -> Optional[Category]:
        """
        Update a category.
        
        Args:
            category_id: ID of the category to update
            category_data: New data for the category
            
        Returns:
            The updated category, or None if not found
        """
        category = self.get_category(category_id)
        if not category:
            return None
        
        # Update fields
        if "name" in category_data:
            category.name = category_data["name"]
        if "description" in category_data:
            category.description = category_data["description"]
        
        # Only allow changing is_default for non-default categories
        if "is_default" in category_data and not category.is_default:
            category.is_default = category_data["is_default"]
        
        # Update updated_at timestamp
        category.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(category)
        
        return category
    
    def delete_category(self, category_id: int, reassign_to_id: Optional[int] = None) -> bool:
        """
        Delete a category.
        
        Args:
            category_id: ID of the category to delete
            reassign_to_id: Optional ID of a category to reassign transactions to
            
        Returns:
            True if deleted, False if not found or can't be deleted
        """
        category = self.get_category(category_id)
        if not category:
            return False
        
        # Don't delete default categories
        if category.is_default:
            return False
        
        # If we need to reassign transactions
        if reassign_to_id:
            reassign_to = self.get_category(reassign_to_id)
            if not reassign_to:
                return False
            
            # Update all transactions with this category
            self.db.query(Transaction).filter(
                Transaction.category_id == category_id
            ).update(
                {"category_id": reassign_to_id}
            )
        
        # Delete the category
        self.db.delete(category)
        self.db.commit()
        
        return True
    
    def create_default_categories(self) -> List[Category]:
        """
        Create default categories if they don't exist.
        
        Returns:
            List of created categories
        """
        default_categories = [
            {"name": "Food & Dining", "description": "Restaurants, grocery stores, etc."},
            {"name": "Shopping", "description": "Retail stores, online shopping, etc."},
            {"name": "Housing", "description": "Rent, mortgage, etc."},
            {"name": "Transportation", "description": "Public transit, gas, etc."},
            {"name": "Entertainment", "description": "Movies, games, etc."},
            {"name": "Health & Fitness", "description": "Medical, gym, etc."},
            {"name": "Personal Care", "description": "Hair, cosmetics, etc."},
            {"name": "Education", "description": "Tuition, books, etc."},
            {"name": "Gifts & Donations", "description": "Charity, presents, etc."},
            {"name": "Bills & Utilities", "description": "Phone, internet, etc."},
            {"name": "Travel", "description": "Flights, hotels, etc."},
            {"name": "Income", "description": "Salary, freelance, etc."},
            {"name": "Transfer", "description": "Moving money between accounts"},
            {"name": "Uncategorized", "description": "Default for transactions without a category"},
        ]
        
        created = []
        for cat in default_categories:
            # Check if it exists
            existing = self.get_category_by_name(cat["name"])
            if not existing:
                # Create with is_default=True
                cat["is_default"] = True
                created.append(self.create_category(cat))
        
        return created