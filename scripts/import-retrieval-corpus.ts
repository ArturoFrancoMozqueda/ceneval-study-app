import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import {
  importApprovedRetrievalCorpus,
  prepareRetrievalCorpusProjection,
} from "../lib/content/retrieval-corpus";

const expectedProjectRef = "qcseoivljzuxzqeaxfly";
const confirmationFlag = "-ConfirmProduction";

function requireProductionConfirmation() {
  if (!process.argv.slice(2).includes(confirmationFlag)) {
    throw new Error(
      `La importación escribe en Supabase remoto. Repite con ${confirmationFlag}.`,
    );
  }
}

function requireCenevalEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) {
    throw new Error("Faltan las variables privadas de Supabase.");
  }

  const projectRef = new URL(url).hostname.split(".")[0];
  if (projectRef !== expectedProjectRef) {
    throw new Error(
      `La URL configurada no pertenece a CENEVAL Study App (${expectedProjectRef}).`,
    );
  }
  return { secretKey, url };
}

function loadCorpusDocuments() {
  return readdirSync("docs/retrieval-practice")
    .filter((name) => /^C\d{2}\.md$/.test(name))
    .sort()
    .map((name) =>
      readFileSync(`docs/retrieval-practice/${name}`, "utf8"),
    );
}

async function main() {
  requireProductionConfirmation();
  const { secretKey, url } = requireCenevalEnvironment();
  const pending = prepareRetrievalCorpusProjection(loadCorpusDocuments());
  if (pending.items.length !== 456) {
    throw new Error(`Se esperaban 456 reactivos; se proyectaron ${pending.items.length}.`);
  }

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  async function exactCount(table: string) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error || count === null) {
      throw new Error(`No se pudo verificar ${table}.`);
    }
    return count;
  }

  const existingItems = await exactCount("retrieval_items");
  if (existingItems !== 0) {
    throw new Error(
      `La tabla retrieval_items ya contiene ${existingItems} filas; no se reintentará automáticamente.`,
    );
  }

  const approved = { ...pending, approvalStatus: "approved" as const };
  const imported = await importApprovedRetrievalCorpus(
    (functionName, args) => supabase.rpc(functionName, args),
    approved,
  );

  const [items, answerKeys, evidence, drafts] = await Promise.all([
    exactCount("retrieval_items"),
    exactCount("retrieval_item_answer_keys"),
    exactCount("retrieval_item_evidence"),
    supabase
      .from("retrieval_items")
      .select("*", { count: "exact", head: true })
      .eq("editorial_status", "draft"),
  ]);
  if (
    imported !== 456 ||
    items !== 456 ||
    answerKeys !== 456 ||
    evidence < 456 ||
    drafts.error ||
    drafts.count !== 456
  ) {
    throw new Error("La verificación posterior no confirmó el corpus íntegro como borrador.");
  }

  console.log(
    `Importación verificada: ${items} reactivos, ${answerKeys} claves y ${evidence} evidencias; todos en borrador.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falló la importación.");
  process.exitCode = 1;
});
