from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Category schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Transaction schemas
class TransactionBase(BaseModel):
    date: datetime
    amount: float
    description: str
    is_expense: bool = True
    source: str = "manual"

class TransactionCreate(TransactionBase):
    category_id: Optional[int] = None
    original_description: Optional[str] = None
    import_id: Optional[str] = None
    source_id: Optional[str] = None

class Transaction(TransactionBase):
    id: int
    category_id: Optional[int]
    original_description: Optional[str]
    hash_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TransactionWithCategory(Transaction):
    category: Optional[Category] = None

# Mapping rule schemas
class MappingRuleBase(BaseModel):
    pattern: str
    category_id: int
    source: Optional[str] = None
    is_regex: int = 0
    priority: int = 1

class MappingRuleCreate(MappingRuleBase):
    pass

class MappingRule(MappingRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Import schemas
class ImportPreviewResponse(BaseModel):
    transactions: List[TransactionCreate]
    total_count: int
    possible_duplicates: List[TransactionCreate] = []
    
class ImportRequest(BaseModel):
    import_id: str
    transaction_ids: List[int] = []  # Empty means import all from preview