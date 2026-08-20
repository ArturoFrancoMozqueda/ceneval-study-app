param(
  [switch]$ConfirmProduction
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not $ConfirmProduction) {
  throw "Operación cancelada. Este comando lee la base remota. Ejecútalo únicamente con autorización expresa y agrega -ConfirmProduction."
}

$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$linkedProjectFile = Join-Path $repositoryRoot "supabase/.temp/project-ref"
if (-not (Test-Path -LiteralPath $linkedProjectFile -PathType Leaf)) {
  throw "El proyecto no está enlazado. Una persona autorizada debe ejecutar 'npm exec supabase -- link' antes del respaldo."
}

$cliName = if ($IsWindows) { "supabase.cmd" } else { "supabase" }
$cliPath = Join-Path $repositoryRoot "node_modules/.bin/$cliName"
if (-not (Test-Path -LiteralPath $cliPath -PathType Leaf)) {
  throw "Falta la CLI local fijada por package-lock.json. Ejecuta npm ci antes del respaldo."
}

$backupRoot = [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot "backups/supabase"))
$timestamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
$partialDirectory = Join-Path $backupRoot ("$timestamp.partial")
$finalDirectory = Join-Path $backupRoot $timestamp

New-Item -ItemType Directory -Path $partialDirectory | Out-Null

function Invoke-SupabaseDump {
  param([string[]]$Arguments)

  & $cliPath db dump --linked @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Supabase CLI terminó con código $LASTEXITCODE. El directorio parcial se conservó para diagnóstico."
  }
}

Write-Host "Iniciando lectura del proyecto Supabase enlazado. No se mostrarán credenciales ni identificadores."
Invoke-SupabaseDump -Arguments @("--role-only", "--file", (Join-Path $partialDirectory "roles.sql"))
Invoke-SupabaseDump -Arguments @("--file", (Join-Path $partialDirectory "schema.sql"))
Invoke-SupabaseDump -Arguments @(
  "--data-only",
  "--use-copy",
  "--exclude", "storage.buckets_vectors",
  "--exclude", "storage.vector_indexes",
  "--file", (Join-Path $partialDirectory "data.sql")
)

$cliVersion = (& $cliPath --version).Trim()
$fileEntries = foreach ($name in @("roles.sql", "schema.sql", "data.sql")) {
  $path = Join-Path $partialDirectory $name
  $file = Get-Item -LiteralPath $path
  [ordered]@{
    name = $name
    bytes = $file.Length
    sha256 = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
  }
}

[ordered]@{
  formatVersion = 1
  createdAtUtc = [DateTime]::UtcNow.ToString("o")
  source = "linked-supabase-project"
  cliVersion = $cliVersion
  files = @($fileEntries)
} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $partialDirectory "manifest.json") -Encoding utf8NoBOM

& (Join-Path $PSScriptRoot "verify-supabase-backup.ps1") -BackupDirectory $partialDirectory
Move-Item -LiteralPath $partialDirectory -Destination $finalDirectory

Write-Host "Respaldo lógico terminado: $finalDirectory"
Write-Host "Cópialo cifrado a una ubicación independiente y verifica esa copia antes de considerarlo un respaldo real."
