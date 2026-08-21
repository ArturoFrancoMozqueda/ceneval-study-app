import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { classPackageFileSchema } from "../lib/content/package-schema";

const packagesDirectory = path.join(process.cwd(), "content", "packages");

test("el catálogo vigente contiene C01–C40 una sola vez y solo paquetes 1.1", async () => {
  const fileNames = (await readdir(packagesDirectory))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  assert.equal(fileNames.length, 40);

  const packages = await Promise.all(
    fileNames.map(async (fileName) => {
      const raw = await readFile(path.join(packagesDirectory, fileName), "utf8");
      return classPackageFileSchema.parse(JSON.parse(raw));
    }),
  );

  assert.ok(packages.every((packageData) => packageData.packageVersion === "1.1"));

  const curriculum = packages
    .map((packageData) => {
      assert.equal(packageData.packageVersion, "1.1");
      return packageData.curriculum;
    })
    .sort((left, right) => left.order - right.order);

  assert.deepEqual(
    curriculum.map(({ code, order }) => ({ code, order })),
    Array.from({ length: 40 }, (_, index) => ({
      code: `C${String(index + 1).padStart(2, "0")}`,
      order: index + 1,
    })),
  );

  for (const packageData of packages) {
    const originalFiles = packageData.transcript.originalFiles ?? [
      packageData.transcript.originalFile,
    ];
    for (const originalFile of originalFiles) {
      assert.ok(originalFile);
      assert.equal(originalFile, path.basename(originalFile));
      assert.match(originalFile, /^AUDIO \d{2}\.txt$/);
    }
  }
});
