$ErrorActionPreference = "Stop"

$workspaceRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$cleanupHelper = (Resolve-Path -LiteralPath (
  Join-Path $PSScriptRoot "lib\local-process-cleanup.ps1"
)).Path
$expectedNextCli = (Resolve-Path -LiteralPath (
  Join-Path $workspaceRoot "node_modules\next\dist\bin\next"
)).Path
$nodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
$workspacePrefix = $workspaceRoot.TrimEnd("\") + "\"
if (-not $expectedNextCli.StartsWith(
  $workspacePrefix,
  [System.StringComparison]::OrdinalIgnoreCase
)) {
  throw "El ejecutable de Next resuelto no pertenece al workspace actual."
}
. $cleanupHelper

$e2ePort = 3100
$expectedBaseUrl = "http://127.0.0.1:$e2ePort"
if ([string]::IsNullOrWhiteSpace($env:E2E_BASE_URL)) {
  $env:E2E_BASE_URL = $expectedBaseUrl
}
try {
  $baseUri = [Uri]$env:E2E_BASE_URL
} catch {
  throw "E2E_BASE_URL no es una URL local válida."
}
if ($baseUri.Scheme -ne "http" -or $baseUri.Host -ne "127.0.0.1" -or
    $baseUri.Port -ne $e2ePort -or $baseUri.AbsolutePath -ne "/" -or
    $baseUri.Query -or $baseUri.Fragment -or $baseUri.UserInfo -or
    $env:E2E_BASE_URL.TrimEnd("/") -ne $expectedBaseUrl) {
  throw "E2E_BASE_URL debe ser exactamente el origen local dedicado esperado."
}
$e2eBaseUrl = $expectedBaseUrl

# El helper conserva la selección del árbol; esta redefinición acota su raíz
# al puerto dedicado de esta ejecución sin relajar workspace ni argumentos.
function Test-ExactWorkspaceNextStart {
  param(
    [Parameter(Mandatory)] $Process,
    [Parameter(Mandatory)] [string] $ExpectedNextCli
  )

  if ($Process.Name -notin @("node.exe", "node")) { return $false }
  if ([string]::IsNullOrWhiteSpace($Process.CommandLine)) { return $false }
  $portPattern = [regex]::Escape($e2ePort.ToString())
  $exactStart = [regex]::new(
    '(?:^|\s)(?:"(?<quoted>[^"]+)"|(?<bare>\S+))\s+start\s+--hostname\s+127\.0\.0\.1\s+--port\s+' + $portPattern + '\s*$',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )
  $match = $exactStart.Match($Process.CommandLine)
  if (-not $match.Success) { return $false }
  $cliToken = if ($match.Groups["quoted"].Success) {
    $match.Groups["quoted"].Value
  } else {
    $match.Groups["bare"].Value
  }
  try {
    $resolvedCli = Resolve-ComparableProcessPath -Path $cliToken
    $resolvedExpected = Resolve-ComparableProcessPath -Path $ExpectedNextCli
  } catch {
    return $false
  }
  return $resolvedCli.Equals(
    $resolvedExpected,
    [System.StringComparison]::OrdinalIgnoreCase
  )
}

function Assert-LocalPortAvailable {
  $probe = [System.Net.Sockets.TcpClient]::new()
  try {
    $probe.Connect("127.0.0.1", $e2ePort)
    if ($probe.Connected) {
      throw "El puerto IPv4 local dedicado ya está ocupado; el E2E no reutilizará un servidor ajeno."
    }
  } catch [System.Net.Sockets.SocketException] {
    return
  } finally {
    $probe.Dispose()
  }
}

function Wait-OwnedServerReady {
  param([Parameter(Mandatory)] [System.Diagnostics.Process] $ServerProcess)

  $deadline = [DateTimeOffset]::UtcNow.AddSeconds(60)
  while ([DateTimeOffset]::UtcNow -lt $deadline) {
    if ($ServerProcess.HasExited) {
      throw "El servidor Next local terminó antes de estar listo."
    }
    $process = Get-CimInstance Win32_Process -Filter (
      "ProcessId = {0}" -f $ServerProcess.Id
    ) -ErrorAction SilentlyContinue
    if (-not $process -or -not (Test-ExactWorkspaceNextStart `
      -Process $process `
      -ExpectedNextCli $expectedNextCli)) {
      throw "El proceso iniciado no coincide con Next del workspace actual."
    }
    try {
      $response = Invoke-WebRequest `
        -Uri "$e2eBaseUrl/api/health/live" `
        -Method Get `
        -TimeoutSec 2 `
        -UseBasicParsing
      $body = $response.Content | ConvertFrom-Json
      if ($response.StatusCode -eq 200 -and $body.status -eq "live" -and
          $response.Headers["Cache-Control"] -match "no-store") {
        return
      }
    } catch {
      Start-Sleep -Milliseconds 250
    }
  }
  throw "Next no respondió con el health local esperado en 60 segundos."
}

$mutex = [System.Threading.Mutex]::new($false, "Local\CenevalStudyE2EPort3100")
$mutexOwned = $false
$serverProcess = $null
$preexistingPids = $null
$testExitCode = 1
try {
  try {
    $mutexOwned = $mutex.WaitOne(0)
  } catch [System.Threading.AbandonedMutexException] {
    $mutexOwned = $true
  }
  if (-not $mutexOwned) {
    throw "Ya existe otra ejecución E2E local sobre el puerto dedicado."
  }

  Assert-LocalPortAvailable
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw "El build requerido por E2E falló." }

  $preexistingPids = [System.Collections.Generic.HashSet[int]]::new()
  Get-CimInstance Win32_Process -ErrorAction Stop | ForEach-Object {
    [void]$preexistingPids.Add([int]$_.ProcessId)
  }

  $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = $nodeExecutable
  $startInfo.WorkingDirectory = $workspaceRoot
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  foreach ($argument in @(
    $expectedNextCli,
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    $e2ePort.ToString()
  )) {
    [void]$startInfo.ArgumentList.Add($argument)
  }
  $serverProcess = [System.Diagnostics.Process]::Start($startInfo)
  if (-not $serverProcess) { throw "No se pudo iniciar Next local." }
  Wait-OwnedServerReady -ServerProcess $serverProcess

  $env:PYTHONDONTWRITEBYTECODE = "1"
  & python scripts/test-study-e2e.py
  $testExitCode = $LASTEXITCODE
} finally {
  try {
    if ($null -ne $serverProcess -and -not $serverProcess.HasExited) {
      $serverProcess.Kill($true)
      [void]$serverProcess.WaitForExit(5000)
    }
    if ($null -ne $preexistingPids) {
      Stop-NewWorkspaceNextTree `
        -PreexistingPids $preexistingPids `
        -ExpectedNextCli $expectedNextCli
    }
  } finally {
    if ($mutexOwned) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
  }
}
exit $testExitCode
