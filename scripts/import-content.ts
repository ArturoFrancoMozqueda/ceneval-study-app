import { createClient } from "@supabase/supabase-js";
import { loadClassPackage } from "../lib/content/load-package";

const fileArgument = process.argv[2];
if (!fileArgument) {
  throw new Error(
    "Uso: npm run content:import -- content/packages/mi-clase.json",
  );
}

async function main() {
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  throw new Error("Faltan las variables privadas de Supabase.");
}

const bundle = await loadClassPackage(fileArgument!);
const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let createdClassId: number | null = null;

try {
  const { data: existingSubject, error: subjectLookupError } = await supabase
    .from("subjects")
    .select("id")
    .ilike("name", bundle.subject.name)
    .maybeSingle();
  if (subjectLookupError) throw subjectLookupError;

  let subjectId = existingSubject?.id as number | undefined;
  if (!subjectId) {
    const { data, error } = await supabase
      .from("subjects")
      .insert({
        name: bundle.subject.name,
        description: bundle.subject.description,
      })
      .select("id")
      .single();
    if (error) throw error;
    subjectId = data.id as number;
  }

  const { data: studyClass, error: classError } = await supabase
    .from("classes")
    .insert({
      subject_id: subjectId,
      title: bundle.class.title,
      class_date: bundle.class.date ?? null,
      teacher: bundle.class.teacher ?? null,
      description: bundle.class.description,
      publication_status: "draft",
    })
    .select("id")
    .single();
  if (classError) throw classError;
  createdClassId = studyClass.id as number;

  const { data: transcript, error: transcriptError } = await supabase
    .from("transcripts")
    .insert({
      class_id: createdClassId,
      original_text: bundle.transcript.original,
      cleaned_text: bundle.transcript.cleaned,
      processing_status: "ready",
    })
    .select("id")
    .single();
  if (transcriptError) throw transcriptError;

  for (const [topicIndex, topic] of bundle.topics.entries()) {
    const { data: topicRow, error: topicError } = await supabase
      .from("topics")
      .insert({
        class_id: createdClassId,
        title: topic.title,
        description: topic.description,
        position: topicIndex + 1,
        source_type: "generated",
        approval_status: "approved",
      })
      .select("id")
      .single();
    if (topicError) throw topicError;
    const topicId = topicRow.id as number;

    const { error: materialsError } = await supabase
      .from("study_materials")
      .insert(
        topic.materials.map((material) => ({
          topic_id: topicId,
          material_type: material.type,
          title: material.title,
          content: material.content,
          source_origin: material.sourceOrigin,
          source_transcript_id: transcript.id,
        })),
      );
    if (materialsError) throw materialsError;

    const { error: mapError } = await supabase.from("concept_maps").insert({
      topic_id: topicId,
      title: topic.conceptMap.title,
      description: topic.conceptMap.description,
      nodes: topic.conceptMap.nodes,
    });
    if (mapError) throw mapError;

    for (const reference of topic.references) {
      const { data: referenceRow, error: referenceError } = await supabase
        .from("legal_references")
        .upsert(
          {
            title: reference.title,
            url: reference.url,
            institution: reference.institution,
            jurisdiction: reference.jurisdiction,
            citation: reference.citation,
            retrieved_on: reference.retrievedOn,
          },
          { onConflict: "url,citation" },
        )
        .select("id")
        .single();
      if (referenceError) throw referenceError;
      const { error: linkError } = await supabase
        .from("topic_references")
        .insert({
          topic_id: topicId,
          reference_id: referenceRow.id,
          note: reference.note || null,
        });
      if (linkError) throw linkError;
    }

    const { error: cardsError } = await supabase.from("flashcards").insert(
      topic.flashcards.map((card, index) => ({
        topic_id: topicId,
        question: card.question,
        answer: card.answer,
        position: index + 1,
        source_origin: card.sourceOrigin,
      })),
    );
    if (cardsError) throw cardsError;

    const { data: exam, error: examError } = await supabase
      .from("exams")
      .insert({
        topic_id: topicId,
        title: topic.exam.title,
        description: topic.exam.description,
      })
      .select("id")
      .single();
    if (examError) throw examError;

    for (const [questionIndex, question] of topic.exam.questions.entries()) {
      const { data: questionRow, error: questionError } = await supabase
        .from("exam_questions")
        .insert({
          exam_id: exam.id,
          question_text: question.text,
          difficulty: question.difficulty,
          position: questionIndex + 1,
        })
        .select("id")
        .single();
      if (questionError) throw questionError;

      const { data: optionRows, error: optionsError } = await supabase
        .from("exam_options")
        .insert(
          question.options.map((option, index) => ({
            question_id: questionRow.id,
            option_text: option,
            position: index + 1,
          })),
        )
        .select("id,position");
      if (optionsError) throw optionsError;
      const correctOption = optionRows.find(
        ({ position }) => position === question.correctOption + 1,
      );
      if (!correctOption) throw new Error("No se encontró la opción correcta.");

      const optionExplanations = Object.fromEntries(
        optionRows.map(({ id, position }) => [
          String(id),
          question.optionExplanations[position - 1],
        ]),
      );
      const { error: keyError } = await supabase
        .from("exam_answer_keys")
        .insert({
          question_id: questionRow.id,
          correct_option_id: correctOption.id,
          explanation: question.explanation,
          option_explanations: optionExplanations,
        });
      if (keyError) throw keyError;
    }
  }

  console.log(
    `Paquete importado como borrador. Clase ${createdClassId}. Revisa /administrar/clases/${createdClassId}.`,
  );
} catch (error) {
  if (createdClassId) {
    await supabase.from("classes").delete().eq("id", createdClassId);
  }
  throw error;
}
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
