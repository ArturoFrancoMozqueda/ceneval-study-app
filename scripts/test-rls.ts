import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type TestUser = {
  client: SupabaseClient;
  email: string;
  id: string;
  password: string;
};

type TestResult = {
  name: string;
  passed: boolean;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

if (!url || !publishableKey || !secretKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY o SUPABASE_SECRET_KEY.",
  );
}

const admin = createClient(url, secretKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});
const createdUsers: TestUser[] = [];
const results: TestResult[] = [];
let temporaryClassId: number | null = null;
let temporaryTopicId: number | null = null;
let temporaryFlashcardId: number | null = null;

function check(name: string, condition: boolean, detail?: string) {
  results.push({ name, passed: condition });
  if (!condition) {
    throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`✓ ${name}`);
}

function publicClient() {
  return createClient(url!, publishableKey!, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function createTestUser(label: string) {
  const nonce = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const email = `rls-${label}-${nonce}@example.com`;
  const password = `Rls-${crypto.randomUUID()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Prueba RLS ${label}` },
  });
  if (error || !data.user) {
    throw new Error(
      `No se pudo crear la cuenta ${label}: ${error?.message ?? "sin usuario"}`,
    );
  }

  const client = publicClient();
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) {
    throw new Error(
      `No se pudo iniciar sesión como ${label}: ${signIn.error.message}`,
    );
  }

  const user = { client, email, id: data.user.id, password };
  createdUsers.push(user);
  return user;
}

