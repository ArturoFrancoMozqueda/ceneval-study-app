import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveStudyContinuation,
  type CurrentStudyTopic,
} from "../lib/study/continuation";

const current: CurrentStudyTopic = {
  id: 12,
  classId: 4,
  position: 2,
  curriculumOrder: 17,
  curriculumCode: "C17",
};

test("elige el siguiente tema aprobado por posición editorial, no por ID", () => {
  const result = deriveStudyContinuation({
    current,
    topics: [
      { id: 2, classId: 4, title: "Más tarde", position: 5, approved: true },
      { id: 900, classId: 4, title: "Siguiente", position: 3, approved: true },
      { id: 901, classId: 4, title: "Pendiente", position: 2, approved: false },
      { id: 902, classId: 8, title: "Otra clase", position: 3, approved: true },
    ],
    classes: [],
  });

  assert.deepEqual(result, {
    kind: "topic",
    topicId: 900,
    topicTitle: "Siguiente",
    curriculumCode: "C17",
  });
});

test("después del último tema elige la siguiente clase publicada por orden curricular", () => {
  const result = deriveStudyContinuation({
    current,
    topics: [],
    classes: [
      { id: 3, title: "C20", curriculumOrder: 20, curriculumCode: "C20", published: true },
      { id: 800, title: "C18", curriculumOrder: 18, curriculumCode: "C18", published: true },
      { id: 1, title: "C17 vieja", curriculumOrder: 17, curriculumCode: "C17", published: true },
      { id: 2, title: "Borrador", curriculumOrder: 18, curriculumCode: "C18", published: false },
    ],
  });

  assert.deepEqual(result, {
    kind: "class",
    classId: 800,
    classTitle: "C18",
    curriculumCode: "C18",
  });
});

test("cierra el recorrido si no hay tema ni clase posterior publicable", () => {
  assert.deepEqual(
    deriveStudyContinuation({
      current,
      topics: [
        { id: 15, classId: 4, title: "Anterior", position: 1, approved: true },
        { id: 16, classId: 4, title: "Rechazado", position: 3, approved: false },
      ],
      classes: [
        { id: 5, title: "No publicada", curriculumOrder: 18, curriculumCode: "C18", published: false },
      ],
    }),
    { kind: "journey-complete" },
  );
});
