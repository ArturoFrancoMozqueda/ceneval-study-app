import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { classPackageFileSchema } from "../lib/content/package-schema";

const packagesDirectory = path.join(process.cwd(), "content", "packages");

test("el catálogo vigente contiene C01–C40 una sola vez y solo contratos legibles", async () => {
  const fileNames = (await readdir(packagesDirectory))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  assert.equal(fileNames.length, 40);

  const packages = await Promise.all(
    fileNames.map(async (fileName) => {
      const raw = await readFile(
        path.join(packagesDirectory, fileName),
        "utf8",
      );
      return classPackageFileSchema.parse(JSON.parse(raw));
    }),
  );

  const currentPackages = packages.map((packageData) => {
    if (packageData.packageVersion === "1.0") {
      throw new Error("El catálogo vigente no admite paquetes retirados 1.0.");
    }
    return packageData;
  });

  assert.equal(
    currentPackages.filter(
      (packageData) => packageData.packageVersion === "1.2",
    ).length,
    16,
  );
  assert.equal(
    currentPackages.filter(
      (packageData) => packageData.packageVersion === "1.1",
    ).length,
    24,
  );

  const curriculum = currentPackages
    .map((packageData) => packageData.curriculum)
    .sort((left, right) => left.order - right.order);

  assert.deepEqual(
    curriculum.map(({ code, order }) => ({ code, order })),
    Array.from({ length: 40 }, (_, index) => ({
      code: `C${String(index + 1).padStart(2, "0")}`,
      order: index + 1,
    })),
  );

  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C01")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C02")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C03")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C04")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C05")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C06")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C07")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C08")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C09")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C10")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C11")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C12")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C13")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C14")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C15")
      ?.packageVersion,
    "1.2",
  );
  assert.equal(
    currentPackages.find((packageData) => packageData.curriculum.code === "C16")
      ?.packageVersion,
    "1.2",
  );

  for (const packageData of currentPackages) {
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
