<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# CENEVAL Study App — contexto para agentes

Este archivo es el punto de entrada. Léelo completo antes de tocar nada.

## Qué es

Biblioteca de estudio para el examen CENEVAL de Derecho (titulación, México).
Toda la interfaz está en español.

El modelo es **editorial, no autoservicio**: la administradora entrega
transcripciones de audios de clase, el equipo editorial las convierte en
paquetes completos de estudio, y esos paquetes se importan como borrador, se
revisan y se publican. La estudiante consume contenido ya preparado; nunca
genera el suyo.

```
transcripción → preparación editorial → borrador → revisión → publicación
```

> Si encuentras un documento que describe a la estudiante pegando su propia
> transcripción para que la app la procese, es de la versión anterior del
> producto. Está en `docs/archivo/` y **no aplica**.

## Estado real

- El repositorio conserva 57 paquetes académicos vigentes (C01–C57), una
  versión retirada en el archivo editorial y el plan C01–C58. El proyecto
  remoto **CENEVAL Study App** fue verificado el 22 de agosto de 2026: 1
  usuario, 1 perfil administrador, 24 materias, 57 clases (todas
  `published`), 57 temas (todos `approved`), 513 materiales, 57 mapas
  conceptuales, 685 flashcards, 57 exámenes, 570 preguntas y 570 claves de
  respuesta. C01–C57 ya están importados, revisados y publicados; solo C58
  sigue bloqueada por falta de fuente académica.
- La app es **privada**: solo la administradora entra. El registro de
  estudiantes está pospuesto por decisión de producto.
- El objetivo futuro es ofrecerla mediante **suscripción**. El producto,
  precio ($399 MXN/mes), proveedor (Stripe) y nombre comercial (*Sube Legal*)
  ya están decididos en `docs/PLAN_VENTA_DECISIONES.md`, pero eso no autoriza
  a implementar registro público ni cobros: falta el marco legal, la
  infraestructura apta para cobrar y las etapas de
  `SUBSCRIPTION_ARCHITECTURE.md`. No implementes registro público o cobros sin
  que el plan vigente lo indique explícitamente.
- Existe un despliegue técnico privado de CENEVAL en un proyecto separado de
  Vercel sobre el plan Hobby (no autoriza uso comercial). **Vercel ya está
  conectado a Git**: el último deployment está `READY` en producción y
  corresponde al commit actual de `main`. Supabase ya tiene el catálogo
  publicado descrito arriba, pero sigue siendo de uso exclusivo de la
  administradora: no hay estudiantes ni cobros.
- La administradora se crea mediante `docs/ADMIN_BOOTSTRAP.md`. No restaures la
  autopromoción basada en `ADMIN_EMAIL` ni promociones usuarios dentro del
  render o de una petición GET.
- Hay CI para pruebas unitarias locales, lint y build. Aún no hay pruebas
  automatizadas de interfaz.

## Orden de lectura

1. `docs/PROJECT_STATUS.md` — estado y plan vigentes.
2. `docs/PLAN_ACCION_VENTA.md` y `docs/PLAN_VENTA_DECISIONES.md` — lectura
   obligatoria antes de cualquier trabajo relacionado con la venta o
   comercialización: qué falta para poder cobrar y qué decisiones de producto,
   precio, proveedor y nombre comercial ya están cerradas.
3. `docs/auditoria-2026-08/README.md` — corte histórico del 19 de agosto y
   conciliación con el código integrado después de la auditoría.
4. `docs/03-user-stories.md` — qué debe hacer el producto.
5. `docs/DECISIONS.md` — decisiones tomadas y por qué (ADR).
6. El resto de `docs/`, según lo que vayas a tocar.

`docs/archivo/` contiene documentos históricos. **No los uses como referencia.**

## Stack

Next.js 16.3.1 (App Router) · React 19.2.4 · TypeScript · Tailwind 4 ·
Supabase (auth, Postgres, RLS) · Zod. Despliegue técnico en Vercel Hobby.

## Comandos

```bash
npm install             # instalar dependencias
npm run dev             # servidor local en http://localhost:3000
npm run test:local      # pruebas locales; no usa Supabase ni el disco F:
npm run lint            # eslint
npm run build           # compilación de producción
npm run test:backup     # prueba local de integridad; usa datos sintéticos
npm run backup:supabase -- -ConfirmProduction # exportación remota autorizada
npm run content:check   # validar paquetes de content/packages/
npm run content:import  # importar un paquete como borrador   (escribe en Supabase)
npm run security:rls    # suite RLS dinámica                    (solo Supabase local)
```

