function Test-ExactWorkspaceNextStart {
  param(
    [Parameter(Mandatory)] $Process,
    [Parameter(Mandatory)] [string] $ExpectedNextCli
  )

  if ($Process.Name -notin @("node.exe", "node")) { return $false }
  if ([string]::IsNullOrWhiteSpace($Process.CommandLine)) { return $false }

  $exactStart = [regex]::new(
    '(?:^|\s)(?:"(?<quoted>[^"]+)"|(?<bare>\S+))\s+start\s+--hostname\s+127\.0\.0\.1\s+--port\s+3000\s*$',
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
    $resolvedCli = [IO.Path]::GetFullPath($cliToken.Replace("/", "\"))
    $resolvedExpected = [IO.Path]::GetFullPath($ExpectedNextCli.Replace("/", "\"))
  } catch {
    return $false
  }
  return $resolvedCli.Equals(
    $resolvedExpected,
    [System.StringComparison]::OrdinalIgnoreCase
  )
}

function Select-NewWorkspaceNextTree {
  param(
    [Parameter(Mandatory)] [array] $Processes,
    [Parameter(Mandatory)] [System.Collections.Generic.HashSet[int]] $PreexistingPids,
    [Parameter(Mandatory)] [string] $ExpectedNextCli
  )

  $newProcesses = @($Processes | Where-Object {
    -not $PreexistingPids.Contains([int]$_.ProcessId)
  })
  $roots = @($newProcesses | Where-Object {
    Test-ExactWorkspaceNextStart -Process $_ -ExpectedNextCli $ExpectedNextCli
  })
  $selected = [System.Collections.Generic.List[object]]::new()
  $selectedPids = [System.Collections.Generic.HashSet[int]]::new()

  function Add-SafeDescendants {
    param([int] $ParentId)
    $children = @($newProcesses | Where-Object {
      [int]$_.ParentProcessId -eq $ParentId -and
      $_.Name -in @("node.exe", "node", "cmd.exe", "cmd")
    })
    foreach ($child in $children) {
      Add-SafeDescendants -ParentId ([int]$child.ProcessId)
      if ($selectedPids.Add([int]$child.ProcessId)) { $selected.Add($child) }
    }
  }

  foreach ($root in $roots) {
    Add-SafeDescendants -ParentId ([int]$root.ProcessId)
    if ($selectedPids.Add([int]$root.ProcessId)) { $selected.Add($root) }
  }
  return $selected.ToArray()
}

function Stop-NewWorkspaceNextTree {
  param(
    [Parameter(Mandatory)] [System.Collections.Generic.HashSet[int]] $PreexistingPids,
    [Parameter(Mandatory)] [string] $ExpectedNextCli
  )

  $currentProcesses = @(Get-CimInstance Win32_Process -ErrorAction Stop)
  $targets = @(Select-NewWorkspaceNextTree `
    -Processes $currentProcesses `
    -PreexistingPids $PreexistingPids `
    -ExpectedNextCli $ExpectedNextCli)
  foreach ($target in $targets) {
    Stop-Process -Id ([int]$target.ProcessId) -Force -ErrorAction Stop
  }
}
