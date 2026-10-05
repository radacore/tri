.PHONY: dev build deploy-dev deploy-prod
dev:
	@echo "API:     (cd backend && go run ./cmd/server)"
	@echo "Landing: (cd frontend && npm run preview -- --port 4321)"
	@echo "Admin:   (cd admin && npm run dev)"
build:
	cd backend && go build -o /tmp/brandingpulse-api ./cmd/server
	cd frontend && npm run build
	cd admin && npm run build
deploy-dev:
	SERVER=$${SERVER:?set SERVER=user@ip} ./deploy/deploy.sh dev
deploy-prod:
	SERVER=$${SERVER:?set SERVER=user@ip} ./deploy/deploy.sh prod $${TAG:?set TAG=vX.Y.Z}
