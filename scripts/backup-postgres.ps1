param(
  [string]$OutputDir = ".\backups",
  [string]$Service = "postgres"
)

$ErrorActionPreference = "Stop"

$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "privora" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "privora" }
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$backupPath = Join-Path $OutputDir "privora-$timestamp.sql"

docker compose exec -T $Service pg_dump `
  --username $dbUser `
  --dbname $dbName `
  --clean `
  --if-exists `
  --no-owner `
  --no-acl > $backupPath

if ($LASTEXITCODE -ne 0) {
  throw "Postgres backup failed with exit code $LASTEXITCODE"
}

Write-Host "Backup written to $backupPath"
