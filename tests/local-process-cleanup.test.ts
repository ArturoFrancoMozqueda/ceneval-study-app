import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const runner = readFileSync(
  new URL("../scripts/run-study-e2e.ps1", import.meta.url),
  "utf8",
);
const helper = readFileSync(
  new URL("../scripts/lib/local-process-cleanup.ps1", import.meta.url),
  "utf8",
);

test("resuelve workspace, serializa el puerto e inicia Next sin shell ni pipes", () => {
  assert.match(runner, /Resolve-Path[^\n]+Join-Path \$PSScriptRoot "\.\."/);
  assert.match(runner, /node_modules\\next\\dist\\bin\\next/);
  assert.match(runner, /StartsWith\([\s\S]*OrdinalIgnoreCase/);
  assert.ok(
    runner.indexOf("Get-CimInstance Win32_Process") <
      runner.indexOf("[System.Diagnostics.Process]::Start($startInfo)"),
  );
  assert.match(runner, /\$e2ePort = 3100/);
  assert.match(runner, /\$expectedBaseUrl = "http:\/\/127\.0\.0\.1:\$e2ePort"/);
  assert.match(runner, /Mutex\]::new\(\$false, "Local\\CenevalStudyE2EPort3100"\)/);
  assert.match(runner, /Assert-LocalPortAvailable/);
  assert.match(runner, /UseShellExecute = \$false/);
  assert.match(runner, /ArgumentList\.Add\(\$argument\)/);
  assert.match(runner, /PYTHONDONTWRITEBYTECODE = "1"/);
  assert.doesNotMatch(runner, /with_server|shell=True|RedirectStandard(?:Output|Error)\s*=\s*\$true/);
});

test("el filtro exige proceso nuevo, node del workspace y argumentos exactos", () => {
  assert.match(helper, /-not \$PreexistingPids\.Contains/);
  assert.match(helper, /Name -notin @\("node\.exe", "node"\)/);
  assert.match(helper, /Resolve-ComparableProcessPath -Path \$cliToken/);
  assert.match(helper, /Ruta fuera de la raíz de unidad/);
  assert.match(helper, /OrdinalIgnoreCase/);
  assert.match(runner, /--hostname\\s\+127\\\.0\\\.0\\\.1/);
  assert.match(runner, /\$portPattern/);
  const unit = readFileSync(
    new URL("../scripts/test-local-process-cleanup.ps1", import.meta.url),
    "utf8",
  );
  assert.match(unit, /node_modules\\\.bin\\\.\.\\next\\dist\\bin\\next/);
  assert.match(unit, /C:\\other\\node_modules/);
});

test("el finally termina solo el árbol nuevo seleccionado y nunca por puerto", () => {
  assert.match(runner, /finally \{[\s\S]*Stop-NewWorkspaceNextTree/);
  assert.match(helper, /ParentProcessId/);
  assert.match(helper, /Name -in @\("node\.exe", "node", "cmd\.exe", "cmd"\)/);
  assert.match(helper, /Stop-Process -Id \(\[int\]\$target\.ProcessId\)/);
  assert.match(runner, /\$serverProcess\.Kill\(\$true\)/);
  assert.match(runner, /Wait-OwnedServerReady/);
  assert.doesNotMatch(helper, /Get-NetTCPConnection|netstat|LocalPort|OwningProcess/i);
  assert.doesNotMatch(runner, /Stop-Process[\s\S]*LocalPort/i);
});
