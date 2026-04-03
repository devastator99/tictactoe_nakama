extract-backend:
	cd nakama/data/modules && if npm run | grep -q "extract"; then npm run extract; else echo "No extract script defined in nakama/data/modules/package.json"; fi
extract-mobile:
	cd LIVAMobile && if npm run | grep -q "extract"; then npm run extract; else echo "No extract script defined in LIVAMobile/package.json"; fi
.PHONY: local-up local-down local-logs frontend-dev frontend-build frontend-lint nakama-build smoke check frontend-test frontend-e2e mobile-install mobile-android mobile-ios mobile-build scalability-check

local-up:
	cd nakama/data/modules && npm run build
	cd nakama && docker-compose up -d

local-down:
	cd nakama && docker-compose down

local-logs:
	cd nakama && docker-compose logs -f

local-logs-nakama:
	cd nakama && docker-compose logs -f nakama

local-logs-postgres:
	cd nakama && docker-compose logs -f postgres

local-logs-redis:
	cd nakama && docker-compose logs -f redis

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

frontend-test:
	cd frontend && npm run test

frontend-e2e:
	cd frontend && npm run test:e2e

nakama-build:
	cd nakama/data/modules && npm run build


extract:
	cd frontend && if npm run | grep -q "extract"; then npm run extract; else echo "No extract script defined in frontend/package.json"; fi

smoke:
	cd frontend && npm run smoke

check:
	cd nakama/data/modules && npm test
	cd frontend && npm run lint
	cd frontend && npm run build

# React Native Mobile App
mobile-install:
	cd LIVAMobile && npm install

mobile-android:
	cd LIVAMobile && npm run android

mobile-ios:
	cd LIVAMobile && npm run ios

mobile-lint:
	cd LIVAMobile && npm run lint

mobile-test:
	cd LIVAMobile && npm run test

# Backend Analysis
scalability-check:
	cd nakama/data/modules && npm run test:scalability

# Full check (web + backend)
full-check:
	cd nakama/data/modules && npm test
	cd frontend && npm run lint && npm run build
	cd LIVAMobile && npm run lint