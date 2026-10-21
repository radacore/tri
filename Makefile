.PHONY: dev build test deploy-dev deploy-prod

dev:
	@echo "API:     (cd backend && go run ./cmd/server)"
	@echo "Landing: (cd frontend && npm run dev)"
	@echo "Admin:   (cd admin && npm run dev)"

build:
	cd backend && go build -o /tmp/brandingpulse-api ./cmd/server
	cd frontend && npm run build
	cd admin && npm run build

test:
	cd backend && go test ./...

deploy-dev:
	SERVER=$${SERVER:?set SERVER=user@ip} ./deploy/deploy.sh dev

deploy-prod:
	SERVER=$${SERVER:?set SERVER=user@ip} ./deploy/deploy.sh prod $${TAG:?set TAG=vX.Y.Z}
