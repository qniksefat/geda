.PHONY: help install backend frontend run test clean setup-backend setup-frontend venv

# Default target
.DEFAULT_GOAL := help

# Colors for terminal output
YELLOW=\033[1;33m
GREEN=\033[1;32m
NC=\033[0m # No Color

# Define Python and Node paths
PYTHON = python
PIP = pip
NODE = node
NPM = npm

# Define paths
VENV_PATH = venv
BACKEND_DIR = geda
FRONTEND_DIR = frontend
DB_FILE = geda.db

help: ## Show this help message
	@echo "$(YELLOW)Geda Budget App - Makefile Commands$(NC)"
	@echo "$(YELLOW)====================================$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

venv: ## Create a virtual environment
	@echo "$(YELLOW)Creating virtual environment...$(NC)"
	@test -d $(VENV_PATH) || $(PYTHON) -m venv $(VENV_PATH)
	@echo "$(GREEN)Virtual environment created at $(VENV_PATH)$(NC)"
	@echo "$(YELLOW)Activate it with:$(NC) source $(VENV_PATH)/bin/activate"

setup-backend: venv ## Install backend dependencies
	@echo "$(YELLOW)Installing backend dependencies...$(NC)"
	@source $(VENV_PATH)/bin/activate && $(PIP) install -r requirements.txt
	@echo "$(GREEN)Backend dependencies installed$(NC)"

setup-frontend: ## Install frontend dependencies
	@echo "$(YELLOW)Installing frontend dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && $(NPM) install --force
	@echo "$(GREEN)Frontend dependencies installed$(NC)"

install: setup-backend setup-frontend ## Install all dependencies (backend and frontend)
	@echo "$(GREEN)All dependencies installed successfully$(NC)"

backend: ## Run the backend server
	@echo "$(YELLOW)Starting backend server...$(NC)"
	@source $(VENV_PATH)/bin/activate && python run.py

frontend: ## Run the frontend development server
	@echo "$(YELLOW)Starting frontend server...$(NC)"
	@cd $(FRONTEND_DIR) && $(NPM) start

run: ## Run both backend and frontend concurrently
	@echo "$(YELLOW)Starting both backend and frontend...$(NC)"
	@$(NPM) start

test-backend: ## Run backend tests
	@echo "$(YELLOW)Running backend tests...$(NC)"
	@source $(VENV_PATH)/bin/activate && python -m pytest

test-pdf: ## Test PDF parser
	@echo "$(YELLOW)Testing PDF parser...$(NC)"
	@source $(VENV_PATH)/bin/activate && python test_pdf_parser.py

test-csv: ## Test CSV import
	@echo "$(YELLOW)Testing CSV import...$(NC)"
	@source $(VENV_PATH)/bin/activate && python test_csv_import.py

test: test-backend test-pdf test-csv ## Run all tests

clean: ## Clean up generated files
	@echo "$(YELLOW)Cleaning up...$(NC)"
	@find . -type d -name __pycache__ -exec rm -rf {} +
	@find . -type f -name "*.pyc" -delete
	@rm -f $(DB_FILE)
	@echo "$(GREEN)Cleanup complete$(NC)"

clean-all: clean ## Clean everything including dependencies and build artifacts
	@echo "$(YELLOW)Removing node_modules...$(NC)"
	@rm -rf $(FRONTEND_DIR)/node_modules
	@echo "$(YELLOW)Removing virtual environment...$(NC)"
	@rm -rf $(VENV_PATH)
	@echo "$(YELLOW)Removing build directories...$(NC)"
	@rm -rf $(FRONTEND_DIR)/build
	@echo "$(GREEN)Deep cleanup complete$(NC)"

db-reset: ## Reset the database
	@echo "$(YELLOW)Resetting database...$(NC)"
	@rm -f $(DB_FILE)
	@echo "$(GREEN)Database reset$(NC)"

init: install db-reset ## Initialize the project from scratch (install dependencies and reset DB)
	@echo "$(GREEN)Project initialized successfully$(NC)"
	@echo "$(YELLOW)Run 'make run' to start the application$(NC)"