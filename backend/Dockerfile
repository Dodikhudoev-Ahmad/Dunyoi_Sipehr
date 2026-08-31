FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Cache-buster: Railway's build cache was observed reusing a stale "COPY . ." / "dotnet publish"
# layer across multiple pushes (Build Logs showed both steps as "cached" even though the source
# tree had genuinely changed — new controllers stayed missing from the running image through
# several redeploys, 2026-08-31 incident). An ARG with a value that changes every push forces
# Docker to treat this layer, and everything after it, as invalidated regardless of how Railway
# hashes the copied context. Bump the value below on every deploy until Railway's cache behavior
# is confirmed fixed; a real value (git SHA, timestamp) works just as well as this one.
ARG CACHEBUST=20260831-1720

COPY . .
RUN dotnet publish Api/AeroTravel.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "AeroTravel.Api.dll"]
