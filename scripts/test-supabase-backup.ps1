Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("ceneval-backup-test-" + [guid]::NewGuid().ToString("N"))
$verifyScript = Join-Path $PSScriptRoot "verify-supabase-backup.ps1"

try {
  New-Item -ItemType Directory -Path $testRoot | Out-Null

  $fileEntries = foreach ($name in @("roles.sql", "schema.sql", "data.sql")) {
    $path = Join-Path $testRoot $name
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
  } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $testRoot "manifest.json") -Encoding utf8NoBOM

  & $verifyScript -BackupDirectory $testRoot

  Add-Content -LiteralPath (Join-Path $testRoot "data.sql") -Value "-- alterado"
  $tamperOutput = & pwsh -NoProfile -File $verifyScript -BackupDirectory $testRoot 2>&1
  $tamperExitCode = $LASTEXITCODE
  if ($tamperExitCode -eq 0) {
    throw "La verificación no detectó la alteración deliberada de data.sql."
  }

  Write-Host "Prueba local aprobada: se acepta un manifiesto íntegro y se rechaza un archivo alterado."
} finally {
  $resolvedTestRoot = [System.IO.Path]::GetFullPath($testRoot)
  $resolvedTempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
  if ($resolvedTestRoot.StartsWith($resolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
      (Split-Path -Leaf $resolvedTestRoot).StartsWith("ceneval-backup-test-")) {
    Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
