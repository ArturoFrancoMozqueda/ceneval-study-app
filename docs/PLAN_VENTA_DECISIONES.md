# Decisiones de la Fase 0 — Plan de acción para vender

**Fecha:** 22 de agosto de 2026
**Decide:** la titular del proyecto, en conversación con el asistente.
**Referencia:** `docs/PLAN_ACCION_VENTA.md` §3 Fase 0, tareas D-1 a D-9.
**D-1** tiene documento propio: [`docs/D1_DERECHOS_AUDIOS.md`](D1_DERECHOS_AUDIOS.md)
(resuelto: las grabaciones son autoría propia de la titular).

Este documento cierra D-2 a D-9. No autoriza por sí mismo abrir registro,
cobrar, ni contratar planes — solo fija las decisiones que el resto del plan
necesita para avanzar sin bloquearse.

## D-2 — Producto comercial

**Nombre comercial:** *Sube Legal* (ver D-9). Se vende **una sola
suscripción** con acceso a la biblioteca completa (57 clases, materiales,
mapas conceptuales, flashcards y exámenes), dirigida a personas que preparan
el examen CENEVAL EGEL de Derecho para titulación en México.

**Mecánica de producto — progresión por niveles.** El catálogo se agrupa en
niveles usando el campo `position` que ya existe en `classes` y `topics`
(`docs/06-database-design.md`). La estudiante avanza de nivel al completar el
examen del nivel actual. Esto es una mecánica de experiencia de uso, **no**
una segmentación de precio: no hay planes distintos por nivel, todo está
incluido en la única suscripción.

**Protección de contenido.** Además de la regla ya vigente de no exponer la
transcripción original (`AGENTS.md`), se añaden:

- Deshabilitar selección y copiado de texto en las vistas de estudio.
- Sin exportación ni descarga masiva del catálogo.
- Límite de tasa en las rutas de lectura para dificultar scraping automatizado.
- Límite de sesiones concurrentes por cuenta.
- Cláusula explícita en términos de uso que prohíbe la redistribución, con
  cancelación sin reembolso como consecuencia.
- **Disuasión de captura de pantalla:** oscurecer el contenido cuando la
  pestaña pierde el foco o se detectan las herramientas de desarrollador.
  **Limitación reconocida y aceptada:** esto no bloquea una captura real
  (PrtScn, herramienta de recorte, foto con otro dispositivo) — ninguna
  aplicación web puede hacerlo. Es disuasión de grabación de pantalla casual
  mientras se cambia de ventana, no una protección garantizada.

## D-3 — Precio, moneda y periodicidad

- **$399 MXN/mes**, cobro recurrente mensual.
- Plan anual sugerido para cuando la Fase 6 esté operativa: **~$3,499 MXN/año**
  (aprox. 27% de descuento frente a 12 pagos mensuales). Pendiente de
  confirmación explícita antes de implementarlo — no se activa en S-3 sin
  aprobación adicional del monto anual exacto.

## D-4 — Periodo de prueba

**No habrá periodo de prueba gratuito.** En su lugar, el producto ofrece una
vista de muestra gratuita permanente (una clase o examen accesible sin pagar,
tarea `P-3`) para que la persona evalúe el contenido antes de suscribirse.

## D-5 — Cancelación y reembolso

- **Cancelación:** la estudiante conserva el acceso hasta el final del periodo
  ya pagado; no se corta de inmediato.
- **Reembolso:** no hay reembolso de la parte no usada del periodo en curso.
- El progreso académico (avances, intentos, resultados) **nunca se borra** al
  cancelar, conforme a la regla general del plan (§5).

## D-6 — Proveedor de pagos

**Stripe**, cuenta contractual en **México**. Coincide con lo que ya asume
`docs/SUBSCRIPTION_ARCHITECTURE.md`; no hay que rediseñar esa arquitectura.

## D-7 — Régimen fiscal

La titular ya tiene contador/asesor fiscal propio y lo consultará
directamente sobre IVA y emisión de CFDI. **Sigue pendiente la confirmación
por escrito del contador** exigida como evidencia de cierre en el plan
original — no se activa cobro real (Fase 6, etapa 3 en adelante) sin esa
confirmación.

## D-8 — Titularidad de cuentas

La titular del proyecto es la **única titular** de GitHub, Vercel, Supabase y
será la titular de la cuenta de Stripe cuando se abra. Tiene acceso directo a
todas las claves y es el único contacto de recuperación. No hay reparto entre
varias personas.

## D-9 — Nombre comercial

**Sube Legal.** Se evaluaron con criterio de marketing (distintividad,
riesgo de colisión, resonancia emocional): *Toga* / *Toga Estudio*, *Lexta* y
*Sube Legal*. Se descartó cualquier nombre que incluyera "CENEVAL" o "EGEL"
por ser marcas de un tercero (Centro Nacional de Evaluación para la Educación
Superior, A.C.) — usarlas en el nombre comercial propio, aun con aviso de no
afiliación, expone a un reclamo de la institución.

**Nombre elegido: Sube Legal.** Conecta directamente con la mecánica de
niveles del producto (D-2).

**Pendiente antes de comprometerse por completo:** búsqueda formal en el
registro de marcas del IMPI (MARCANET) — no se hizo aquí porque el asistente
no tiene acceso a esa base de datos. Tarea de seguimiento, no bloqueante para
empezar a desarrollar con este nombre como borrador.

**Aviso de no afiliación (L-5):** debe indicarse de forma visible que *Sube
Legal* no está afiliado, patrocinado ni avalado por CENEVAL; el examen
CENEVAL EGEL de Derecho se menciona solo de forma descriptiva, como el examen
para el que el contenido prepara.

## Efecto sobre el resto del plan

Con D-1 a D-9 resueltos (D-3 con el monto anual pendiente de confirmar, D-7
pendiente de confirmación escrita del contador, D-9 pendiente de búsqueda
formal de marca), la Fase 1 (legal), Fase 2 (infraestructura), Fase 3
(respaldo) y Fase 5 (producto vendible) pueden avanzar. La Fase 6
(suscripción/cobro real) sigue sin poder activarse hasta cerrar D-7 por
escrito y completar las Fases 1 a 3, tal como exige
`docs/SUBSCRIPTION_ARCHITECTURE.md` en su Etapa 0.
