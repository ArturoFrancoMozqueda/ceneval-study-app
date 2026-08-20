# Auditoría de tres perspectivas — 19 de agosto de 2026

Tres evaluaciones independientes sobre el mismo código, sin coordinación entre
ellas, hechas sobre el commit `3af446d`.

| Informe | Perspectiva | Qué revisó |
| --- | --- | --- |
| [01-tecnica.md](01-tecnica.md) | Ingeniería | Seguridad, RLS, corrección, arquitectura, pruebas, rendimiento. Ejecutó `npm run lint` y `npx tsc --noEmit`. |
| [02-usuario.md](02-usuario.md) | Estudiante y administradora | Recorridos reales, estados, claridad del lenguaje, uso en teléfono, accesibilidad WCAG 2.2. |
| [03-producto.md](03-producto.md) | Dueña | Brecha entre lo declarado y lo real, riesgos de negocio, riesgo legal y de datos, alcance. |

Ninguna de las tres modificó archivos del proyecto.

## El hallazgo central

`docs/PROJECT_STATUS.md` declaraba como bloqueo crítico cuatro cosas que **ya
estaban construidas y funcionando**:

| Se declaraba pendiente | Realidad |
| --- | --- |
| Migración de orden curricular | `supabase/migrations/20260812175550_add_curriculum_session_metadata.sql` |
| Pantalla `/sesiones` | `app/sesiones/page.tsx`, con orden recomendado y por audios |
| Navegación anterior/siguiente | `components/class-detail.tsx:82` |
| `/estudiar` limitada a 12 temas | Nunca ocurrió: la consulta no tiene `.limit()` |

Seguir ese plan significaba reconstruir lo ya hecho. `PROJECT_STATUS.md` se
corrigió el 19 de agosto de 2026 a partir de estos informes.

## Los tres bloqueos reales

1. **C41 se publicará y será invisible.** `scripts/import-content.ts:47` no
   asigna `curriculum_code` ni `curriculum_order`; esas columnas se poblaron una
   sola vez con `update … where c.id between 10 and 49`; y
   `lib/data/academic.ts:339` descarta las clases con orden vacío. Afecta a las
   18 clases restantes.
2. **Las transcripciones originales solo existen en el disco `F:`.** Los 41
   paquetes apuntan ahí; `content:check` y `content:import` fallan en cualquier
   otra computadora.
3. **Un solo commit y cero respaldos de la base.** Sin punto de retorno para el
   código ni para las 40 clases armadas.

## Otros hallazgos frecuentes

- Cero `error.tsx`, `loading.tsx`, `not-found.tsx` y `global-error.tsx`.
- El examen recibe las explicaciones de cada opción y no las muestra.
- El repaso espaciado se escribe y nunca se lee; el contador de “respuestas
  difíciles” solo puede crecer.
- Dos numeraciones contradictorias para la misma clase.
- Redirección abierta en `app/auth/confirm/route.ts:5`.
- El anillo de foco da 1.92:1 de contraste; incumple WCAG 2.2 AA.
- En el teléfono no hay forma de cerrar sesión.

## Lo que está bien

Las respuestas correctas no se filtran: la tabla de claves tiene RLS activa sin
ninguna política y la calificación ocurre en el servidor. El validador de
contenido es el mayor acierto del proyecto. No hay fuga de la clave secreta,
`lint` y `tsc` pasan limpios, no hay un solo `any`, y las convenciones de
Next.js 16 son correctas.

## Decisiones que requieren a la dueña

1. ¿Vuelve la aprobación expresa antes de publicar? ADR-011 la exige, la
   sección 9 de `ROADMAP_TRACKING.md` la eliminó.
2. ¿Tres opciones por reactivo o cuatro? 400 de 410 tienen tres; la
   especificación dice cuatro.
3. ¿Se recortan los 16 exámenes acumulativos?
4. ¿Quién es dueño del repositorio, de Supabase y del futuro despliegue?
