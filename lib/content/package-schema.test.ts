import assert from "node:assert/strict";
import test from "node:test";
import { curriculumMetadataSchema } from "./package-schema";

const validCurriculum = {
  code: "C41",
  order: 41,
  audioSources: [
    { audioNumber: 54, fragment: "completo" },
    { audioNumber: 55, fragment: "primera parte" },
  ],
};

test("acepta código, orden y audios coherentes", () => {
  assert.deepEqual(curriculumMetadataSchema.parse(validCurriculum), validCurriculum);
});

test("rechaza un código que no coincide con el orden", () => {
  const result = curriculumMetadataSchema.safeParse({
    ...validCurriculum,
    order: 42,
  });

  assert.equal(result.success, false);
  assert.match(result.error?.issues[0]?.message ?? "", /debe usar el orden 41/);
});

test("rechaza códigos y audios fuera del plan", () => {
  const result = curriculumMetadataSchema.safeParse({
    code: "C59",
    order: 59,
    audioSources: [{ audioNumber: 71, fragment: "completo" }],
  });

  assert.equal(result.success, false);
  assert.ok((result.error?.issues.length ?? 0) >= 3);
});

test("rechaza el mismo audio repetido dentro de una clase", () => {
  const result = curriculumMetadataSchema.safeParse({
    ...validCurriculum,
    audioSources: [
      { audioNumber: 54, fragment: "primera parte" },
      { audioNumber: 54, fragment: "segunda parte" },
    ],
  });

  assert.equal(result.success, false);
  assert.match(result.error?.issues[0]?.message ?? "", /está repetido/);
});
