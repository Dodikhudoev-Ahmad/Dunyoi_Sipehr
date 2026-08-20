# AeroTravel

Premium travel/aviation agency platform — public marketing site with lead-generation (Travel Request) and an admin CMS.

See `docs/MASTER_TZ.md` for the full specification, `docs/PROGRESS.md` for build status, and `docs/BLOCKERS.md` for known external dependencies (credentials/accounts not yet provisioned).

## Structure

```
backend/    ASP.NET Core Clean Architecture API (Domain/Application/Infrastructure/Api/Tests)
frontend/   React + TypeScript + Vite
docs/       Specification and living architecture docs
```

## Local Development

### Backend
```
cd backend
cp Api/appsettings.Development.json.example Api/appsettings.Development.json  # if present
dotnet restore
dotnet ef database update -p Infrastructure -s Api
dotnet run --project Api
```

### Frontend
```
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Tests
```
cd backend && dotnet test
cd frontend && npm run lint && npm run build
```
