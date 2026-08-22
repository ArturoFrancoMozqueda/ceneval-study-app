import assert from "node:assert/strict";
import test from "node:test";
import {
  exportClassPackage,
  exportClassPackageRpc,
  importClassPackage,
  importClassPackageRpc,
  serializeClassPackage,
  toPersistableClassPackage,
  type InvokePackageRpc,
} from "../lib/content/package-persistence";
import { createSyntheticTraceablePackage } from "./fixtures/traceable-package";

test("envía un paquete 1.2 validado mediante una sola RPC transaccional", async () => {
  const fixture = createSyntheticTraceablePackage();
  const calls: Array<{ functionName: string; args: Record<string, unknown> }> = [];
  const invoke: InvokePackageRpc = async (functionName, args) => {
    calls.push({ functionName, args });
    return { data: 741, error: null };
  };

  const classId = await importClassPackage(invoke, fixture);

  assert.equal(classId, 741);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.functionName, importClassPackageRpc);
  const expectedPersistable = toPersistableClassPackage(fixture);
  assert.deepEqual(calls[0]?.args, { p_package: expectedPersistable });
  const persisted = calls[0]?.args.p_package as typeof expectedPersistable;
  assert.equal("transcript" in persisted, false);
  assert.doesNotMatch(JSON.stringify(persisted), /Transcripción completamente sintética/);
  assert.deepEqual(persisted.evidenceRegistry, fixture.evidenceRegistry);
  assert.deepEqual(
    persisted.topics[0]?.learningJourney,
    fixture.topics[0]?.learningJourney,
  );
});

test("1.0 y 1.1 fallan antes de invocar cualquier operación remota", async () => {
  const fixture = createSyntheticTraceablePackage();
  let calls = 0;
  const invoke: InvokePackageRpc = async () => {
    calls += 1;
    return { data: 1, error: null };
  };

  for (const packageVersion of ["1.0", "1.1"] as const) {
    await assert.rejects(
      importClassPackage(invoke, { ...fixture, packageVersion }),
      packageVersion === "1.0" ? /histórico.*no importable/ : /no es trazable ni importable/,
    );
  }
  assert.equal(calls, 0);
});

test("un duplicado se reporta sin intentar limpieza parcial desde el cliente", async () => {
  const calls: string[] = [];
  const invoke: InvokePackageRpc = async (functionName) => {
    calls.push(functionName);
    return {
      data: null,
      error: { code: "23505", message: "detalle privado de una restricción" },
    };
  };

  await assert.rejects(
    importClassPackage(invoke, createSyntheticTraceablePackage()),
    /operación transaccional no importó un duplicado/,
  );
  assert.deepEqual(calls, [importClassPackageRpc]);
});

test("un error interno no filtra detalles, transcripción ni evidencia", async () => {
  const secret = "texto-editorial-que-no-debe-salir";
  const invoke: InvokePackageRpc = async () => ({
    data: null,
    error: { code: "P0001", message: secret },
  });

  await assert.rejects(
    importClassPackage(invoke, createSyntheticTraceablePackage()),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.doesNotMatch(error.message, new RegExp(secret));
      assert.doesNotMatch(error.message, /ev-transcript-synthetic/);
      return true;
    },
  );
});

test("rechaza un retorno ambiguo para impedir reintentos automáticos peligrosos", async () => {
  const invoke: InvokePackageRpc = async () => ({ data: null, error: null });
  await assert.rejects(
    importClassPackage(invoke, createSyntheticTraceablePackage()),
    /no confirmó la clase importada.*no vuelvas a ejecutar/i,
  );
});

test("la exportación usa la RPC real y reconstruye un 1.2 semánticamente equivalente", async () => {
  const fixture = createSyntheticTraceablePackage();
  const reconstructed = structuredClone(toPersistableClassPackage(fixture));
  reconstructed.evidenceRegistry.sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const calls: Array<{ functionName: string; args: Record<string, unknown> }> = [];
  const exported = await exportClassPackage(async (functionName, args) => {
    calls.push({ functionName, args });
    return { data: reconstructed, error: null };
  }, 741);
  const reparsed = JSON.parse(serializeClassPackage(exported));

  assert.deepEqual(calls, [
    { functionName: exportClassPackageRpc, args: { p_class_id: 741 } },
  ]);
  assert.deepEqual(reparsed, reconstructed);
  assert.equal("transcript" in exported, false);
});

test("la proyección rechaza claves de cuerpo privadas anidadas antes de la RPC", async () => {
  for (const forbiddenKey of [
    "transcript",
    "original_text",
    "cleaned_text",
  ]) {
    const fixture = createSyntheticTraceablePackage();
    Object.assign(fixture.topics[0]!.learningJourney, {
      [forbiddenKey]: "texto privado anidado",
    });
    let calls = 0;

    await assert.rejects(
      importClassPackage(async () => {
        calls += 1;
        return { data: 1, error: null };
      }, fixture),
      /clave reservada para texto privado/,
    );
    assert.equal(calls, 0);
  }
});

test("la exportación rechaza cualquier reaparición de texto transcriptivo", async () => {
  const leaked = {
    ...toPersistableClassPackage(createSyntheticTraceablePackage()),
    transcript: { original: "texto privado", cleaned: "texto privado" },
  };

  await assert.rejects(
    exportClassPackage(async () => ({ data: leaked, error: null }), 741),
    /clave reservada para texto privado/,
  );
});

test("la exportación rechaza cuerpos privados anidados aunque Zod ignore claves extra", async () => {
  const leaked = toPersistableClassPackage(
    createSyntheticTraceablePackage(),
  ) as unknown as Record<string, unknown>;
  const topics = leaked.topics as Array<Record<string, unknown>>;
  Object.assign(topics[0]!, { original_text: "texto privado anidado" });

  await assert.rejects(
    exportClassPackage(async () => ({ data: leaked, error: null }), 741),
    /clave reservada para texto privado/,
  );
});

test("la exportación SQL reconstruye relaciones y no devuelve un snapshot opaco", async () => {
  const { readFile } = await import("node:fs/promises");
  const migration = await readFile(
    "supabase/migrations/20260821203000_persist_traceable_packages.sql",
    "utf8",
  );

  assert.match(migration, /create function public\.export_class_package_v12/);
  assert.match(migration, /from public\.class_evidence/);
  assert.match(migration, /from public\.topic_learning_journeys/);
  assert.match(migration, /from public\.study_materials/);
  assert.match(migration, /join public\.exam_answer_keys/);
  assert.doesNotMatch(migration, /package_(payload|snapshot)/i);
  assert.match(
    migration,
    /revoke all on function public\.export_class_package_v12\(bigint\)[\s\S]*grant execute[\s\S]*to service_role/,
  );
});
