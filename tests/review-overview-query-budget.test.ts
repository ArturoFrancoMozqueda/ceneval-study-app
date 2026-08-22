import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const academic = readFileSync(
  new URL("../lib/data/academic.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");

function getReviewOverviewSource() {
  const start = academic.indexOf("export async function getReviewOverview(");
  assert.notEqual(start, -1);
  return academic.slice(start);
}

test("getReviewOverview usa una RPC, una llamada y ninguna consulta historica", () => {
  const source = getReviewOverviewSource();

  assert.equal(source.match(/\.rpc\(/g)?.length, 1);
  assert.match(source, /\.rpc\("get_review_overview_v1"\)/);
  assert.match(source, /\.single\(\)/);
  assert.doesNotMatch(source, /\.from\(|Promise\.all|flashcard_reviews|quick_check_responses/);
});

test("la RPC deriva identidad de la sesion y valida el wrapper overview", () => {
  const source = getReviewOverviewSource();
  const rpcCall = source.match(/\.rpc\([\s\S]*?\)\s*\.single\(\)/)?.[0] ?? "";

  assert.equal(rpcCall, '.rpc("get_review_overview_v1")\n    .single()');
  assert.doesNotMatch(rpcCall, /userId|user_id|p_user/);
  assert.match(source, /parseReviewOverviewRow\(data\)/);
  assert.match(source, /if \(error\) fail\("getReviewOverview", error\)/);
});
