from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from geda.db.base import Base

class MappingRule(Base):
    """Stores rules for mapping transaction descriptions to categories"""
    __tablename__ = "mapping_rules"

    id = Column(Integer, primary_key=True, index=True)
    pattern = Column(String, nullable=False)  # Regex pattern or exact text to match
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    source = Column(String, nullable=True)  # e.g., "RBC", "AMEX", can be NULL for all sources
    is_regex = Column(Integer, default=0)  # 0 = exact match, 1 = regex pattern
    priority = Column(Integer, default=1)  # Higher number = higher priority
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category")

    def __repr__(self):
        return f"<MappingRule {self.pattern} -> {self.category.name if self.category else None}>"