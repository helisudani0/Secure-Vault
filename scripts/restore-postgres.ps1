param(
  [Parameter(Mandatory = $true)]
  [string]$InputFile,
  [string]$Service = "postgres",
  [switch]$Yes
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $InputFile)) {
  throw "Backup file not found: $InputFile"
}

if (-not $Yes) {
  $answer = Read-Host "Restore will overwrite database objects. Type RESTORE to continue"
  if ($answer -ne "RESTORE") {
    Write-Host "Restore cancelled"
    exit 1
  }
}

$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "ciphra" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "ciphra" }

Get-Content -Raw -LiteralPath $InputFile | docker compose exec -T $Service psql `
  --username $dbUser `
  --dbname $dbName

if ($LASTEXITCODE -ne 0) {
  throw "Postgres restore failed with exit code $LASTEXITCODE"
}

Write-Host "Restore completed from $InputFile"
