import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  expectedTranscriptNames,
  inventoryTranscriptArchive,
  parseManifestCsv,
  runCli,
  serializeManifestCsv,
  verifyManifest,
} from "../scripts/verify-transcript-archive";

async function createSyntheticArchive(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ceneval-transcripts-"));
  await Promise.all(
    expectedTranscriptNames().map((name, index) =>
      writeFile(path.join(directory, name), `transcripción sintética ${index + 1}\n`),
    ),
  );
  return directory;
}

test("inventa 70 transcripciones y genera el CSV compatible", async (context) => {
  const directory = await createSyntheticArchive();
  context.after(() => rm(directory, { recursive: true, force: true }));

  const inventory = await inventoryTranscriptArchive(directory);
  assert.equal(inventory.entries.length, 70);
  assert.deepEqual(inventory.missing, []);
  assert.deepEqual(inventory.unexpected, []);
  assert.deepEqual(inventory.duplicates, []);

  const csv = serializeManifestCsv(inventory.entries);
  assert.match(csv, /^Name,Length,SHA256\n/);
  const parsed = parseManifestCsv(csv);
  assert.deepEqual(parsed, inventory.entries);
  assert.equal(verifyManifest(inventory, parsed).ok, true);
});

test("detecta una transcripción alterada contra el manifiesto", async (context) => {
  const directory = await createSyntheticArchive();
  context.after(() => rm(directory, { recursive: true, force: true }));
  const original = await inventoryTranscriptArchive(directory);
  const manifest = parseManifestCsv(serializeManifestCsv(original.entries));

  await writeFile(path.join(directory, "AUDIO 23.txt"), "contenido alterado");
  const altered = await inventoryTranscriptArchive(directory);
  const result = verifyManifest(altered, manifest);

  assert.equal(result.ok, false);
  assert.deepEqual(result.lengthMismatches, ["AUDIO 23.txt"]);
  assert.deepEqual(result.hashMismatches, ["AUDIO 23.txt"]);
});

test("detecta archivos faltantes y entradas incompletas", async (context) => {
  const directory = await createSyntheticArchive();
  context.after(() => rm(directory, { recursive: true, force: true }));
  await rm(path.join(directory, "AUDIO 70.txt"));

  const inventory = await inventoryTranscriptArchive(directory);
  const manifest = inventory.entries.slice(0, -1);
  const result = verifyManifest(inventory, manifest);

  assert.deepEqual(inventory.missing, ["AUDIO 70.txt"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingFromArchive, ["AUDIO 70.txt"]);
  assert.deepEqual(result.missingFromManifest, ["AUDIO 69.txt", "AUDIO 70.txt"]);
});

test("solo escribe un reporte cuando --output lo solicita", async (context) => {
  const directory = await createSyntheticArchive();
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "ceneval-report-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  context.after(() => rm(outputDirectory, { recursive: true, force: true }));
  const outputPath = path.join(outputDirectory, "manifest.sha256.csv");

  assert.equal(await runCli([directory, "--output", outputPath]), 0);
  const csv = await readFile(outputPath, "utf8");
  assert.equal(parseManifestCsv(csv).length, 70);

  await assert.rejects(
    runCli([directory, "--output", outputPath]),
    /EEXIST/,
  );
});
