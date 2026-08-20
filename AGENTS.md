<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
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

- 40 de 58 clases publicadas. La siguiente es C41 (juicio ejecutivo mercantil oral).
- La app es **privada**: solo la administradora entra. El registro de
  estudiantes está pospuesto por decisión de producto.
- **No hay despliegue.** Solo corre en `localhost`.
- Hay CI para pruebas unitarias locales, lint y build. Aún no hay pruebas
  automatizadas de interfaz.

## Orden de lectura

1. `docs/auditoria-2026-08/README.md` — auditoría del 19 de agosto de 2026.
   Corrige varias afirmaciones de los demás documentos. Léela primero.
2. `docs/PROJECT_STATUS.md` — estado y plan vigentes.
3. `docs/03-user-stories.md` — qué debe hacer el producto.
4. `docs/DECISIONS.md` — decisiones tomadas y por qué (ADR).
5. El resto de `docs/`, según lo que vayas a tocar.

`docs/archivo/` contiene documentos históricos. **No los uses como referencia.**

## Stack

Next.js 16.3.1 (App Router) · React 19.2.4 · TypeScript · Tailwind 4 ·
Supabase (auth, Postgres, RLS) · Zod. Despliegue previsto en Vercel.

## Comandos

```bash
npm install             # instalar dependencias
npm run dev             # servidor local en http://localhost:3000
npm run test:local      # pruebas locales; no usa Supabase ni el disco F:
npm run lint            # eslint
npm run build           # compilación de producción
npm run content:check   # validar paquetes de content/packages/
npm run content:import  # importar un paquete como borrador   (escribe en Supabase)
npm run security:rls    # suite de 20 pruebas de permisos      (escribe en Supabase)
```

En Windows, si PowerShell bloquea `npm.ps1`, usa `npm.cmd`.

**`content:import` y `security:rls` tocan la base remota de producción.** No los
ejecutes para "verificar" algo de paso. `security:rls` llega a publicar una
clase de prueba durante unos segundos.

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

- Un paquete solo se importa si pasa `content:check`: nueve materiales, mapa
  conceptual, fuente oficial con fecha de consulta, de 10 a 15 flashcards y
  diez reactivos con explicación por opción.
- Las fuentes deben ser oficiales (`.gob.mx`) y llevar fecha de consulta.
- La legislación cambia. Verifica vigencia antes de publicar: el validador
  comprueba formato, no vigencia.
- Conserva la transcripción original. Nunca la sustituyas por un resumen.

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
| `content/packages/` | Los 41 paquetes académicos en JSON. |
| `content/batches/` | Clasificación de los audios originales. |
| `scripts/` | Validador, importador y suite de permisos. |
| `proxy.ts` | Equivalente al antiguo `middleware.ts` en Next.js 16. |
| `docs/` | Documentación viva. |
| `docs/archivo/` | Documentos históricos. No aplican. |

## Trampas conocidas

Detectadas en la auditoría de agosto de 2026. Verifica antes de asumir que
alguna sigue abierta; si corriges una, actualiza esta lista.

- **Los paquetes nuevos deben usar el contrato 1.1.** El importador ya asigna
  `curriculum_code`, `curriculum_order` y `class_audio_sources`, y rechaza
  colisiones antes de escribir. Los paquetes históricos 1.0 se conservan para
  consulta, pero deben migrarse a 1.1 antes de volver a importarlos.
- **Las transcripciones originales solo existen en el disco `F:`.** Los 41
  paquetes apuntan a `F:\TRANSCRIPCIONES CENEVAL\AUDIO NN.txt`, así que
  `content:check` y `content:import` fallan en cualquier otra computadora.
- **Tres numeraciones distintas.** Audio 01–70 (transcripciones), C01–C58
  (orden académico) e ID de Supabase (técnico). No las confundas: C40 tiene el
  ID 49, y eso no significa que existan 49 clases.

## Variables de entorno

Copia `.env.example` a `.env.local` y complétalo. Cada variable está
documentada en ese archivo.
