$ErrorActionPreference = "Stop"

$workspaceRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$cleanupHelper = (Resolve-Path -LiteralPath (
  Join-Path $PSScriptRoot "lib\local-process-cleanup.ps1"
)).Path
$expectedNextCli = (Resolve-Path -LiteralPath (
  Join-Path $workspaceRoot "node_modules\next\dist\bin\next"
)).Path
$workspacePrefix = $workspaceRoot.TrimEnd("\") + "\"
if (-not $expectedNextCli.StartsWith(
  $workspacePrefix,
  [System.StringComparison]::OrdinalIgnoreCase
)) {
  throw "El ejecutable de Next resuelto no pertenece al workspace actual."
}
. $cleanupHelper

$serverRunner = Join-Path $env:USERPROFILE ".codex\skills\webapp-testing\scripts\with_server.py"
if (-not (Test-Path -LiteralPath $serverRunner -PathType Leaf)) {
  throw "No se encontró el runner de webapp-testing en la instalación local de Codex."
}

& npm.cmd run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$preexistingPids = [System.Collections.Generic.HashSet[int]]::new()
Get-CimInstance Win32_Process -ErrorAction Stop | ForEach-Object {
  [void]$preexistingPids.Add([int]$_.ProcessId)
}

$testExitCode = 1
try {
  & python $serverRunner `
    --server "npm.cmd run start -- --hostname 127.0.0.1 --port 3000" `
    --port 3000 `
    --timeout 60 `
    -- python scripts/test-study-e2e.py
  $testExitCode = $LASTEXITCODE
} finally {
  Stop-NewWorkspaceNextTree `
    -PreexistingPids $preexistingPids `
    -ExpectedNextCli $expectedNextCli
}
exit $testExitCode
