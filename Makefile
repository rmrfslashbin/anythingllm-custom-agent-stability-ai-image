# Configuration
YARN := yarn
NODE := node
PROJECT := stability-ai-image
TARBALL := $(PROJECT).tar

# Directories
ARTIFACT_DIR := artifacts
OUTPUT_DIR := output
DOC_DIR := docs/api

# Ensure directories exist
$(ARTIFACT_DIR):
	mkdir -p $(ARTIFACT_DIR)

$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

$(DOC_DIR):
	mkdir -p $(DOC_DIR)

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

# Generate documentation
.PHONY: docs
docs: $(DOC_DIR)
	$(YARN) jsdoc -c jsdoc.config.json

# Watch for documentation changes
.PHONY: docs-watch
docs-watch: $(DOC_DIR)
	$(YARN) jsdoc -c jsdoc.config.json -w

# Serve documentation (requires http-server)
.PHONY: docs-serve
docs-serve: docs
	npx http-server $(DOC_DIR) -p 8080

# Check documentation coverage
.PHONY: docs-coverage
docs-coverage:
	$(YARN) jsdoc -c jsdoc.config.json -X > $(ARTIFACT_DIR)/docs-coverage.json
	$(NODE) -e "const coverage = require('./$(ARTIFACT_DIR)/docs-coverage.json'); \
		const total = coverage.length; \
		const documented = coverage.filter(item => item.description).length; \
		console.log(\`Documentation coverage: \${Math.round(documented/total*100)}% (\${documented}/\${total})\`);"

# Clean documentation
.PHONY: docs-clean
docs-clean:
	rm -rf $(DOC_DIR)

# Clean build artifacts and temporary files
.PHONY: clean
clean:
	rm -rf node_modules
	rm -rf $(ARTIFACT_DIR)
	rm -rf $(OUTPUT_DIR)
	rm -rf $(DOC_DIR)
	rm -f yarn-error.log
	rm -f .DS_Store
	find . -name "*.log" -exec rm {} \;

# Deep clean - remove all generated and cached files
.PHONY: distclean
distclean: clean
	rm -f package-lock.json
	rm -f yarn.lock
	rm -f .env*

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
		--exclude='$(PROJECT)/$(DOC_DIR)' \
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
validate: lint test docs-coverage

# Show help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  all           - Install dependencies and run tests"
	@echo "  install      - Install project dependencies"
	@echo "  test         - Run test suite"
	@echo "  lint         - Run linter"
	@echo "  format       - Format code"
	@echo "  docs         - Generate documentation"
	@echo "  docs-watch   - Watch and regenerate documentation on changes"
	@echo "  docs-serve   - Serve documentation on http://localhost:8080"
	@echo "  docs-coverage- Check documentation coverage"
	@echo "  docs-clean   - Remove generated documentation"
	@echo "  clean        - Remove build artifacts and temporary files"
	@echo "  distclean    - Deep clean, including dependencies and lock files"
	@echo "  run          - Run the application"
	@echo "  tarball      - Create a tarball for AI analysis"
	@echo "  validate     - Run all validation checks"
	@echo "  help         - Show this help message"