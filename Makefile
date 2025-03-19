SHELL := /bin/bash
COMPOSE_FILE := ./docker/docker-compose.yml
PROJECT_NAME := "lib-images-sizes"
COMPOSE := docker compose -f $(COMPOSE_FILE) --project-name $(PROJECT_NAME)

.PHONY: install dev test build clean lint format help commit

# Helper function to run commands in dev container
define run_in_dev	
  @if [ "$(IN_DEV_CONTAINER)" = "true" ]; then \
    $(1); \
  else \
    if [ $$( $(COMPOSE) ps --status running --services | grep -c dev) -gt 0 ]; then \
      echo "Container already running, executing directly..."; \
      $(COMPOSE) exec dev $(1); \
    else \
      echo "Starting and running command in new container..."; \
      $(COMPOSE) run --rm --service-ports dev $(1) && \
      echo "Stopping container..." && \
      $(COMPOSE) down --remove-orphans; \
    fi; \
  fi
endef

install: ## Install dependencies
	$(call run_in_dev,pnpm install)

dev: ## Start development mode
	$(call run_in_dev,pnpm dev)

bash: ## Attach to running container or start new instance with DB
	$(call run_in_dev,bash)

stop: ## Stop the development container
	@if [ "$(IN_DEV_CONTAINER)" = "true" ]; then \
		exit 0; \
	else \
		$(COMPOSE) down --remove-orphans; \
	fi

test: ## Run tests
	$(call run_in_dev,pnpm test)

build: ## Build the library
	$(call run_in_dev,pnpm build)

lint: ## Run linter
	$(call run_in_dev,pnpm lint)

format: ## Format code
	$(call run_in_dev,pnpm format)

clean: ## Clean build artifacts
	$(call run_in_dev,pnpm clean)

commit: ## Create a commit using conventional commit format
	$(call run_in_dev,pnpm commit)

run: ## Run arbitrary command in dev container e.g., make run cmd="pnpm add -D typescript"
	$(call run_in_dev,$(cmd))

docker-build: ## Build Docker images
	$(COMPOSE) build

docker-build-force: ## Build Docker images forcefully
	$(COMPOSE) build --no-cache

docker-clean: ## Remove Docker containers and volumes
	$(COMPOSE) down -v --remove-orphans

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help 