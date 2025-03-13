from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from geda.api.schemas import MappingRule, MappingRuleCreate
from geda.core import RuleService
from geda.db import get_db

router = APIRouter()

@router.get("/", response_model=List[MappingRule])
def list_rules(
    source: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get a list of mapping rules, optionally filtered by source.
    """
    service = RuleService(db)
    return service.get_rules(source)

@router.get("/{rule_id}", response_model=MappingRule)
def get_rule(rule_id: int, db: Session = Depends(get_db)):
    """
    Get a specific mapping rule by ID.
    """
    service = RuleService(db)
    rule = service.get_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@router.post("/", response_model=MappingRule)
def create_rule(rule: MappingRuleCreate, db: Session = Depends(get_db)):
    """
    Create a new mapping rule.
    """
    service = RuleService(db)
    try:
        return service.create_rule(rule.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{rule_id}", response_model=MappingRule)
def update_rule(
    rule_id: int, 
    rule: MappingRuleCreate, 
    db: Session = Depends(get_db)
):
    """
    Update an existing mapping rule.
    """
    service = RuleService(db)
    try:
        updated = service.update_rule(rule_id, rule.dict())
        if not updated:
            raise HTTPException(status_code=404, detail="Rule not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    """
    Delete a mapping rule.
    """
    service = RuleService(db)
    success = service.delete_rule(rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"success": True}

@router.post("/create-defaults", response_model=List[MappingRule])
def create_default_rules(db: Session = Depends(get_db)):
    """
    Create default mapping rules if they don't exist.
    """
    service = RuleService(db)
    created = service.create_default_rules()
    return created