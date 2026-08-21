# Auditoría de tres perspectivas — 19 de agosto de 2026

Estos informes son un **corte histórico del commit `3af446d`**. Conservan el
estado que encontraron y no deben reescribirse como si hubieran auditado el
código posterior. El estado vigente está en
[`docs/PROJECT_STATUS.md`](../PROJECT_STATUS.md).

La conciliación de este README se actualizó el 20 de agosto de 2026 contra
`origin/main` en `66dd42d`. Distingue correcciones integradas de cambios que
todavía requieren evidencia en Supabase remoto.

| Informe | Perspectiva | Qué revisó |
| --- | --- | --- |
| [01-tecnica.md](01-tecnica.md) | Ingeniería | Seguridad, RLS, corrección, arquitectura, pruebas y rendimiento. |
| [02-usuario.md](02-usuario.md) | Uso | Recorridos, estados, lenguaje, teléfono y accesibilidad WCAG 2.2. |
| [03-producto.md](03-producto.md) | Producto | Brecha entre lo declarado y lo real, riesgos legales, de datos y negocio. |

Ninguna de las tres evaluaciones modificó archivos del proyecto.

## Hallazgo documental central

La auditoría comprobó que cuatro supuestos bloqueos ya estaban resueltos incluso
en `3af446d`:

| Se declaraba pendiente | Realidad encontrada |
| --- | --- |
| Migración de orden curricular | Ya existía `20260821021153_add_curriculum_session_metadata.sql`. |
| Pantalla `/sesiones` | Ya existía con orden recomendado y por audios. |
| Navegación anterior/siguiente | Ya existía en el detalle de clase. |
| `/estudiar` limitada a 12 temas | La consulta nunca tuvo ese límite. |

Ese hallazgo motivó la primera corrección de `PROJECT_STATUS.md`. El documento
de estado volvió a conciliarse después de integrar las ramas del 20 de agosto.

## Conciliación posterior

| Hallazgo del 19 de agosto | Estado en `66dd42d` |
| --- | --- |
| El importador no asignaba código ni orden. | **Corregido en código.** El contrato 1.1 exige y escribe código, orden y audios, y detecta colisiones. Los 41 paquetes históricos siguen en 1.0 y C41 aún no prueba el recorrido remoto completo. |
| Solo había un commit. | **Corregido.** Hay historial de Git con commits y merges por frente de trabajo. |
| No existía CI. | **Corregido.** GitHub Actions ejecuta pruebas locales, lint y build sin secretos. |
| No existía procedimiento de respaldo. | **Corregido en código y documentación.** `docs/SUPABASE_BACKUP.md` incluye exportación, verificación y restauración de ensayo; su prueba sintética está en CI. La ejecución real sigue pendiente. |
| No había estados de error, carga ni 404. | **Corregido.** Existen estados globales en español y estados vacíos en los recorridos principales. |
| El examen no mostraba explicaciones. | **Corregido.** Muestra explicación general y de la opción elegida, sin enviar explicaciones no elegidas. |
| El examen aceptaba IDs cruzados. | **Corregido.** La entrega valida examen, preguntas, opciones y claves antes de persistir. |
| El repaso se escribía y no se leía. | **Corregido.** Existe `/estudiar/repaso`, cola vencida y resumen basado en la respuesta más reciente. |
| Había dos numeraciones visibles. | **Corregido.** Las vistas usan el código Cxx. |
| La confirmación permitía redirección abierta. | **Corregido.** Los destinos se restringen a rutas internas permitidas. |
| El foco era insuficiente y no había cuenta móvil. | **Corregido en código.** Hay anillo opaco y menú móvil para contraseña y cierre de sesión; falta auditoría final en dispositivos reales. |
| Acciones de estudio aceptaban recursos no publicados. | **Corregido en Server Actions.** Validan entrada y disponibilidad mediante el cliente autenticado. |
| La Data API permitía actividad sobre borradores o retiradas. | **Migración integrada, despliegue no confirmado.** La nueva política tiene prueba estática en CI, pero no hay evidencia de aplicación remota. |
| Dependencias con vulnerabilidades conocidas. | **Corregido en el árbol versionado.** Next.js está en 16.3.1 y la rama registró auditoría limpia antes de integrarse. |

## Bloqueos que siguen abiertos

1. **Dependencia del disco `F:`.** Los 41 paquetes apuntan a transcripciones que
   no están disponibles en una computadora limpia.
2. **Sin respaldo real de Supabase.** Ya existe un procedimiento versionado y
   probado con datos sintéticos, pero falta exportación autorizada, copia
   externa verificable y restauración probada de las 40 clases.
3. **RLS remota sin evidencia posterior.** La migración
   `20260821021203_restrict_learning_activity_to_published_content.sql` está en
   el repositorio, pero la última ejecución remota documentada sigue siendo la
   suite anterior de 20 comprobaciones del 29 de julio.
4. **Sin despliegue.** CI no es despliegue; la aplicación continúa en
   `localhost` y no existe vinculación comprobable con Vercel.
5. **Contenido incompleto.** Permanecen C41–C58, tres bancos y el alcance
   acordado de exámenes acumulativos.
6. **Sin pruebas automatizadas de interfaz.** Hay pruebas locales de lógica y
   seguridad, pero no recorridos completos en navegador.

## Estado de producto

Actualmente la aplicación es privada, solo entra la administradora y el
registro de estudiantes está pospuesto. El objetivo futuro es vender acceso
mediante suscripción, pero esta auditoría no define proveedor, precios, planes,
fecha de apertura ni recorridos de pago. Esas decisiones siguen abiertas y no
deben confundirse con funcionalidad actual.

## Lo que permanece sólido

Las respuestas correctas siguen separadas en `exam_answer_keys`, con RLS activa
sin políticas para clientes y calificación en servidor. La clave privada no se
expone al navegador. El esquema Zod de contenido y la conservación de la
transcripción original siguen siendo fundamentos correctos del producto.

## Decisiones que requieren a la dueña

1. ¿Vuelve la aprobación expresa antes de publicar?
2. ¿El estándar definitivo será de tres o cuatro opciones por reactivo?
3. ¿Cuál será el alcance de los 16 exámenes acumulativos?
4. ¿Quién responde por repositorio, Supabase, respaldo y despliegue?
5. Para la futura suscripción: ¿qué proveedor, planes, precio, reglas de acceso
   y soporte se aprobarán, y cuándo podrá abrirse el registro?

Hasta resolver la última decisión, la arquitectura objetivo puede reconocer la
suscripción, pero el producto actual debe permanecer privado y sin cobros.
