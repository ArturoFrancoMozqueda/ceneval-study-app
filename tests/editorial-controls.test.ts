import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  isPositiveInteger,
  isTopicApprovalStatus,
  topicMutationErrorMessage,
} from "../lib/editorial-actions";

const migrationPath = new URL(
  "../supabase/migrations/20260821021205_create_topic_with_next_position.sql",
  import.meta.url,
);
const actionPath = new URL("../app/actions/academic.ts", import.meta.url);
const componentPath = new URL(
  "../components/topics-review.tsx",
  import.meta.url,
);

test("valida identificadores y estados editoriales en una frontera estricta", () => {
  assert.equal(isPositiveInteger(1), true);
  assert.equal(isPositiveInteger(0), false);
  assert.equal(isPositiveInteger(1.5), false);
  assert.equal(isPositiveInteger("1"), false);
  assert.equal(isTopicApprovalStatus("approved"), true);
  assert.equal(isTopicApprovalStatus("rejected"), true);
  assert.equal(isTopicApprovalStatus("pending"), false);
});

test("traduce la colisión unique sin filtrar detalles internos", () => {
  assert.match(topicMutationErrorMessage("23505"), /al mismo tiempo/i);
  assert.doesNotMatch(topicMutationErrorMessage("23505"), /23505|unique/i);
  assert.doesNotMatch(topicMutationErrorMessage("XX000"), /XX000/i);
});

test("la migración serializa la posición por clase y limita la RPC a service_role", () => {
  const sql = readFileSync(migrationPath, "utf8").toLowerCase();

  assert.match(sql, /create or replace function public\.create_topic_with_next_position/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /coalesce\(max\(position\), 0\) \+ 1/);
  assert.match(sql, /revoke execute[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute[\s\S]*to service_role/);
  assert.doesNotMatch(sql, /security definer/);
});

test("la acción usa la RPC atómica y la UI bloquea envíos repetidos", () => {
  const action = readFileSync(actionPath, "utf8");
  const component = readFileSync(componentPath, "utf8");

  assert.match(action, /\.rpc\(\s*"create_topic_with_next_position"/);
  assert.doesNotMatch(action, /countTopics/);
  assert.match(component, /statusPendingRef\.current/);
  assert.match(component, /disabled=\{pendingTopicId !== null\}/);
  assert.match(component, /aria-live=\{statusMessageIsError/);
  assert.match(component, /aria-busy=\{pendingTopicId === topic\.id\}/);
});
