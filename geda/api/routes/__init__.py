from fastapi import APIRouter
from geda.api.routes import transactions, categories, rules, imports

api_router = APIRouter()

api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(rules.router, prefix="/rules", tags=["rules"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])