En Windows, si PowerShell bloquea `npm.ps1`, usa `npm.cmd`.

**`content:import` escribe en la base remota de producción.**
**`security:rls` falla cerrado salvo que detecte el proyecto Supabase local**
**y crea únicamente un fixture sintético que elimina al terminar.**
**`backup:supabase` la lee y puede contener datos privados en disco.** No
ejecutes ninguno para "verificar" algo de paso. El respaldo requiere
autorización expresa y `-ConfirmProduction`; para comprobar el mecanismo sin
red usa `npm run test:backup`. Consulta `docs/SUPABASE_BACKUP.md`.

## Reglas duras

**Seguridad**

- `SUPABASE_SECRET_KEY` es privada. Nunca la pongas en una variable
  `NEXT_PUBLIC_*` ni la importes desde un componente de cliente.
- Los módulos de servidor llevan `server-only`. Mantenlo.
- Toda Server Action y toda página de administración verifica rol. No agregues
  una sin verificación.
- Las respuestas correctas del examen viven en `exam_answer_keys`, con RLS
  activa y **sin ninguna política** (bloqueo total). La calificación ocurre en
  el servidor. No expongas esa tabla ni muevas la lógica al cliente.
- Las vistas de estudio filtran `publication_status = 'published'`. Los
  borradores y las versiones retiradas solo se ven en administración.

**Contenido**

- Un paquete nuevo solo se importa si usa el contrato 1.2 y pasa
  `content:check`: además de los conteos editoriales, cada dinámica debe tener
  evidencia concreta y verificable. C01–C57 ya usan 1.2 y pasan el gate local.
- Las fuentes jurídicas deben ser primarias y oficiales, con autoridad
  identificada, dominio verificado o allowlist y fecha de consulta. No infieras
  oficialidad solo por el sufijo: CENEVAL, SCJN y CNDH usan dominios distintos.
- La legislación cambia. Verifica vigencia antes de publicar: el validador
  comprueba formato, no vigencia.
- Conserva la transcripción original. Nunca la sustituyas por un resumen.
- Consérvala exclusivamente en el archivo editorial privado: el gate local la
  lee para validar localizadores, pero el payload RPC, Supabase y la interfaz no
  almacenan ni muestran el texto original o depurado.

**Trabajo**

- Haz commits. El repositorio estuvo con un solo commit hasta el 19 de agosto
  de 2026; no vuelvas a acumular trabajo sin historial.
- Ejecuta `npm run lint` y `npm run build` antes de dar algo por terminado.
- La usuaria no es técnica. Explica cada paso desde cero, uno a la vez, y di
  qué resultado esperar.

## Mapa del repositorio

| Ruta | Qué contiene |
| --- | --- |
| `app/` | Rutas del App Router. `app/actions/` son las Server Actions. |
| `components/` | Componentes de interfaz. |
| `lib/data/academic.ts` | Todas las consultas a Supabase. |
| `lib/supabase/` | Clientes de Supabase (servidor, cliente, admin, proxy). |
| `lib/access.ts`, `lib/auth.ts` | Control de acceso y sesión. |
| `lib/content/` | Esquema Zod y carga de paquetes. |
| `supabase/migrations/` | Migraciones SQL, incluidas las políticas RLS. |
| `content/packages/` | Los 57 paquetes académicos vigentes C01–C57 en JSON. |
| `content/archive/withdrawn/` | Versiones retiradas; nunca se importan. |
| `content/batches/` | Clasificación de los audios originales. |
| `scripts/` | Validador, importador y suite de permisos. |
| `proxy.ts` | Equivalente al antiguo `middleware.ts` en Next.js 16. |
| `docs/` | Documentación viva. |
| `docs/archivo/` | Documentos históricos. No aplican. |

## Trampas conocidas

Detectadas en la auditoría de agosto de 2026. Verifica antes de asumir que
alguna sigue abierta; si corriges una, actualiza esta lista.

