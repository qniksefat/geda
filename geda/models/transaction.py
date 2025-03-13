from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from geda.db.base import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    original_description = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    is_expense = Column(Boolean, default=True)
    source = Column(String, nullable=False)  # e.g., "RBC", "AMEX", "CIBC", "manual"
    import_id = Column(String, nullable=True)  # To track which import batch this came from
    source_id = Column(String, nullable=True)  # Unique ID from source if available
    hash_id = Column(String, nullable=False, unique=True)  # To detect duplicates
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction {self.date} {self.amount} {self.description}>"