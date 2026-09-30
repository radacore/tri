.PHONY: dev up down logs build
dev:
	docker compose up --build
up:
	docker compose -f docker-compose.prod.yml up -d --build
down:
	docker compose down
logs:
	docker compose logs -f api
