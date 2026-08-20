param(
  [Parameter(Mandatory = $true)]
  [string]$BackupDirectory
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$resolvedDirectory = [System.IO.Path]::GetFullPath($BackupDirectory)
if (-not (Test-Path -LiteralPath $resolvedDirectory -PathType Container)) {
  throw "No existe el directorio de respaldo indicado: $resolvedDirectory"
}

$manifestPath = Join-Path $resolvedDirectory "manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
  throw "Falta manifest.json; el respaldo está incompleto."
}

try {
  $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
} catch {
  throw "manifest.json no contiene JSON válido."
}

if ($manifest.formatVersion -ne 1) {
  throw "Versión de manifiesto no compatible: $($manifest.formatVersion)"
}

$expectedNames = @("roles.sql", "schema.sql", "data.sql")
$manifestNames = @($manifest.files | ForEach-Object { [string]$_.name })
if ($manifestNames.Count -ne $expectedNames.Count -or
    (Compare-Object -ReferenceObject $expectedNames -DifferenceObject $manifestNames)) {
  throw "El manifiesto debe describir exactamente roles.sql, schema.sql y data.sql."
}

foreach ($expectedName in $expectedNames) {
  $entry = @($manifest.files | Where-Object { $_.name -eq $expectedName })
  if ($entry.Count -ne 1) {
    throw "El manifiesto contiene una entrada ausente o duplicada para $expectedName."
  }

  $filePath = Join-Path $resolvedDirectory $expectedName
  if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
    throw "Falta $expectedName; el respaldo está incompleto."
  }

  $file = Get-Item -LiteralPath $filePath
  if ($file.Length -le 0) {
    throw "$expectedName está vacío."
  }
  if ([int64]$entry[0].bytes -ne $file.Length) {
    throw "El tamaño de $expectedName no coincide con el manifiesto."
  }

  $actualHash = (Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash.ToLowerInvariant()
  $expectedHash = ([string]$entry[0].sha256).ToLowerInvariant()
  if ($actualHash -ne $expectedHash) {
    throw "La suma SHA-256 de $expectedName no coincide; el archivo cambió o está dañado."
  }
}

Write-Host "Respaldo íntegro según su manifiesto: $resolvedDirectory"
