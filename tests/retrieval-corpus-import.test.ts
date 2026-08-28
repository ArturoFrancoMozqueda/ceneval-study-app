import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import {
  importApprovedRetrievalCorpus,
  prepareRetrievalCorpusProjection,
} from "../lib/content/retrieval-corpus";

function corpusDocuments() {
  return readdirSync("docs/retrieval-practice")
    .filter((name) => /^C\d{2}\.md$/.test(name))
    .sort()
    .map((name) => readFileSync(`docs/retrieval-practice/${name}`, "utf8"));
}

test("proyecta los 456 reactivos sin aprobarlos ni exponer claves como ítems", () => {
  const corpus = prepareRetrievalCorpusProjection(corpusDocuments());
  assert.equal(corpus.approvalStatus, "pending_editorial_approval");
  assert.equal(corpus.items.length, 456);
  assert.equal(corpus.items[0]?.stableCode, "C01-R01");
  assert.equal(corpus.items.at(-1)?.stableCode, "C57-R08");
  assert.equal(Object.keys(corpus.items[0]!).includes("answerKey"), true);
  assert.ok(corpus.items.every((item) => item.answerKey.evidence.length > 0));
});

test("el importador falla cerrado antes de invocar Supabase sin aprobación", async () => {
  const corpus = prepareRetrievalCorpusProjection([corpusDocuments()[0]!]);
  let called = false;
  await assert.rejects(
    importApprovedRetrievalCorpus(async () => {
      called = true;
      return { data: 8, error: null };
    }, corpus),
    /no incluye aprobación explícita para importar/,
  );
  assert.equal(called, false);
});

test("un corpus aprobado usa una sola RPC y exige conteo íntegro", async () => {
  const pending = prepareRetrievalCorpusProjection([corpusDocuments()[0]!]);
  const approved = { ...pending, approvalStatus: "approved" as const };
  const calls: string[] = [];
  const count = await importApprovedRetrievalCorpus(async (name, args) => {
    calls.push(name);
    assert.equal(args.p_corpus.approvalStatus, "approved");
    return { data: 8, error: null };
  }, approved);
  assert.equal(count, 8);
  assert.deepEqual(calls, ["import_retrieval_corpus_v1"]);
});