- **El contrato publicable es 1.2.** C01–C57 son los paquetes trazables:
  conservan código, orden y fuentes de audio, y sus 139, 130, 133, 133, 137,
  137, 138, 138, 140, 141, 139, 142, 144, 138, 137, 142, 142, 142, 143, 148,
  150, 152, 151, 150, 152, 150, 150, 149, 151, 151, 151, 151, 151, 151, 151, 151, 154, 155, 156, 155, 150, 153, 148, 154, 148, 150, 148, 150, 150, 151, 153, 150, 154, 149, 153, 149 y 149 artefactos, respectivamente,
  enlazan evidencia oficial o localizadores verificables de la transcripción.
  La versión retirada 1.0 se conserva fuera de `content/packages/`.
- **Las transcripciones tienen una primera copia privada verificada.** El 21 de
  agosto de 2026 se copiaron los 70 TXT fuera de la memoria USB y se comprobó
  su igualdad con SHA-256. Los 57 paquetes vigentes usan nombres portables
  `AUDIO NN.txt`; el cargador los resuelve desde `CENEVAL_TRANSCRIPTS_DIR`.
  Falta una segunda copia independiente y una restauración ensayada; los
  originales nunca se agregan a Git ni a Vercel.
- **C58 está bloqueada por falta de fuente académica.** La auditoría definitiva
  de los 70 TXT y 14 lotes no encontró una transcripción que desarrolle
  administración, cuentas, partición y adjudicación hereditaria. No se debe
  crear un paquete solo con legislación; consulta `docs/C58_SOURCE_AUDIT.md`.
- **Las 20 migraciones del repositorio están aplicadas en CENEVAL y coinciden
  una a una con `supabase/migrations/`** (la más reciente,
  `20260822160822_add_profiles_terms_accepted_at`, se aplicó el 22 de agosto
  por la tarde como parte de la tarea `L-3` del plan de venta). Verificado el
  22 de agosto de 2026:
  los asesores de Supabase solo muestran el `INFO` esperado de
  `exam_answer_keys` sin políticas (bloqueo deliberado) y un `WARN` de
  protección contra contraseñas filtradas, pendiente de activar (tarea `I-5`
  de `docs/PLAN_ACCION_VENTA.md`). En PG17 local, `npm run security:rls`
  aplicó las migraciones desde cero y aprobó 141 comprobaciones con cleanup
  sin residuos, pero esa suite dinámica todavía no se ha ejecutado contra un
  proyecto Supabase remoto (ni de ensayo ni de producción).
- **La protección de lectura por aprobación está aplicada en CENEVAL.**
  `20260821023330_restrict_reading_to_approved_topics.sql` impide que una
  estudiante lea temas pendientes o rechazados, y extiende el bloqueo a sus
  materiales, mapas, referencias, flashcards y exámenes. Su aplicación quedó
  verificada en el historial remoto, pero su comportamiento dinámico aún
  quedó verificado dinámicamente en PG17 local por la suite RLS ampliada.
- **Existe el procedimiento, no un respaldo real de Supabase.**
  `docs/SUPABASE_BACKUP.md` y `npm run test:backup` documentan y comprueban el
  mecanismo con datos sintéticos. El proyecto remoto **ya tiene contenido real
  que respaldar** (24 materias, 57 clases publicadas y el resto del catálogo,
  verificado el 22 de agosto de 2026), lo que hace más urgente, no menos,
  establecer una exportación periódica, copia externa verificada y una
  restauración en un proyecto de ensayo. Git y CI tampoco sustituyen esos pasos.
- **Hay despliegue técnico, no servicio operativo.** CENEVAL usa un proyecto
  separado en Vercel Hobby, sin cambio a Pro (no autoriza uso comercial).
  Vercel **ya está conectado a Git**: el último deployment está `READY` en
  producción y corresponde al commit actual de `main`, verificado el 22 de
  agosto de 2026. Aun así sigue sin ser un servicio operativo: no hay
  estudiantes, no hay cobros y falta confirmar que los secretos persistan
  separados por entorno Preview/Production.
- **El bootstrap administrativo existe y ya se ejecutó.** El comando
  `npm run admin:bootstrap` invita o promueve de forma explícita y verifica el
  rol; escribe en Supabase y requiere autorización, nunca pertenece a CI. El
  proyecto remoto ya tiene 1 perfil administrador confirmado (verificado el 22
  de agosto de 2026).
- **Tres numeraciones distintas.** Audio 01–70 (transcripciones), C01–C58
  (orden académico) e ID de Supabase (técnico). No las confundas: C40 tiene el
  ID 49, y eso no significa que existan 49 clases.

## Variables de entorno

Copia `.env.example` a `.env.local` y complétalo. Cada variable está
documentada en ese archivo.
