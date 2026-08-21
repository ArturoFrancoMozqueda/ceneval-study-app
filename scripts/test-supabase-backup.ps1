Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("ceneval-backup-test-" + [guid]::NewGuid().ToString("N") + " ruta con espacios")
$verifyScript = Join-Path $PSScriptRoot "verify-supabase-backup.ps1"
$backupScript = Join-Path $PSScriptRoot "backup-supabase.ps1"

function New-SyntheticBackup {
  param([Parameter(Mandatory = $true)][string]$Directory)

  New-Item -ItemType Directory -Path $Directory | Out-Null

  $fileEntries = foreach ($name in @("roles.sql", "schema.sql", "data.sql")) {
    $path = Join-Path $Directory $name
    "-- artefacto SQL sintético para probar integridad`nSELECT 1;" | Set-Content -LiteralPath $path -Encoding utf8NoBOM
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
    source = "synthetic-local-test"
    cliVersion = "test"
    files = @($fileEntries)
  } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $Directory "manifest.json") -Encoding utf8NoBOM
}

function Copy-SyntheticBackup {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
  )

  Copy-Item -LiteralPath $Source -Destination $Destination -Recurse
}

function Assert-VerificationFails {
  param(
    [Parameter(Mandatory = $true)][string]$Directory,
    [Parameter(Mandatory = $true)][string]$CaseName
  )

  $null = & pwsh -NoProfile -File $verifyScript -BackupDirectory $Directory 2>&1
  if ($LASTEXITCODE -eq 0) {
    throw "La verificación aceptó el caso inválido: $CaseName."
  }
}

try {
  New-Item -ItemType Directory -Path $testRoot | Out-Null
  $validDirectory = Join-Path $testRoot "válido"
  New-SyntheticBackup -Directory $validDirectory
  & $verifyScript -BackupDirectory $validDirectory

  $tamperedDirectory = Join-Path $testRoot "alterado"
  Copy-SyntheticBackup -Source $validDirectory -Destination $tamperedDirectory
  Add-Content -LiteralPath (Join-Path $tamperedDirectory "data.sql") -Value "-- alterado"
  Assert-VerificationFails -Directory $tamperedDirectory -CaseName "contenido distinto del SHA-256"

  $malformedDirectory = Join-Path $testRoot "json-inválido"
  Copy-SyntheticBackup -Source $validDirectory -Destination $malformedDirectory
  "{" | Set-Content -LiteralPath (Join-Path $malformedDirectory "manifest.json") -Encoding utf8NoBOM
  Assert-VerificationFails -Directory $malformedDirectory -CaseName "manifest.json inválido"

  $unsupportedDirectory = Join-Path $testRoot "versión-no-soportada"
  Copy-SyntheticBackup -Source $validDirectory -Destination $unsupportedDirectory
  $unsupportedManifest = Get-Content -LiteralPath (Join-Path $unsupportedDirectory "manifest.json") -Raw | ConvertFrom-Json
  $unsupportedManifest.formatVersion = 2
  $unsupportedManifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $unsupportedDirectory "manifest.json") -Encoding utf8NoBOM
  Assert-VerificationFails -Directory $unsupportedDirectory -CaseName "versión de manifiesto no soportada"

  $missingDirectory = Join-Path $testRoot "archivo-ausente"
  Copy-SyntheticBackup -Source $validDirectory -Destination $missingDirectory
  Remove-Item -LiteralPath (Join-Path $missingDirectory "schema.sql")
  Assert-VerificationFails -Directory $missingDirectory -CaseName "archivo SQL ausente"

  $emptyDirectory = Join-Path $testRoot "archivo-vacío"
  Copy-SyntheticBackup -Source $validDirectory -Destination $emptyDirectory
  Clear-Content -LiteralPath (Join-Path $emptyDirectory "roles.sql")
  Assert-VerificationFails -Directory $emptyDirectory -CaseName "archivo SQL vacío"

  $traversalDirectory = Join-Path $testRoot "nombre-no-permitido"
  Copy-SyntheticBackup -Source $validDirectory -Destination $traversalDirectory
  $traversalManifest = Get-Content -LiteralPath (Join-Path $traversalDirectory "manifest.json") -Raw | ConvertFrom-Json
  $traversalManifest.files[0].name = "../roles.sql"
  $traversalManifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $traversalDirectory "manifest.json") -Encoding utf8NoBOM
  Assert-VerificationFails -Directory $traversalDirectory -CaseName "nombre de archivo fuera de la allowlist"

  $duplicateDirectory = Join-Path $testRoot "entrada-duplicada"
  Copy-SyntheticBackup -Source $validDirectory -Destination $duplicateDirectory
  $duplicateManifest = Get-Content -LiteralPath (Join-Path $duplicateDirectory "manifest.json") -Raw | ConvertFrom-Json
  $duplicateManifest.files = @($duplicateManifest.files) + @($duplicateManifest.files[0])
  $duplicateManifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $duplicateDirectory "manifest.json") -Encoding utf8NoBOM
  Assert-VerificationFails -Directory $duplicateDirectory -CaseName "entrada duplicada"

  $backupScriptText = Get-Content -LiteralPath $backupScript -Raw
  if ($backupScriptText -match '(?i)\bInvoke-Expression\b|\bStart-Process\b|\bcmd(?:\.exe)?\s+/c\b') {
    throw "El exportador contiene una invocación de shell no permitida."
  }
  if ($backupScriptText -notmatch '& \$cliPath db dump --linked @Arguments' -or
      $backupScriptText -match '(?i)--db-url') {
    throw "El exportador debe invocar la CLI local con --linked y sin aceptar una URL de base como argumento."
  }
  if ($backupScriptText.IndexOf('if (-not $ConfirmProduction)', [System.StringComparison]::Ordinal) -lt 0 -or
      $backupScriptText.IndexOf('if (-not $ConfirmProduction)', [System.StringComparison]::Ordinal) -gt
      $backupScriptText.IndexOf('New-Item -ItemType Directory -Path $partialDirectory', [System.StringComparison]::Ordinal)) {
    throw "La confirmación de producción debe evaluarse antes de crear artefactos del respaldo."
  }

  Write-Host "Prueba local aprobada: manifiesto válido, siete rechazos fail-closed y llamada remota sin shell interpolado."
} finally {
  $resolvedTestRoot = [System.IO.Path]::GetFullPath($testRoot)
  $resolvedTempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
  if ($resolvedTestRoot.StartsWith($resolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
      (Split-Path -Leaf $resolvedTestRoot).StartsWith("ceneval-backup-test-")) {
    Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
