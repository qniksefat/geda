from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from geda.api.schemas import Category, CategoryCreate
from geda.core import CategoryService
from geda.db import get_db

router = APIRouter()

@router.get("/", response_model=List[Category])
def list_categories(db: Session = Depends(get_db)):
    """
    Get a list of all categories.
    """
    service = CategoryService(db)
    return service.get_categories()

@router.get("/{category_id}", response_model=Category)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """
    Get a specific category by ID.
    """
    service = CategoryService(db)
    category = service.get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.post("/", response_model=Category)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """
    Create a new category.
    """
    service = CategoryService(db)
    
    # Check if category with this name already exists
    existing = service.get_category_by_name(category.name)
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    return service.create_category(category.dict())

@router.put("/{category_id}", response_model=Category)
def update_category(
    category_id: int, 
    category: CategoryCreate, 
    db: Session = Depends(get_db)
):
    """
    Update an existing category.
    """
    service = CategoryService(db)
    
    # Check if new name already exists for another category
    if category.name:
        existing = service.get_category_by_name(category.name)
        if existing and existing.id != category_id:
            raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    updated = service.update_category(category_id, category.dict())
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

@router.delete("/{category_id}")
def delete_category(
    category_id: int, 
    reassign_to_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Delete a category and optionally reassign its transactions.
    """
    service = CategoryService(db)
    success = service.delete_category(category_id, reassign_to_id)
    if not success:
        raise HTTPException(
            status_code=404, 
            detail="Category not found or can't be deleted (default categories can't be deleted)"
        )
    return {"success": True}

@router.post("/create-defaults", response_model=List[Category])
def create_default_categories(db: Session = Depends(get_db)):
    """
    Create default categories if they don't exist.
    """
    service = CategoryService(db)
    created = service.create_default_categories()
    return created