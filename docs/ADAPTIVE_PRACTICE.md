# Práctica adaptativa — contrato local `spacing-v1`

**Estado:** backend preparado localmente; corpus aprobado editorialmente el 28 de
agosto de 2026, condicionado a que `npm run retrieval:check` continúe aprobando.
No se ha importado ni publicado en Supabase.

La proyección lee los 456 reactivos de `docs/retrieval-practice/C01.md` a
`C57.md` y produce el contrato `retrieval-corpus-v1`. Este paso valida y separa
los datos públicos de las claves, pero no escribe en Supabase.

Hay dos autorizaciones distintas:

1. La titular ya aprobó editorialmente el contenido exacto de los 456
   reactivos. Cualquier cambio invalida esa aprobación y obliga a repetir el
   gate y la revisión humana.
2. `approvalStatus: pending_editorial_approval` sigue siendo el valor seguro
   de toda proyección nueva, para que preparar o probar el corpus nunca pueda
   importarlo por accidente.
3. Una futura ejecución autorizada deberá volver a aprobar el gate y marcar
   explícitamente esa proyección inmutable como `approved`. Solo entonces la
   RPC podrá crear filas, siempre con
   `editorial_status = draft`. Publicarlas seguirá requiriendo el flujo
   editorial y no ocurre durante la importación.

## Seguridad y persistencia

- `retrieval_items` contiene únicamente consigna y metadatos públicos.
- `retrieval_item_answer_keys` no tiene política ni permisos para clientes.
- `retrieval_item_evidence` está separada y solo se muestra con contenido
  publicado y aprobado.
- Las acciones obtienen la identidad de la sesión, vuelven a autorizar el
  reactivo y leen la clave con el cliente administrativo solo al revelar.
- Las sesiones, intentos y estados pertenecen a una usuaria. Los clientes
  autenticados pueden leer los suyos, pero las mutaciones quedan en servidor.
- Un borrador libre de respuesta nunca se persiste.

## Algoritmo

`spacing-v1` usa etapas con intervalos de 1, 3, 7, 14, 30 y 60 días. Un error
reinicia la etapa, suma un lapse, vuelve al día siguiente y se reinserta en la
sesión después de otros dos reactivos. Una respuesta parcial retrocede una
etapa y vuelve al día siguiente. Una correcta segura avanza; una correcta con
dudas conserva la etapa. `no_recall` siempre se normaliza como incorrecta.

La cola toma primero los reactivos vencidos, prioriza errores, parciales y baja
confianza, y evita más de dos reactivos consecutivos del mismo tema cuando hay
otra opción disponible.

`startOrResumePracticeSessionAction({ targetSize: 5 })` inicia la ronda global;
se puede agregar `topicId` para una ronda manual de un solo tema. La ronda
original conserva entre tres y cinco reactivos, pero la cola persistida admite
hasta 32 posiciones para reintentos. Solo existe una sesión activa por usuaria,
de modo que cualquier entrada reanuda primero esa ronda hasta completarla o
abandonarla explícitamente.

## Fecha objetivo opcional

Cada usuaria puede guardar o quitar una fecha objetivo en su perfil. La
variante `spacing-v1-exam-date-v1` conserva las reglas de spacing-v1 y solo
acorta intervalos largos a 30, 14, 7, 3 o 1 día conforme se acerca el examen.
Es una heurística de producto versionada: no es una prescripción científicamente
validada, no predice dominio y no garantiza desempeño en el examen.
