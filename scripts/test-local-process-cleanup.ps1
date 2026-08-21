$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "lib\local-process-cleanup.ps1")

$expectedNextCli = "C:\workspace\node_modules\next\dist\bin\next"
$exactCommand = '"C:\Program Files\node.exe" "C:\workspace\node_modules\.bin\..\next\dist\bin\next" start --hostname 127.0.0.1 --port 3000'
$canonicalCommand = '"C:\Program Files\node.exe" "C:\workspace\node_modules\next\dist\bin\next" start --hostname 127.0.0.1 --port 3000'
$processes = @(
  [pscustomobject]@{ ProcessId = 100; ParentProcessId = 10; Name = "node.exe"; CommandLine = $canonicalCommand },
  [pscustomobject]@{ ProcessId = 200; ParentProcessId = 20; Name = "node.exe"; CommandLine = $exactCommand },
  [pscustomobject]@{ ProcessId = 201; ParentProcessId = 200; Name = "cmd.exe"; CommandLine = "cmd /c child" },
  [pscustomobject]@{ ProcessId = 300; ParentProcessId = 30; Name = "node.exe"; CommandLine = 'node "C:\other\node_modules\next\dist\bin\next" start --hostname 127.0.0.1 --port 3000' },
  [pscustomobject]@{ ProcessId = 400; ParentProcessId = 40; Name = "node.exe"; CommandLine = "node ipv6-listener.js --port 3000" }
)
$preexisting = [System.Collections.Generic.HashSet[int]]::new()
[void]$preexisting.Add(100)
[void]$preexisting.Add(400)

$selected = @(Select-NewWorkspaceNextTree `
  -Processes $processes `
  -PreexistingPids $preexisting `
  -ExpectedNextCli $expectedNextCli)
$selectedIds = @($selected | ForEach-Object { [int]$_.ProcessId })
if (($selectedIds -join ",") -ne "201,200") {
  throw "El filtro no aisló exclusivamente el árbol Next nuevo esperado."
}
if ($selectedIds -contains 100 -or $selectedIds -contains 400) {
  throw "El filtro seleccionó un PID preexistente."
}

Write-Output "[OK] Cleanup selecciona solo el árbol Next nuevo del workspace."
