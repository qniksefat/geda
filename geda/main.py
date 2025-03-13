import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from geda.api.routes import api_router
from geda.db import Base, engine, get_db
from geda.core import CategoryService, RuleService

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Geda Budget API",
    description="API for Geda Budget App",
    version="0.1.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Create default data on startup"""
    # Create default categories and rules
    db = next(get_db())
    
    # Create default categories
    category_service = CategoryService(db)
    category_service.create_default_categories()
    
    # Create default rules
    rule_service = RuleService(db)
    rule_service.create_default_rules()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": "Geda Budget API",
        "version": "0.1.0",
        "status": "OK"
    }

if __name__ == "__main__":
    uvicorn.run("geda.main:app", host="0.0.0.0", port=8000, reload=True)