async function main() {
  const anonymous = publicClient();
  const anonymousClasses = await anonymous.from("classes").select("id");
  check(
    "El acceso anónimo no puede leer clases",
    Boolean(anonymousClasses.error) || (anonymousClasses.data?.length ?? 0) === 0,
  );

  const studentA = await createTestUser("student-a");
  const studentB = await createTestUser("student-b");
  const testAdmin = await createTestUser("admin");

  const promote = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", testAdmin.id);
  if (promote.error) throw promote.error;

  const publishedResult = await admin
    .from("classes")
    .select("id,subject_id")
    .eq("publication_status", "published")
    .limit(1)
    .single();
  if (publishedResult.error) throw publishedResult.error;

  const temporaryClass = await admin
    .from("classes")
    .insert({
      subject_id: publishedResult.data.subject_id,
      title: `Prueba temporal RLS ${crypto.randomUUID().slice(0, 8)}`,
      description: "Registro temporal creado por la suite de seguridad.",
      publication_status: "draft",
      published_at: null,
    })
    .select("id")
    .single();
  if (temporaryClass.error) throw temporaryClass.error;
  temporaryClassId = temporaryClass.data.id as number;

  const temporaryTopic = await admin
    .from("topics")
    .insert({
      class_id: temporaryClassId,
      title: "Tema temporal para probar actividad protegida",
      position: 1,
    })
    .select("id")
    .single();
  if (temporaryTopic.error) throw temporaryTopic.error;
  temporaryTopicId = temporaryTopic.data.id as number;

  const temporaryFlashcard = await admin
    .from("flashcards")
    .insert({
      topic_id: temporaryTopicId,
      question: "¿Esta tarjeta pertenece a contenido publicado?",
      answer: "Depende del estado editorial de su clase.",
      position: 1,
    })
    .select("id")
    .single();
  if (temporaryFlashcard.error) throw temporaryFlashcard.error;
  temporaryFlashcardId = temporaryFlashcard.data.id as number;

  const publishedClassId = publishedResult.data.id as number;
  const studentClasses = await studentA.client
    .from("classes")
    .select("id,publication_status");
  if (studentClasses.error) throw studentClasses.error;
  check(
    "La estudiante puede leer contenido publicado",
    studentClasses.data.some(({ id }) => id === publishedClassId),
  );
  check(
    "La estudiante no puede leer borradores ni clases en revisión",
    studentClasses.data.every(
      ({ publication_status }) => publication_status === "published",
    ),
  );

  const hiddenStudentClass = await studentA.client
    .from("classes")
    .select("id")
    .eq("id", temporaryClassId);
  if (hiddenStudentClass.error) throw hiddenStudentClass.error;
  check(
    "La estudiante no puede consultar una clase borrador específica",
    hiddenStudentClass.data.length === 0,
  );

  const adminClasses = await testAdmin.client
    .from("classes")
    .select("id")
    .eq("id", temporaryClassId);
  if (adminClasses.error) throw adminClasses.error;
  check(
    "La administradora puede leer contenido no publicado",
    adminClasses.data.length === 1,
  );

  const [draftProgress, draftQuickCheck, draftReview, adminDraftProgress] =
    await Promise.all([
      studentA.client.from("study_progress").insert({
        user_id: studentA.id,
        topic_id: temporaryTopicId,
        current_step: "discover",
        material_index: 0,
        session_minutes: 5,
        completed_steps: [],
      }),
      studentA.client.from("quick_check_responses").insert({
        user_id: studentA.id,
        topic_id: temporaryTopicId,
        prompt: "Comprobación sobre un borrador",
        response: "No debe registrarse.",
        needs_review: false,
      }),
      studentA.client.from("flashcard_reviews").insert({
        user_id: studentA.id,
        flashcard_id: temporaryFlashcardId,
        rating: "again",
      }),
      testAdmin.client.from("study_progress").insert({
        user_id: testAdmin.id,
        topic_id: temporaryTopicId,
        current_step: "discover",
        material_index: 0,
        session_minutes: 5,
        completed_steps: [],
      }),
    ]);
  check(
    "Una estudiante no puede registrar progreso sobre un borrador",
    Boolean(draftProgress.error),
  );
  check(
    "Una estudiante no puede responder comprobaciones de un borrador",
    Boolean(draftQuickCheck.error),
  );
  check(
    "Una estudiante no puede revisar tarjetas de un borrador",
    Boolean(draftReview.error),
  );
  check(
    "El rol editorial tampoco convierte un borrador en contenido estudiable",
    Boolean(adminDraftProgress.error),
  );

  const moveToReview = await admin
    .from("classes")
    .update({ publication_status: "review", published_at: null })
    .eq("id", temporaryClassId);
  if (moveToReview.error) throw moveToReview.error;
  const reviewForStudent = await studentA.client
    .from("classes")
    .select("id")
    .eq("id", temporaryClassId);
  if (reviewForStudent.error) throw reviewForStudent.error;
  check(
    "Una clase en revisión permanece oculta para estudiantes",
    reviewForStudent.data.length === 0,
  );

  const firstPublicationAt = new Date().toISOString();
  const publishTemporary = await admin
    .from("classes")
    .update({
      publication_status: "published",
      published_at: firstPublicationAt,
    })
    .eq("id", temporaryClassId);
  if (publishTemporary.error) throw publishTemporary.error;
  const publishedForStudent = await studentA.client
    .from("classes")
    .select("id")
    .eq("id", temporaryClassId);
  if (publishedForStudent.error) throw publishedForStudent.error;
  check(
    "Una clase publicada queda visible para estudiantes",
    publishedForStudent.data.length === 1,
  );

  const [publishedProgress, publishedQuickCheck, publishedReview] =
    await Promise.all([
      studentA.client.from("study_progress").insert({
        user_id: studentA.id,
        topic_id: temporaryTopicId,
        current_step: "discover",
        material_index: 0,
        session_minutes: 5,
        completed_steps: [],
      }),
      studentA.client.from("quick_check_responses").insert({
        user_id: studentA.id,
        topic_id: temporaryTopicId,
        prompt: "Comprobación sobre contenido publicado",
        response: "Sí debe registrarse.",
        needs_review: false,
      }),
      studentA.client.from("flashcard_reviews").insert({
        user_id: studentA.id,
        flashcard_id: temporaryFlashcardId,
        rating: "good",
      }),
    ]);
  check(
    "Una estudiante puede registrar progreso sobre contenido publicado",
    !publishedProgress.error,
    publishedProgress.error?.message,
  );
  check(
    "Una estudiante puede responder comprobaciones de contenido publicado",
    !publishedQuickCheck.error,
    publishedQuickCheck.error?.message,
  );
  check(
    "Una estudiante puede revisar tarjetas de contenido publicado",
    !publishedReview.error,
    publishedReview.error?.message,
  );

  const withdrawTemporary = await admin
    .from("classes")
    .update({ publication_status: "withdrawn" })
    .eq("id", temporaryClassId);
  if (withdrawTemporary.error) throw withdrawTemporary.error;
  const [withdrawnForStudent, withdrawnForAdmin] = await Promise.all([
    studentA.client
      .from("classes")
      .select("id")
      .eq("id", temporaryClassId),
    testAdmin.client
      .from("classes")
      .select("id,publication_status,published_at")
      .eq("id", temporaryClassId)
      .single(),
  ]);
  if (withdrawnForStudent.error) throw withdrawnForStudent.error;
  if (withdrawnForAdmin.error) throw withdrawnForAdmin.error;
  check(
    "Una clase retirada deja de ser visible para estudiantes",
    withdrawnForStudent.data.length === 0,
  );
  check(
    "La administradora conserva acceso y el historial de publicación al retirar",
    withdrawnForAdmin.data.publication_status === "withdrawn" &&
      Date.parse(withdrawnForAdmin.data.published_at) ===
        Date.parse(firstPublicationAt),
  );

  const [withdrawnProgress, withdrawnQuickCheck, withdrawnReview] =
    await Promise.all([
      studentA.client
        .from("study_progress")
        .update({ material_index: 1 })
        .eq("user_id", studentA.id)
        .eq("topic_id", temporaryTopicId)
        .select("material_index"),
      studentA.client.from("quick_check_responses").insert({
        user_id: studentA.id,
        topic_id: temporaryTopicId,
        prompt: "Comprobación sobre contenido retirado",
        response: "No debe registrarse.",
        needs_review: false,
      }),
      studentA.client.from("flashcard_reviews").insert({
        user_id: studentA.id,
        flashcard_id: temporaryFlashcardId,
        rating: "easy",
      }),
    ]);
  check(
    "Una estudiante no puede actualizar progreso de contenido retirado",
    Boolean(withdrawnProgress.error) ||
      (withdrawnProgress.data !== null && withdrawnProgress.data.length === 0),
  );
  check(
    "Una estudiante no puede responder comprobaciones de contenido retirado",
    Boolean(withdrawnQuickCheck.error),
  );
  check(
    "Una estudiante no puede revisar tarjetas de contenido retirado",
    Boolean(withdrawnReview.error),
  );

  const persistedTemporaryProgress = await admin
    .from("study_progress")
    .select("material_index")
    .eq("user_id", studentA.id)
    .eq("topic_id", temporaryTopicId)
    .single();
  if (persistedTemporaryProgress.error) {
    throw persistedTemporaryProgress.error;
  }
  check(
    "El progreso retirado conserva su último valor publicado",
    persistedTemporaryProgress.data.material_index === 0,
  );

  const clearTemporaryActivity = await Promise.all([
    admin
      .from("study_progress")
      .delete()
      .eq("user_id", studentA.id)
      .eq("topic_id", temporaryTopicId),
    admin
      .from("quick_check_responses")
      .delete()
      .eq("user_id", studentA.id)
      .eq("topic_id", temporaryTopicId),
    admin
      .from("flashcard_reviews")
      .delete()
      .eq("user_id", studentA.id)
      .eq("flashcard_id", temporaryFlashcardId),
  ]);
  for (const cleanupResult of clearTemporaryActivity) {
    if (cleanupResult.error) throw cleanupResult.error;
  }

  const topicResult = await admin
    .from("topics")
    .select("id")
    .eq("class_id", publishedClassId)
    .limit(1)
    .single();
  if (topicResult.error) throw topicResult.error;
  const topicId = topicResult.data.id as number;

  const ownProgress = await studentA.client.from("study_progress").upsert({
    user_id: studentA.id,
    topic_id: topicId,
    current_step: "understand",
    material_index: 0,
    session_minutes: 5,
    completed_steps: ["discover"],
  });
  if (ownProgress.error) throw ownProgress.error;

  const bProgress = await studentB.client.from("study_progress").upsert({
    user_id: studentB.id,
    topic_id: topicId,
    current_step: "apply",
    material_index: 0,
    session_minutes: 10,
    completed_steps: ["discover", "understand"],
  });
  if (bProgress.error) throw bProgress.error;

  const visibleProgress = await studentA.client
    .from("study_progress")
    .select("user_id");
  if (visibleProgress.error) throw visibleProgress.error;
  check(
    "Cada estudiante solo puede leer su propio progreso",
    visibleProgress.data.length === 1 &&
      visibleProgress.data[0].user_id === studentA.id,
  );

  const impersonatedProgress = await studentA.client
    .from("study_progress")
    .upsert({
      user_id: studentB.id,
      topic_id: topicId,
      current_step: "check",
      material_index: 0,
      session_minutes: 15,
      completed_steps: [],
    });
  check(
    "Una estudiante no puede escribir progreso para otra",
    Boolean(impersonatedProgress.error),
  );

  const updateOwnProgress = await studentA.client
    .from("study_progress")
    .update({ material_index: 1 })
    .eq("user_id", studentA.id)
    .eq("topic_id", topicId)
    .select("material_index")
    .single();
  check(
    "Una estudiante puede actualizar su propio progreso",
    !updateOwnProgress.error &&
      updateOwnProgress.data?.material_index === 1,
    updateOwnProgress.error?.message,
  );

  const deleteOwnProgress = await studentA.client
    .from("study_progress")
    .delete()
    .eq("user_id", studentA.id)
    .eq("topic_id", topicId);
  check(
    "Una estudiante no puede borrar directamente su progreso",
    Boolean(deleteOwnProgress.error),
  );

  const flashcardResult = await admin
    .from("flashcards")
    .select("id")
    .eq("topic_id", topicId)
    .limit(1)
    .single();
  if (flashcardResult.error) throw flashcardResult.error;
  const flashcardId = flashcardResult.data.id as number;

  const ownReview = await studentA.client.from("flashcard_reviews").insert({
    user_id: studentA.id,
    flashcard_id: flashcardId,
    rating: "hard",
  });
  if (ownReview.error) throw ownReview.error;
  const foreignReview = await studentA.client.from("flashcard_reviews").insert({
    user_id: studentB.id,
    flashcard_id: flashcardId,
    rating: "easy",
  });
  check(
    "Una estudiante no puede registrar revisiones para otra",
    Boolean(foreignReview.error),
  );

  const examResult = await admin
    .from("exams")
    .select("id")
    .eq("topic_id", topicId)
    .eq("is_current", true)
    .single();
  if (examResult.error) throw examResult.error;
  const examId = examResult.data.id as number;

  const [attemptA, attemptB] = await Promise.all([
    admin
      .from("exam_attempts")
      .insert({ user_id: studentA.id, exam_id: examId })
      .select("id")
      .single(),
    admin
      .from("exam_attempts")
      .insert({ user_id: studentB.id, exam_id: examId })
      .select("id")
      .single(),
  ]);
  if (attemptA.error) throw attemptA.error;
  if (attemptB.error) throw attemptB.error;

  const visibleAttempts = await studentA.client
    .from("exam_attempts")
    .select("id,user_id");
  if (visibleAttempts.error) throw visibleAttempts.error;
  check(
    "Cada estudiante solo puede leer sus propios intentos",
    visibleAttempts.data.length === 1 &&
      visibleAttempts.data[0].user_id === studentA.id,
  );

  const questionResult = await admin
    .from("exam_questions")
    .select("id")
    .eq("exam_id", examId)
    .order("position")
    .limit(1)
    .single();
  if (questionResult.error) throw questionResult.error;
  const questionId = questionResult.data.id as number;

  const optionResult = await admin
    .from("exam_options")
    .select("id")
    .eq("question_id", questionId)
    .order("position")
    .limit(1)
    .single();
  if (optionResult.error) throw optionResult.error;
  const optionId = optionResult.data.id as number;

  const insertedAnswers = await admin.from("exam_answers").insert([
    {
      attempt_id: attemptA.data.id,
      question_id: questionId,
      selected_option_id: optionId,
      is_correct: false,
    },
    {
      attempt_id: attemptB.data.id,
      question_id: questionId,
      selected_option_id: optionId,
      is_correct: false,
    },
  ]);
  if (insertedAnswers.error) throw insertedAnswers.error;

  const visibleAnswers = await studentA.client
    .from("exam_answers")
    .select("attempt_id");
  if (visibleAnswers.error) throw visibleAnswers.error;
  check(
    "Cada estudiante solo puede leer las respuestas de sus propios intentos",
    visibleAnswers.data.length === 1 &&
      visibleAnswers.data[0].attempt_id === attemptA.data.id,
  );

  const foreignAnswers = await studentA.client
    .from("exam_answers")
    .select("attempt_id")
    .eq("attempt_id", attemptB.data.id);
  if (foreignAnswers.error) throw foreignAnswers.error;
  check(
    "Una estudiante no puede consultar respuestas de otro intento",
    foreignAnswers.data.length === 0,
  );

  const answerKeys = await studentA.client
    .from("exam_answer_keys")
    .select("question_id")
    .limit(1);
  check(
    "Las claves de respuestas no son consultables por estudiantes",
    Boolean(answerKeys.error) || (answerKeys.data?.length ?? 0) === 0,
  );

  const publishAttempt = await studentA.client
    .from("classes")
    .update({
      publication_status: "review",
      published_at: null,
    })
    .eq("id", publishedClassId);
  check(
    "Una estudiante no puede cambiar el estado editorial",
    Boolean(publishAttempt.error),
  );

  const profiles = await studentA.client.from("profiles").select("id,role");
  if (profiles.error) throw profiles.error;
  check(
    "Una estudiante solo puede leer su propio perfil",
    profiles.data.length === 1 && profiles.data[0].id === studentA.id,
  );
}

async function cleanup() {
  if (temporaryClassId !== null) {
    const { error } = await admin
      .from("classes")
      .delete()
      .eq("id", temporaryClassId);
    if (error) {
      console.error(
        `No se pudo eliminar la clase temporal ${temporaryClassId}: ${error.message}`,
      );
    }
  }
  for (const user of createdUsers) {
    await user.client.auth.signOut();
  }
  for (const user of createdUsers) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(
        `No se pudo eliminar la cuenta temporal ${user.email}: ${error.message}`,
      );
    }
  }
}

async function run() {
  try {
    await main();
    console.log(`\n${results.length} pruebas RLS completadas correctamente.`);
  } finally {
    await cleanup();
  }
}

run().catch((error: unknown) => {
  console.error(
    error instanceof Error ? `\n✗ ${error.message}` : "\n✗ Error desconocido",
  );
  process.exitCode = 1;
});
