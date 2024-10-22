# File: stability-ai-image/Makefile

# Configuration
YARN := yarn
NODE := node
PROJECT := stability-ai-image
TARBALL := $(PROJECT).tar

# Directories
ARTIFACT_DIR := artifacts
OUTPUT_DIR := output

# Ensure artifact directory exists
$(ARTIFACT_DIR):
	mkdir -p $(ARTIFACT_DIR)

# Default target
.PHONY: all
all: install test

# Install dependencies
.PHONY: install
install:
	$(YARN) install

# Run tests
.PHONY: test
test:
	$(YARN) test

# Run linting
.PHONY: lint
lint:
	$(YARN) lint

# Format code
.PHONY: format
format:
	$(YARN) format

# Clean build artifacts and temporary files
.PHONY: clean
clean:
	rm -rf node_modules
	rm -rf $(ARTIFACT_DIR)
	rm -rf $(OUTPUT_DIR)
	rm -f yarn-error.log
	rm -f .DS_Store
	find . -name "*.log" -exec rm {} \;

# Deep clean - remove all generated and cached files
.PHONY: distclean
distclean: clean
	rm -f package-lock.json
	rm -f yarn.lock
	rm -f .env*

# Create output directory
$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

# Run the application
.PHONY: run
run: $(OUTPUT_DIR)
	$(NODE) run.js

# Create a tarball suitable for AI analysis
.PHONY: tarball
tarball: $(ARTIFACT_DIR)
	cd .. && tar --exclude-vcs \
		--exclude='$(PROJECT)/node_modules' \
		--exclude='$(PROJECT)/.env*' \
		--exclude='$(PROJECT)/$(ARTIFACT_DIR)' \
		--exclude='$(PROJECT)/$(OUTPUT_DIR)' \
		--exclude='$(PROJECT)/*.log' \
		--exclude='$(PROJECT)/.DS_Store' \
		--exclude='$(PROJECT)/yarn.lock' \
		--exclude='$(PROJECT)/package-lock.json' \
		--exclude='$(PROJECT)/*.tar' \
		--exclude='$(PROJECT)/*.gz' \
		--exclude='$(PROJECT)/*.zip' \
		--exclude='$(PROJECT)/coverage' \
		--exclude='$(PROJECT)/.nyc_output' \
		--exclude='$(PROJECT)/.vscode' \
		--exclude='$(PROJECT)/.idea' \
		-cf $(PROJECT)/$(ARTIFACT_DIR)/$(TARBALL) $(PROJECT)

# Validate the project (run all checks)
.PHONY: validate
validate: lint test

# Show help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  all        - Install dependencies and run tests"
	@echo "  install    - Install project dependencies"
	@echo "  test       - Run test suite"
	@echo "  lint       - Run linter"
	@echo "  format     - Format code"
	@echo "  clean      - Remove build artifacts and temporary files"
	@echo "  distclean  - Deep clean, including dependencies and lock files"
	@echo "  run        - Run the application"
	@echo "  tarball    - Create a tarball for AI analysis"
	@echo "  validate   - Run all validation checks"
	@echo "  help       - Show this help message"
