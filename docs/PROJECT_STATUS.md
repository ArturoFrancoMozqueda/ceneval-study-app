# Estado actual y plan de venta — CENEVAL Study App

Última actualización: 22 de agosto de 2026 (hora de México)

Base documental: `main` en `de403ef` (incluye la Fase 0 del plan de venta, la
Fase 1 legal, la Fase 5 de producto vendible y la unificación de marca "Sube
Legal", ya desplegadas en producción) y verificación remota de solo lectura
del 22 de agosto de 2026 contra el proyecto Supabase `CENEVAL Study App`
(`qcseoivljzuxzqeaxfly`) y el proyecto Vercel `ceneval-study-app` (team
`kova-mx`).

Responsables: Fatima (administración y validación) y Codex (desarrollo y contenido)

Este documento es el único punto de entrada para el estado del proyecto: qué
funciona, qué falta para poder cobrar, y qué decisiones ya están cerradas. Los
datos de Supabase se citan con la fecha de su última auditoría; no se vuelven
a dar por verificados sin consultar el proyecto remoto.

> Antes contenía tres documentos separados (`PLAN_ACCION_VENTA.md`,
> `D1_DERECHOS_AUDIOS.md`, `PLAN_VENTA_DECISIONES.md`). Se fusionaron aquí el
> 22 de agosto de 2026 para tener una sola fuente de verdad; los tres archivos
> ya no existen.

---

## 1. Resumen ejecutivo

La aplicación tiene un núcleo funcional completo: autenticación privada,
biblioteca académica, sesiones en orden curricular, materiales, mapas,
flashcards, repaso espaciado, exámenes, progreso, búsqueda y panel editorial.
El catálogo completo C01–C57 está importado, revisado y publicado en el
proyecto remoto. Vercel está **conectado a Git**, con el último deployment
`READY` en producción; las **20 migraciones** del repositorio están aplicadas
en Supabase y coinciden una a una con `supabase/migrations/`. El detalle
verificado está en el §2.

**En términos simples: el producto ya está construido, desplegado y con su
catálogo cargado.** Desde el 22 de agosto de 2026 también están cerradas
**todas las decisiones de negocio** para venderlo (producto, precio,
proveedor de pagos, nombre comercial — §4) y ya está publicado en producción
el código de la Fase 1 (legal) y la Fase 5 (landing, precios, muestra
gratuita) del plan de venta — §5. Lo que falta no es programar más funciones
de estudio ni tomar más decisiones de producto; es infraestructura apta para
cobrar, un respaldo real, y demostrar que la app aguanta más de una persona a
la vez.

Los bloqueos operativos reales siguen siendo:

1. los 70 TXT originales ya tienen una primera copia privada verificada con
   SHA-256, pero todavía falta una segunda copia independiente y ensayar su
   restauración;
2. el mecanismo PostgreSQL ya pasó un respaldo y una restauración reales en
   local, pero todavía no existe una exportación del remoto, una copia externa
   cifrada ni una restauración de esa copia en un proyecto de ensayo;
3. C58 está bloqueada por insuficiencia de fuente y los tres bancos
   transversales y 16 exámenes acumulativos siguen pendientes de decisión de
   alcance;
4. **vender sigue bloqueado por razones no técnicas, no por el estado del
   código o del contenido**: Vercel sigue en un plan que no permite uso
   comercial, Supabase sigue sin respaldos automáticos gestionados, no hay
   dominio propio ni correo transaccional propio, y no hay respaldo real de
   la base remota ni monitoreo. El plan completo, con evidencia de cierre por
   tarea, está en el §5.

El historial de Git ya es útil y existe CI. Esos dos hallazgos de la auditoría
original están resueltos, pero ninguno reemplaza un respaldo real de la base
remota.

### Producto, precio y decisiones comerciales

El producto comercial, el precio, el proveedor de pagos y el nombre comercial
**ya están decididos** (§4): una sola suscripción a la biblioteca completa,
**$399 MXN/mes** vía **Stripe**, bajo el nombre ***Sube Legal***, sin periodo
de prueba gratuito. Esas decisiones no autorizan por sí solas a abrir el
registro ni a cobrar: falta el marco legal, la infraestructura apta para
cobrar y completar las etapas de `SUBSCRIPTION_ARCHITECTURE.md`, en ese orden.

La arquitectura técnica objetivo ya está documentada en
[`SUBSCRIPTION_ARCHITECTURE.md`](SUBSCRIPTION_ARCHITECTURE.md) y registrada en
ADR-015. Separa rol y entitlement, deniega acceso por defecto y define
webhooks, RLS, conciliación, entornos y recuperación. Es diseño, no
funcionalidad integrada: no existe proveedor, checkout, webhook ni tabla de
suscripciones.

La decisión de datos y su roadmap están documentados en
[`DATA_ARCHITECTURE.md`](DATA_ARCHITECTURE.md) y ADR-016. Supabase PostgreSQL se
mantiene como fuente única de verdad; NoSQL, Redis, búsqueda vectorial,
particionado y réplicas solo se evaluarán al cruzar umbrales medidos. Esta
decisión no añade infraestructura ni reemplaza los gates operativos vigentes.

---

## 2. Estado verificado hoy

| Área | Estado comprobado el 22 de agosto de 2026 |
| --- | --- |
| Despliegue | Vercel **conectado a Git**. El deployment en producción corresponde al commit actual de `main` (`de403ef`), publicado por deploy manual de CLI el 22 de agosto por la tarde. |
| Salud | `GET /api/health/live` responde `200`. `GET /api/health/ready` responde `404` sin token, que es el comportamiento correcto. |
| Base de datos | Las **20 migraciones** del repositorio están aplicadas en el proyecto remoto (19 verificadas el 22 de agosto por la mañana + `20260822160822_add_profiles_terms_accepted_at` de la tarea `L-3`, aplicada esa misma tarde). Coinciden una a una con `supabase/migrations/`. |
| Contenido publicado | **24 materias, 57 clases (todas `published`), 57 temas (todos `approved`), 513 materiales, 57 mapas conceptuales, 685 flashcards, 57 exámenes, 570 preguntas y 570 claves de respuesta.** Detalle completo en el §8. |
| Seguridad de base | Los asesores de Supabase solo reportan el `INFO` esperado de `exam_answer_keys` sin políticas (bloqueo deliberado) y un `WARN` de contraseñas filtradas, pendiente de activar (`I-5`). Sin errores. |
| Código | `npm run lint` pasa sin hallazgos. El build de producción del mismo commit se completó en Vercel. |
| Usuarios | **1 usuario, 1 perfil administrador, 0 intentos de examen** en producción. |
| Venta | Fase 0 (decisiones) cerrada, Fase 1 (legal) y Fase 5 (producto vendible) publicadas en producción — ver §4 y §5. |

### Lo que todavía no existe

- No hay pagos, planes, entitlements, checkout ni webhook reales.
- No hay registro abierto: `PRIVATE_ACCESS_ONLY` es obligatorio en `true` y
  `lib/operations/runtime-env.ts:91` **falla el arranque** si vale otra cosa.
- No hay dominio propio: solo `ceneval-study-app.vercel.app`. Los correos de
  contacto publicados (`privacidad@sube-legal.mx`, `soporte@sube-legal.mx`)
  son placeholders que no reciben correo real todavía.
- No hay respaldo real de la base remota, ni copia externa, ni restauración
  ensayada.
- No hay monitoreo, alertas, registro de errores ni canal de soporte atendido.
- Vercel sigue en Hobby (no permite uso comercial) y Supabase sigue en plan
  `free` (sin respaldos automáticos gestionados).

---

## 3. Los cinco bloqueos que impiden cobrar

Están ordenados por gravedad. Ninguno de los cuatro que siguen abiertos se
resuelve con código.

### B1 — Derechos sobre los audios de origen · ✅ **resuelto el 22 de agosto de 2026**

La auditoría de producto (`docs/auditoria-2026-08/03-producto.md` §3.1) había
señalado como hipótesis que las 70 transcripciones podían provenir de un curso
comercial ajeno grabado, sin que existiera ningún documento de licencia o
consentimiento en el repositorio. **La titular del proyecto confirmó que las
70 grabaciones que originaron las transcripciones de `content/batches/` y los
paquetes académicos `content/packages/` (C01–C57) son autoría propia suya**,
no de un tercero. En consecuencia no aplica el supuesto de "explotación
comercial de contenido derivado de obra ajena" que motivaba este bloqueo, y no
se necesita un permiso de tercero: la titular ya tiene el alcance comercial
completo sobre el material.

Resolver la autoría no cierra automáticamente el resto de la Fase 0. Siguen
pendientes, sin depender de esta decisión:

- Verificar que ninguna transcripción cite o reproduzca material de terceros
  (por ejemplo, fragmentos de exámenes CENEVAL con derechos propios, o citas
  extensas de doctrina con derechos de autor de un tercero) más allá del uso
  permitido de fuentes jurídicas primarias ya exigido en `AGENTS.md`.
- El aviso de no afiliación con CENEVAL (`L-5`, ya publicado) sigue siendo
  obligatorio: ser autora del contenido no implica relación con el organismo
  examinador.
- Las referencias sistemáticas a "el docente" y la limpieza de marca de
  TurboScribe detectadas por la auditoría deben revisarse para que el tono del
  material publicado no sugiera erróneamente un curso de tercero.

### B2 — Los planes contratados prohíben o impiden vender · **crítico, abierto**

- **Vercel Hobby** no permite uso comercial. Cobrar sobre Hobby es una
  violación de sus términos y expone a la suspensión del proyecto.
- **La organización de Supabase está en plan `free`.** El plan gratuito no
  incluye respaldos automáticos diarios ni recuperación a un punto en el
  tiempo. Cobrar por acceso a datos que no tienen respaldo gestionado es un
  riesgo operativo que no se debe asumir.

### B3 — Sin marco legal completo de cara a la usuaria · **crítico, parcialmente resuelto**

Al entrar la primera estudiante de pago, la app guarda correo, nombre,
contraseña, progreso por tema, intentos y cada respuesta individual, en
proveedores fuera de México. Eso exige aviso de privacidad conforme a la
LFPDPPP con derechos ARCO y transferencia internacional, términos de uso,
política de cancelación y reembolso, y datos fiscales. El aviso de privacidad
y los términos de uso **ya están publicados** (`L-1`, `L-2` — §5); siguen
pendientes los datos fiscales (`D-7`, §4) y una prueba de extremo a extremo
del borrado/exportación de cuenta con una usuaria real (`L-4`).

### B4 — Sin correo transaccional propio · **alto, abierto**

El registro, la confirmación de cuenta y la recuperación de contraseña dependen
del correo. El servicio de correo por defecto de Supabase está limitado a unos
pocos envíos por hora y es solo para desarrollo. Con registro abierto, las
altas fallarían silenciosamente. Depende de contratar un dominio propio
(`I-3`, `I-4`).

### B5 — La aplicación nunca ha sido usada por dos personas a la vez · **alto, abierto**

Hay 1 usuario y 0 intentos de examen en producción. Las 141 comprobaciones RLS
y el E2E se ejecutaron **en local**, no contra el proyecto remoto. El
aislamiento entre estudiantes está diseñado y probado localmente, pero no
demostrado en el entorno real (`M-1` a `M-3`, §5).

---

## 4. Decisiones de Fase 0 — producto, precio y titularidad (todas cerradas)

Decididas por la titular del proyecto el 22 de agosto de 2026. No autorizan
por sí solas a abrir el registro, cobrar ni contratar planes — solo fijan lo
que el resto del plan necesita para avanzar sin bloquearse.

**D-1 — Derechos de los audios: resuelto.** Ver B1 arriba: las grabaciones son
autoría propia de la titular.

**D-2 — Producto comercial.** Nombre comercial ***Sube Legal***. Se vende
**una sola suscripción** con acceso a la biblioteca completa (57 clases,
materiales, mapas conceptuales, flashcards y exámenes), dirigida a personas
que preparan el examen CENEVAL EGEL de Derecho para titulación en México.

*Mecánica de producto — progresión por niveles:* el catálogo se agrupa en
niveles usando el campo `position` que ya existe en `classes` y `topics`
(`docs/06-database-design.md`). La estudiante avanza de nivel al completar el
examen del nivel actual. Es una mecánica de experiencia de uso, **no** una
segmentación de precio: no hay planes distintos por nivel, todo está incluido
en la única suscripción.

*Protección de contenido* (además de la regla ya vigente de no exponer la
transcripción original): deshabilitar selección y copiado de texto en las
vistas de estudio (✅ publicado), disuasión de captura de pantalla oscureciendo
el contenido al perder foco o detectar herramientas de desarrollador (✅
publicado, ver `docs/CONTENT_PROTECTION.md` para su limitación reconocida: no
bloquea una captura real), sin exportación ni descarga masiva del catálogo,
límite de tasa en las rutas de lectura contra scraping, límite de sesiones
concurrentes por cuenta (estos dos últimos solo diseñados en
`docs/CONTENT_PROTECTION.md`, sin implementar), y cláusula en términos de uso
que prohíbe la redistribución con cancelación sin reembolso como consecuencia
(✅ publicada).

**D-3 — Precio, moneda y periodicidad.** **$399 MXN/mes**, cobro recurrente
mensual. Plan anual sugerido para cuando la Fase 6 esté operativa: ~$3,499
MXN/año (~27% de descuento); pendiente de confirmación explícita del monto
exacto antes de implementarlo.

**D-4 — Periodo de prueba.** **No habrá periodo de prueba gratuito.** En su
lugar, una vista de muestra gratuita permanente (`P-3`, ✅ publicada en
`/muestra`).

**D-5 — Cancelación y reembolso.** La estudiante conserva el acceso hasta el
final del periodo ya pagado; no se corta de inmediato. No hay reembolso de la
parte no usada. El progreso académico nunca se borra al cancelar (regla
general del §7).

**D-6 — Proveedor de pagos.** **Stripe**, cuenta contractual en **México**.
Coincide con lo que ya asume `docs/SUBSCRIPTION_ARCHITECTURE.md`.

**D-7 — Régimen fiscal.** La titular tiene contador/asesor fiscal propio y lo
consultará directamente sobre IVA y emisión de CFDI. **Sigue pendiente la
confirmación por escrito del contador** — no se activa cobro real (Fase 6,
etapa 3 en adelante) sin ella.

**D-8 — Titularidad de cuentas.** La titular del proyecto es la **única
titular** de GitHub, Vercel, Supabase y será la titular de la cuenta de
Stripe cuando se abra. Tiene acceso directo a todas las claves y es el único
contacto de recuperación.

**D-9 — Nombre comercial.** **Sube Legal.** Se evaluaron con criterio de
marketing (distintividad, riesgo de colisión, resonancia emocional): *Toga* /
*Toga Estudio*, *Lexta* y *Sube Legal*. Se descartó cualquier nombre que
incluyera "CENEVAL" o "EGEL" por ser marcas de un tercero (Centro Nacional de
Evaluación para la Educación Superior, A.C.) — usarlas en el nombre comercial
propio, aun con aviso de no afiliación, expone a un reclamo de la institución.
**Pendiente:** búsqueda formal en el registro de marcas del IMPI (MARCANET),
no bloqueante para seguir desarrollando con este nombre como borrador. El
aviso de no afiliación con CENEVAL ya está publicado (`L-5`).

Con D-1 a D-9 resueltas (D-3 con el monto anual pendiente, D-7 pendiente de
confirmación escrita, D-9 pendiente de búsqueda de marca), las Fases 1, 2, 3 y
5 pueden avanzar. La Fase 6 (suscripción/cobro real) sigue sin poder
activarse hasta cerrar D-7 por escrito y completar las Fases 1 a 3.

---

## 5. Plan de acción por fases

Cada tarea tiene una evidencia de cierre. Sin esa evidencia, la tarea no está
hecha.

### Fase 1 — Marco legal y de cumplimiento

| ID | Tarea | Evidencia de cierre |
| --- | --- | --- |
| L-1 | Redactar y publicar el **aviso de privacidad** LFPDPPP: datos recabados, finalidades, transferencia internacional (Supabase y Vercel fuera de México), plazo de conservación y ejercicio de derechos ARCO con un correo de contacto real. | **✅ Publicado en producción (22 ago)**, `/privacidad`. Correo `privacidad@sube-legal.mx` sigue siendo provisional hasta tener dominio propio (`I-3`). |
| L-2 | Redactar y publicar los **términos de uso**, incluyendo cancelación, reembolso, uso permitido y limitación de responsabilidad. | **✅ Publicado en producción (22 ago)**, `/terminos`. |
| L-3 | Añadir en el registro una casilla explícita de aceptación de términos y aviso de privacidad, y guardar la fecha de aceptación. | **✅ Hecho (22 ago).** Columna `profiles.terms_accepted_at` aplicada al proyecto remoto (migración `20260822160822_add_profiles_terms_accepted_at`). |
| L-4 | Implementar **borrado de cuenta y exportación de datos personales** a solicitud de la usuaria. | **✅ Publicado en producción (22 ago)**, `/cuenta`. Falta la prueba de extremo a extremo con una cuenta real. |
| L-5 | Añadir el aviso de no afiliación con CENEVAL en un lugar visible. | **✅ Hecho (22 ago).** |
| L-6 | Definir el canal de soporte y el compromiso de tiempo de respuesta. | **✅ Publicado en producción (22 ago).** Correo `soporte@sube-legal.mx` provisional hasta tener dominio propio (`I-3`); falta definir quién lo atiende. |

> El aviso educativo de "no constituye asesoría jurídica" ya estaba en la
> aplicación desde antes; no hubo que rehacerlo.

### Fase 2 — Infraestructura apta para cobrar

| ID | Tarea | Evidencia de cierre |
| --- | --- | --- |
| I-1 | Subir Vercel a un plan que permita uso comercial. | Factura o confirmación del plan activo. |
| I-2 | Subir Supabase a un plan con respaldos automáticos diarios y recuperación a punto en el tiempo. | Respaldos automáticos visibles en el panel del proyecto. |
| I-3 | Contratar un dominio propio, apuntarlo a Vercel y actualizar `NEXT_PUBLIC_SITE_URL` y las URLs de redirección de Supabase Auth. | El dominio sirve la app por HTTPS y el correo de confirmación apunta a él. |
| I-4 | Configurar un proveedor de correo transaccional propio en Supabase Auth y probar alta, confirmación y recuperación de contraseña. | Tres correos recibidos en una cuenta real, desde el dominio propio. |
| I-5 | Activar la protección contra contraseñas filtradas en Supabase Auth. | El asesor de seguridad deja de reportar el `WARN`. |
| I-6 | Verificar que las siete variables de entorno de `.env.example` están configuradas por separado en Preview y en Production, sin exponer valores. | `npm run ops:preflight:production` en verde contra el entorno real. |
| I-7 | Revisar los límites de autenticación (intentos de acceso, altas por hora) antes de abrir el registro. | Configuración registrada en el runbook. |

### Fase 3 — Respaldo y recuperación reales

| ID | Tarea | Evidencia de cierre |
| --- | --- | --- |
| R-1 | Ejecutar `npm run backup:supabase -- -ConfirmProduction` sobre el proyecto remoto y verificarlo con `npm run backup:verify`. | Exportación fechada con sumas SHA-256 verificadas. |
| R-2 | Guardar una copia cifrada de ese respaldo fuera del equipo de trabajo. | Ubicación registrada y copia comprobada. |
| R-3 | Restaurar ese respaldo en un proyecto de ensayo y comprobar que el contenido llega completo. | Proyecto de ensayo con las 57 clases restauradas. |
| R-4 | Crear la segunda copia independiente de las 70 transcripciones originales y verificarla contra el manifiesto privado. | `npm run transcripts:verify` sin diferencias sobre la segunda copia. |
| R-5 | Definir la periodicidad del respaldo manual y quién lo ejecuta. | Calendario escrito en el runbook. |

### Fase 4 — Demostrar que aguanta varios usuarios

| ID | Tarea | Evidencia de cierre |
| --- | --- | --- |
| M-1 | Crear un **proyecto Supabase de ensayo** con las 20 migraciones aplicadas desde cero. | Historial de migraciones del proyecto de ensayo. |
| M-2 | Ejecutar allí la suite RLS completa con dos estudiantes y una administradora. | Las comprobaciones aprobadas y sin residuos, registradas con fecha. |
| M-3 | Comprobar en el ensayo que una estudiante no ve el progreso, los intentos ni las respuestas de otra. | Evidencia de la prueba cruzada. |
| M-4 | Invitar a 3 a 5 personas reales de confianza, sin cobro, a recorrer la app completa en teléfono y computadora. | Lista de hallazgos y su corrección. |
| M-5 | Ejecutar al menos un examen completo real en producción y revisar el resultado y el historial. | Intentos mayores que cero en producción, con resultado correcto. |
| M-6 | Medir tiempos de respuesta con el catálogo completo de 57 clases. | Medición registrada en `docs/DATA_ARCHITECTURE.md`. |

### Fase 5 — Producto vendible

| ID | Tarea | Evidencia de cierre |
| --- | --- | --- |
| P-1 | Construir una **página pública** en la raíz: qué es, para quién, qué incluye, y llamada a la acción. | **✅ Publicado en producción (22 ago).** `app/page.tsx` muestra la landing a visitantes anónimos. |
| P-2 | Construir la **página de precios** con el plan aprobado en D-3. | **✅ Publicado en producción (22 ago)**, `/precios`. Botón de suscripción deshabilitado a propósito (sin checkout real). |
| P-3 | Preparar una vista de muestra gratuita: una clase accesible sin pagar. | **✅ Publicado en producción (22 ago)**, `/muestra` (C01, sin examen). |
| P-4 | Escribir el texto de venta y las preguntas frecuentes, incluyendo qué **no** incluye el producto. | **✅ Publicado en producción (22 ago)**, `/preguntas-frecuentes`. |
| P-5 | Decidir el destino de C58: obtener la transcripción faltante descrita en `docs/C58_SOURCE_AUDIT.md`, o vender explícitamente 57 clases. | Decisión escrita. No crear C58 solo con legislación. |
| P-6 | Decidir el alcance de los 3 bancos transversales y los 16 exámenes acumulativos pendientes: entran en el lanzamiento o se anuncian como futuros. | Decisión escrita y reflejada en la página de precios. |

### Fase 6 — Suscripción, en el orden de `SUBSCRIPTION_ARCHITECTURE.md`

Esta fase ya está diseñada a detalle. **No la rediseñes**: sigue sus etapas.

| ID | Tarea | Evidencia de cierre |
| --- | --- | --- |
| S-1 | Etapa 1: migraciones de `billing_customers`, `subscription_records`, `entitlements`, `billing_events` y auditoría, en esquema privado y detrás de una bandera apagada. | Migraciones aplicadas en el proyecto de ensayo y suite RLS aprobada. |
| S-2 | Implementar `requireEntitlement` denegando por defecto, y el entitlement `operations` explícito para la administradora. | Pruebas que demuestran que rol y derecho de acceso son independientes. |
| S-3 | Etapa 2: integrar el proveedor **solo en sandbox**, con checkout que toma precio de configuración de servidor. | Alta, renovación, fallo, cancelación y recuperación probados en sandbox. |
| S-4 | Implementar el webhook firmado, idempotente y resistente a reenvíos, con las pruebas del §14 de la arquitectura. | Firma inválida, duplicado, replay y desorden cubiertos por pruebas. |
| S-5 | Implementar la conciliación periódica contra el proveedor. | Una ejecución que detecta y repara una diferencia sembrada. |
| S-6 | Etapa 3: piloto privado con invitaciones y cobro real de bajo volumen. | Al menos un ciclo completo de alta, cobro, comprobante y cancelación. |
| S-7 | Etapa 4: apertura comercial, cambiando `PRIVATE_ACCESS_ONLY` y el gate de `lib/operations/runtime-env.ts`. | Checklist de lanzamiento firmado. |

### Fase 7 — Operación mientras se cobra

| ID | Tarea | Evidencia de cierre |
| --- | --- | --- |
| OP-1 | Configurar monitoreo del endpoint de readiness con su token, y una alerta cuando falle. | Alerta probada provocando un fallo. |
| OP-2 | Añadir registro de errores del servidor con alertas, sin datos personales. | Un error de prueba visible en la herramienta. |
| OP-3 | Añadir analítica de uso mínima y respetuosa, declarada en el aviso de privacidad. | Métricas visibles y declaradas. |
| OP-4 | Ejecutar `docs/DEPLOYMENT_RUNBOOK.md` completo en la siguiente publicación y aprobarlo. | Runbook con la publicación registrada y rollback probado. |
| OP-5 | Escribir el plan de respuesta a incidentes: quién responde, en cuánto tiempo, y cómo se avisa a las usuarias. | Documento aprobado. |
| OP-6 | Conciliar la documentación de estado con el estado real verificado. | **✅ Hecho.** Este documento es el resultado; ya no hay tres documentos separados que puedan desincronizarse. |

### Ruta crítica

```text
D-1 (derechos)  ──►  ✅ resuelto (autoría propia) — el plan continúa
      │
      ▼
D-2 … D-9 (producto, precio, proveedor, fiscal, titularidad)  ──►  ✅ cerradas
      │
      ├──►  L-1 … L-6   (legal)        ─┐   ✅ publicadas en producción
      ├──►  I-1 … I-7   (infra)         ├──►  M-1 … M-6  ──►  P-1 … P-6
      └──►  R-1 … R-5   (respaldo)     ─┘        (pendientes)   (P-1–P-4 ✅, P-5/P-6 pendientes)
                                                                   │
                                                                   ▼
                                                        S-1 … S-7 (suscripción, sin empezar)
                                                                   │
                                                                   ▼
                                                        OP-1 … OP-6 (operación)
```

Las fases 2 y 3 pueden avanzar en paralelo. La fase 6 no debe empezar antes de
cerrar la 1, la 2 y la 3, porque la arquitectura de suscripciones lo exige
explícitamente en su Etapa 0.

### Qué no hacer todavía

Copiado del §16 de `docs/SUBSCRIPTION_ARCHITECTURE.md`, sigue vigente:

- No cambiar `PRIVATE_ACCESS_ONLY` para abrir el registro.
- No habilitar checkout, portal ni webhook de producción.
- No crear productos, precios ni pruebas reales sin decisión aprobada.
- No aceptar datos de tarjeta dentro de la aplicación.
- No conceder acceso desde la URL de éxito ni desde parámetros del navegador.
- No cobrar antes de tener respaldo restaurable, RLS verificada en remoto,
  políticas legales y fiscales, y soporte.
- No borrar el progreso académico al cancelar o reembolsar.

---

## 6. Inventario académico conocido

La verificación de solo lectura del proyecto remoto **CENEVAL Study App**
actualizada el 22 de agosto de 2026 confirmó **1 usuario con inicio de
sesión, 1 perfil administrador, 0 intentos de examen, 24 materias, 57 clases
(todas `published`), 57 temas (todos `approved`), 513 materiales, 57 mapas
conceptuales, 685 flashcards, 57 exámenes, 570 preguntas y 570 claves de
respuesta**. El catálogo C01–C57 ya está importado, revisado y publicado.
Esto confirma que el bootstrap administrativo ya ocurrió, pero no sustituye
una prueba E2E autenticada con más de una cuenta estudiante real (bloqueo
B5).

| Elemento | Dato verificado el 22 de agosto de 2026 |
| --- | ---: |
| Clases académicas previstas (C01–C58) | 58 |
| Clases publicadas | 57 |
| Clases restantes (C58, bloqueada) | 1 |
| Materias con clases publicadas | 24 |
| Temas aprobados | 57 |
| Materiales publicados | 513 |
| Mapas conceptuales | 57 |
| Flashcards | 685 |
| Exámenes publicados | 57 |
| Preguntas de examen | 570 |
| Claves de respuesta | 570 |

El repositorio conserva C01–C57 como paquetes trazables en contrato 1.2 y una
versión retirada en el archivo editorial; esos mismos 57 ya están publicados
en el proyecto remoto. C41 usa Audio 54 y solo las líneas
13–69 pertinentes de Audio 55; C42 usa las líneas 85–295 de Audio 55; C43 usa
Audio 56, líneas 23–199; C44 usa Audio 58, líneas 13–297; C45 usa la línea
física 3 de Audio 59 solo como contexto amplio y sustenta las reglas en la
LFT oficial; C46 usa rangos acotados de Audio 59 y Audio 60, excluyendo esa
línea mixta no delimitable; C47 usa rangos pertinentes de Audio 60 y corrige
las generalizaciones procesales con la LFT; C48 usa líneas breves de Audio
61 y la línea 31 solo como contexto amplio, excluyendo las líneas gigantes 29
y 33; C49 usa rangos verificables de Audio 62 y limita sus reglas al régimen
vigente de Michoacán; C50 usa solo las líneas 15–19 y 21–25 de Audio 69
para enseñar el modelo nacional condicionado a declaratoria territorial; C51
usa rangos mínimos de Audio 46 y corrige la formalidad de capitulaciones con el
Código Familiar de Michoacán; C52 usa únicamente el bloque familiar de Audio
63 y excluye la sucesión que comienza en la línea 57; C53 cubre los subrangos
académicos de Audio 67, líneas 169–265, y separa el régimen michoacano del
modelo nacional gradual; C54 usa las líneas físicas completas 3, 5 y 9 de
Audio 68 sin inventar sublíneas, porcentajes ni recursos automáticos; C55 usa
solo subrangos sucesorios pertinentes de Audio 63, líneas 75–155; y C56 usa
Audio 63, líneas 157–209, y Audio 64, líneas 17–45, excluyendo el cierre no
pertinente 211–231; y C57 usa subrangos académicos de Audio 64, líneas 47–109,
para inventario, avalúo y oposición. C58 permanece bloqueada: la auditoría de
70/70 TXT y 14/14 lotes no encontró una transcripción suficiente sobre
administración, cuentas, partición y adjudicación (`docs/C58_SOURCE_AUDIT.md`).
C01–C57 ya están importados, revisados y publicados en el proyecto CENEVAL; no
queda una importación pendiente para ellos.

Existen tres identificadores distintos:

- Audio 01–70: procedencia de las transcripciones;
- C01–C58: orden académico recomendado;
- ID de Supabase: identificador técnico sin significado curricular.

C40 tiene el ID 49; eso no significa que existan 49 clases vigentes.

---

## 7. Estado técnico integrado

### Plataforma y dependencias

- Next.js 16.3.1 con App Router.
- React y React DOM 19.2.4.
- Supabase JS 2.110.8 y `@supabase/ssr` 0.12.3.
- Supabase CLI 2.115.0 fijada como dependencia de desarrollo para respaldos.
- Zod 4.4.3, TypeScript 5 y Tailwind 4.
- Node 24.14.0 fijado en `.node-version`.
- `npm audit --audit-level=moderate` reportó cero vulnerabilidades el 20 de
  agosto de 2026 sobre el árbol versionado.

### Integración continua

`.github/workflows/ci.yml` ejecuta en cada pull request y cada push a `main`:

1. `npm ci --ignore-scripts`;
2. `npm run test:local`;
3. `npm run lint`;
4. `npm run build`.

Las acciones de terceros están fijadas por SHA, el job tiene permisos de solo
lectura y no recibe secretos. La CI no se conecta a Supabase ni sustituye las
pruebas de interfaz o la suite RLS remota.

El contrato del gate `npm run db:lint:local` usa exclusivamente la instancia
local de Supabase y falla ante cualquier advertencia de `plpgsql_check`. Antes
de ejecutarlo, Supabase local debe estar activo; el comando no acepta
`--linked`, una URL ni una referencia de proyecto remoto.

### Despliegue técnico en Vercel

CENEVAL tiene un despliegue técnico privado en Vercel sobre Hobby; la cuenta no
se cambió a Pro (sigue sin permitir uso comercial, bloqueo B2).

**Incidente del 23 de agosto de 2026 — resuelto:** el dominio de producción
llevaba desde el 21 de agosto sirviendo un deployment subido manualmente por
CLI (`dpl_Brb4...`), previo a la migración `minimize_transcript_storage.sql`
que eliminó la tabla `public.transcripts`. Ese build viejo seguía consultando
esa tabla al abrir una clase o un tema (`getClass`), y producía el error
genérico "No pudimos consultar los datos" para la única usuaria admin. Se
comprobó con `GET /kova-mx/ceneval-study-app` (Vercel API) que el proyecto
**nunca tuvo la GitHub App de Vercel conectada**: el registro de "no se
disparan deploys automáticos en cada push", anotado el 22 de agosto, no era un
comportamiento a corregir sino la ausencia real de la conexión. Causa raíz:
la instalación de la GitHub App "Vercel" en la cuenta de GitHub tenía acceso
restringido a 3 repositorios (`sweet_home_pos`, `valt`, `kova`) y no incluía
`ceneval-study-app`. Se agregó el repositorio en
`github.com/settings/installations` y se conectó desde
`Project Settings → Git` en Vercel. **A partir de ahora, cada push a `main`
debe disparar un deployment automático de producción** — hay que confirmarlo
con el primer push real y, si el deployment resultante queda listo, promoverlo
para reemplazar el build viejo que sigue como alias activo. `GET
/api/health/live` responde `200`; `GET /api/health/ready` responde `404` sin
token, que es el comportamiento correcto y esperado (exige el token de
operaciones). `npm run lint` pasa sin hallazgos y el build de producción del
mismo commit se completó en Vercel.

La consulta de solo lectura de los metadatos de entorno de Vercel del 21 de
agosto, sin leer ni imprimir valores, no encontró ninguna de las siete
variables obligatorias de `.env.example` en el proyecto; esa comprobación
específica no se repitió el 22 de agosto y sigue sin confirmarse que las
variables persistan separadas por entorno Preview/Production. Antes de operar
deben configurarse y comprobarse los alcances Preview/Production de
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`,
`PRIVATE_ACCESS_ONLY` y `OPS_READINESS_TOKEN`, además de las redirecciones de
Supabase Auth (tarea `I-6`). El bootstrap de `docs/ADMIN_BOOTSTRAP.md` ya
produjo el único perfil administrador con inicio de sesión confirmado hoy;
falta repetir el E2E autenticado sobre el artefacto publicado con más de una
cuenta.

`docs/DEPLOYMENT_RUNBOOK.md` ya define un flujo fail-closed para registrar SHA,
CI, proyecto, deployment anterior, preview, digest del build Production,
health, recorrido administrativo, logs y rollback de aplicación. Distingue las
configuraciones Preview/Production porque `NEXT_PUBLIC_*` queda congelado en
cada build, y no promete rollback de base de datos. El procedimiento todavía no
se ha ejecutado contra Vercel.

### Respaldo de Supabase

`docs/SUPABASE_BACKUP.md` documenta un respaldo lógico con la CLI fijada:

- `npm run test:backup` crea datos sintéticos y comprueba integridad local sin
  red ni credenciales;
- `npm run backup:supabase -- -ConfirmProduction` es el único comando que lee
  el proyecto remoto y exige autorización expresa;
- `npm run backup:verify` valida archivos, tamaños y sumas SHA-256;
- el procedimiento exige copia cifrada externa y restauración separada en un
  proyecto de ensayo.

El mecanismo está versionado y su prueba sintética forma parte de
`test:local`. Además, `npm run test:backup-restore:local` pasó el 21 de agosto
de 2026 contra PostgreSQL 17 local: creó un dump binario, lo restauró en una
base temporal, comparó esquema, RLS, datos, evidencia, digests y round-trip 1.2,
y terminó sin bases, archivos ni datos sintéticos residuales. Esta comprobación
no equivale a restaurar una exportación de CENEVAL: todavía no se ha generado un
respaldo remoto real ni existe una copia externa comprobada. Los respaldos
pueden contener datos privados y están excluidos de Git.

### Navegación y estados

- `/sesiones` muestra las clases publicadas por orden Cxx y por audio.
- La navegación anterior/siguiente usa el orden curricular.
- Las vistas de materia muestran el código Cxx; ya no numeran por posición.
- Existen `app/error.tsx`, `app/global-error.tsx`, `app/loading.tsx` y
  `app/not-found.tsx`, todos en español y con una salida comprensible.
- Hay estados vacíos con acciones en sesiones, materias, clase, estudio y
  administración, además de un estado específico para una cola de repaso vacía.
- Los estados editoriales se traducen mediante `lib/status-labels.ts`.
- La cuenta móvil permite cambiar contraseña y cerrar sesión.
- El foco visible usa un anillo opaco de alto contraste.
- La navegación ofrece un enlace para saltar al contenido y el progreso expone
  semántica ARIA.
- La interfaz solo confirma el guardado después de recibir éxito del servidor y
  muestra un error cuando falla.
- Los pasos completados describen el recorrido, no afirman dominio académico;
  se retiraron el selector de minutos sin efecto y la falsa comprobación que
  repetía una flashcard.

Esto resuelve los hallazgos generales de ausencia de estados y numeración. No
equivale todavía a una prueba automática de cada URL inválida o de todos los
recorridos en navegador.

### Gate editorial e importación

El contrato 1.2 añade el gate de confianza editorial:

- exige evidencias estables para cada dinámica y localizadores verificables;
- todo tema nuevo debe comenzar en `pending`;
- la transición de clase es `draft → review → published`;
- el dictamen registra administradora, fecha, notas, versión y digest;
- modificar o rechazar contenido invalida la aprobación anterior;
- la evidencia transcriptiva conserva audio y localizador, sin guardar ni
  mostrar el texto privado en la aplicación.

Los 57 paquetes C01–C57 tienen código, orden y fuentes portables. C01–C57 ya
usan 1.2: sus 139, 130, 133, 133, 137, 137, 138, 138, 140, 141, 139, 142, 144
y 138, 137, 142, 142, 142, 143, 148, 150, 152, 151, 150, 152, 150, 150, 149, 151, 151, 151, 151, 151, 151, 151, 151, 154, 155, 156, 155, 150, 153, 148, 154, 148, 150, 148, 150, 150, 151, 153, 150, 154, 149, 153, 149 y 149 artefactos quedaron enlazados a
12, 17, 12, 12, 14, 18, 10, 15, 13, 18, 21, 16, 12, 12, 12, 12, 15, 10, 18,
15, 18, 14, 16, 19, 19, 21, 15, 20, 15, 16, 15, 13, 13, 15, 14, 17, 13, 14, 16, 24, 16, 15, 12, 16, 9, 16, 12, 12, 10, 12, 10, 10, 16, 11, 18, 10 y 10 evidencias verificables, respectivamente, y pasan el gate
local sin importar contenido. El importador acepta
exclusivamente 1.2 y delega la escritura a
una única RPC transaccional que persiste el registro de
evidencias, journeys y vínculos editoriales; 1.0 y 1.1 fallan antes de llamar a
Supabase. La versión sustituida de C14 permanece en el archivo 1.0 no
importable.

La implementación pasó pruebas unitarias, TypeScript, lint y build. Las
migraciones locales (19, coincidentes con el remoto antes de `L-3`) se
aplicaron desde cero en PostgreSQL 17.6 y el runner dinámico comprobó
round-trip semántico, 2 evidencias, 118 artefactos, 236 vínculos, estados
`draft`/`pending`, rechazo de duplicados sin residuos y RPC denegadas a `anon`
y `authenticated`. Esa persistencia de 1.2 ya está aplicada en el proyecto
remoto y C01–C57 ya se importaron, revisaron y publicaron: verificado el 22 de
agosto de 2026 con 57 clases y 57 temas en estado `published`/`approved`.

### Controles editoriales concurrentes

La revisión de temas evita solicitudes duplicadas desde la interfaz: desactiva
aprobar y rechazar mientras hay un cambio pendiente, muestra el estado de la
operación y anuncia el resultado o error a tecnologías de asistencia. Las
Server Actions vuelven a validar rol, identificadores y estado, y no devuelven
detalles internos de Supabase.

La migración
`20260821021205_create_topic_with_next_position.sql` reemplaza el cálculo
separado de `count + 1` por una función transaccional. Un bloqueo asesor por
clase serializa únicamente las altas que compiten por la siguiente posición;
la función usa `security invoker` y solo concede ejecución a `service_role`.

**Estado remoto:** la migración está aplicada en CENEVAL y se verificó en su
historial. La comprobación estática local también forma parte de CI. La función
puede usarse en ese proyecto; una instalación nueva debe aplicar todas las
migraciones antes de habilitar la Server Action.

### Examen y retroalimentación

- La Server Action valida con Zod IDs enteros positivos y una forma estricta.
- Comprueba que el examen sea visible para la sesión autenticada.
- Rechaza preguntas ajenas, respuestas incompletas y opciones que no
  pertenecen a la pregunta o al examen entregado.
- La calificación sigue en servidor y `exam_answer_keys` permanece bloqueada
  por RLS para clientes autenticados.
- Al terminar, la interfaz muestra la explicación general y la explicación de
  la opción elegida.
- No se envían explicaciones de opciones no elegidas.
- Hay pruebas locales para selección cruzada, forma inválida y exposición
  mínima de retroalimentación.
- `/progreso/examenes` lista únicamente los intentos de la sesión autenticada,
  con paginación por cursor, fecha, puntuación y etiquetas de examen vigente o
  histórico. Los intentos anteriores no se sobrescriben.
- El detalle recupera las respuestas mediante RLS y muestra solo la opción
  elegida y si fue correcta; no consulta ni expone `exam_answer_keys` u otras
  opciones. Los exámenes vigentes enlazan de vuelta al tema para repetirlos.

### Repaso y progreso

- `/estudiar/repaso` usa `next_review_at` para construir la cola vencida.
- La prioridad considera dificultad y antigüedad.
- `getReviewOverview` obtiene el resumen mediante una sola RPC `security
  invoker`, en una llamada y una ola. La identidad procede de `auth.uid()` y
  nunca se acepta como parámetro; la función entrega una sola fila JSON y no
  transfiere el historial completo a Node.
- Los contadores usan únicamente la revisión más reciente de cada tarjeta y la
  comprobación más reciente de cada tema; ya no crecen indefinidamente por el
  historial acumulado.
- Los empates se resuelven de forma determinista por fecha y después por ID;
  solo cuentan temas aprobados de clases publicadas y actividad propia. La
  respuesta no trunca las tarjetas vencidas: si una medición real muestra un
  payload excesivo, el siguiente hito será paginar la experiencia de repaso,
  no ocultar pendientes.
- Una cola vacía informa cuándo será el próximo repaso, si existe fecha.
- `getStudyProgress` filtra por `topic_id` y por el `user_id` autenticado.
- `/progreso` compara por materia temas con actividad y temas con sus cinco
  pasos completos contra el total aprobado de clases publicadas.
- La misma vista separa evidencia verificable: aciertos sobre preguntas en
  intentos finalizados del examen vigente y la última autoevaluación de cada
  tema comprobado. No convierte la señal `needs_review` en una calificación.
- Las cuatro consultas se ejecutan en paralelo, filtran por el `user_id` de la
  sesión cuando leen actividad y encadenan el contenido a clases publicadas.

### Acciones de estudio y RLS

Las acciones de revisión, progreso y comprobación rápida:

- validan la entrada con esquemas estrictos;
- derivan `user_id` de la sesión;
- resuelven primero el recurso con el cliente autenticado sujeto a RLS;
- solo escriben si la cadena termina en una clase publicada;
- devuelven mensajes que no permiten enumerar borradores o IDs inexistentes.

La migración
`20260821021203_restrict_learning_activity_to_published_content.sql` añade la
misma condición a la Data API para `flashcard_reviews`, `study_progress` y
`quick_check_responses`. La migración es transaccional y su estructura se
comprueba localmente en CI.

**Estado de despliegue de esa migración:** aplicada en CENEVAL y verificada en
el historial el 20 de agosto de 2026. Aún no existe una ejecución posterior de
las 31 comprobaciones actuales; la última ejecución dinámica documentada sigue
siendo la suite anterior de 20 comprobaciones, aprobada el 29 de julio de 2026.

### Lectura limitada a temas aprobados

La migración
`20260821023330_restrict_reading_to_approved_topics.sql` corrige una separación
incompleta entre publicación de clase y aprobación de tema. Para estudiantes,
un tema ahora debe estar `approved` y pertenecer a una clase `published`. La
misma cadena protege materiales, mapas, referencias, flashcards, exámenes,
preguntas y opciones. `private.is_admin()` conserva la visibilidad editorial.

Como defensa adicional, `getTopic` filtra explícitamente por aprobación y
`getLessonBundle` rechaza cualquier tema que no esté aprobado. La prueba
`test:topic-approval-policies` verifica localmente la migración y ambos filtros
sin conectarse a Supabase.

**Estado remoto:** esta undécima migración se aplicó en CENEVAL y se verificó
en el historial el 20 de agosto de 2026. La revisión de solo lectura del 21 de
agosto (hora de México) mantuvo el `INFO` esperado de `exam_answer_keys` sin
políticas —bloqueo deliberado— y encontró un `WARN` porque la protección contra
contraseñas filtradas está desactivada. Antes de abrir el acceso estudiantil, una persona
autorizada debe habilitar esa protección y ejecutar la suite RLS dinámica con
temas pendientes y rechazados, primero en un proyecto de ensayo.

**Estado local posterior:** PostgreSQL 17.6 aplica dieciocho migraciones desde
cero. `npm run security:rls:local` ejecuta 141 comprobaciones sobre contenido
sintético y verifica RPC, ownership, tablas trazables, temas `pending` y
`rejected`, claves de examen y limpieza sin residuos. El ensayo detectó y
corrigió que la actividad debía exigir tema aprobado y una recursión entre
políticas de evidencia. Estas correcciones aún no están en CENEVAL remoto.

El 21 de agosto de 2026 se repitió el gate con Supabase CLI 2.115.0 y Docker
29.6.1: las 141 comprobaciones RLS pasaron con limpieza final en cero;
`test:content-db-local` conservó 2 evidencias y 236 vínculos en el round-trip,
rechazó el segundo import duplicado y no dejó residuos; y los asesores locales
reportaron cero problemas de rendimiento. El único aviso de seguridad fue el
`INFO` esperado de `exam_answer_keys` sin políticas, cuyo bloqueo deliberado
también cubre la suite. Estos resultados son exclusivamente locales y no
sustituyen el gate pendiente en un proyecto remoto de ensayo.

Ese mismo entorno aplicó la migración 18 del resumen de repaso y ejecutó una
prueba específica con dos estudiantes, una administradora y más de 500 eventos
históricos. La RPC devolvió una sola fila, respetó el último evento por fecha e
ID, calculó vencimiento, dificultad y próxima fecha, ocultó temas y clases no
publicables, denegó ejecución a `anon` y `service_role` y terminó con cero
residuos. El lint de base quedó en cero advertencias y la suite RLS conservó
141/141 comprobaciones. Es evidencia exclusivamente local.

---

## 8. Seguridad y calidad: qué está probado

`npm run test:local` reúne pruebas sin Supabase ni disco `F:` para:

- entrega y calificación segura del examen;
- derivación, paginación y enlaces seguros del historial de intentos;
- cálculo de repaso espaciado;
- derivación de progreso por materia y ausencia explícita de desempeño cuando
  no existen intentos válidos;
- esquema del paquete académico;
- honestidad del progreso, autosave, onboarding y semántica accesible;
- redirecciones permitidas en confirmación de autenticación;
- validación y mensajes del inicio de sesión;
- cabeceras de seguridad;
- entrada de acciones de estudio;
- estructura esperada de las políticas RLS nuevas;
- bloqueo de lectura de temas no aprobados y sus descendientes en RLS y DAL;
- integridad del procedimiento de respaldo con datos sintéticos.

También existen cabeceras de seguridad, redirección de autenticación limitada
a destinos internos y un aviso educativo/de vigencia en la interfaz.

Con Supabase local activo, `npm run test:content-db-local` prueba el round-trip
1.2 y `npm run test:e2e:local` prepara usuarios y contenido sintéticos, compila
y levanta la app en un puerto loopback dedicado. El 21 de agosto el E2E recorrió
en Chromium el acceso privado, skip-link, navegación por teclado, autosave,
diez tarjetas, examen de diez reactivos, resultado, historial, panel editorial
de solo lectura y cuatro rutas inválidas. También pasó en un viewport móvil
táctil de 320 px, comprobó targets de 24 px, movimiento reducido computado y
un proxy de reflow para zoom de 200%, con cero errores de consola, página, HTTP
5xx o red no permitidos y limpieza final en cero. La evidencia y sus límites
están en `docs/ACCESSIBILITY_TESTING.md`: todavía no sustituye pruebas manuales
con lectores de pantalla ni zoom real. Ese mismo día
`test:backup-restore:local` volvió a completar en PostgreSQL 17 el respaldo,
restauración y round-trip sin artefactos residuales. Los runners rechazan URLs
no locales; ninguna de estas pruebas escribió en CENEVAL remoto.

Queda pendiente:

- crear un proyecto de ensayo aparte de producción, aplicar allí las 20
  migraciones desde cero y repetir la suite RLS con datos sintéticos (tarea
  `M-1`); las 20 migraciones ya están aplicadas en CENEVAL, pero ese ensayo
  con datos no reales sigue sin hacerse;
- mantener `npm run db:lint:local` sin advertencias; la migración nueva ya
  eliminó los doce avisos de `private.import_class_package_v12` y el reset,
  lint, round-trip RPC y RLS local volvieron a pasar;
- ejecutar y registrar la matriz manual de accesibilidad con lectores de
  pantalla, zoom real, contraste alto y dispositivos físicos;
- dejar de degradar silenciosamente ciertos errores de progreso a `null`.

---

## 9. Contenido terminado y pendiente

El inventario editorial registra contenido preparado para C01–C57: cada clase
tiene transcripción conservada, versión depurada, nueve materiales, mapa,
flashcards, diez reactivos y fuentes. C01–C57 pasan el gate local 1.2 y **ya
están importados, revisados y publicados** en el proyecto remoto (verificado
el 22 de agosto de 2026: 57 clases publicadas, 57 temas aprobados).

La decisión de minimización ya está implementada localmente. El cargador lee
los TXT privados y valida el paquete editorial completo; antes de invocar la
RPC proyecta el contrato 1.2 sin la clave `transcript`. Supabase conserva las
dinámicas, el registro de evidencia y sus localizadores, pero no el texto
original ni el depurado. La exportación reconstruye esa misma proyección y el
round-trip comprueba que no se pierdan artefactos, vínculos o recorrido. La
interfaz administrativa ya no ofrece captura o lectura de transcripciones. La
migración de minimización (`20260822034153_minimize_transcript_storage.sql`)
ya está aplicada en el proyecto remoto junto con el resto; la importación de
C01–C57 se completó con esa protección activa.

Orden de producción restante:

| Orden | Clase | Fuente principal |
| ---: | --- | --- |
| 1 | C58 Administración, partición y adjudicación | Bloqueada hasta recibir una nueva transcripción suficiente |

Además siguen pendientes tres bancos transversales y 16 exámenes acumulativos.

---

## 10. Plan de trabajo técnico y de contenido

El plan detallado para poder cobrar, con sus bloqueos y evidencias de cierre,
está en los §3 a §5; lo que sigue aquí es el plan de trabajo técnico y de
contenido, complementario.

### Prioridad 0 — Proteger y comprobar

1. Crear una segunda copia independiente de las 70 transcripciones y verificarla
   contra el manifiesto privado; la primera copia ya fue comprobada el 21 de
   agosto de 2026 sin diferencias.
2. Seguir `docs/SUPABASE_BACKUP.md`: generar una exportación autorizada,
   verificarla, copiarla fuera del equipo y restaurarla en un proyecto de ensayo.
3. Ampliar y ejecutar `npm run security:rls` en el proyecto CENEVAL y
   registrar el resultado. Esta suite crea y elimina datos remotos; no
   pertenece a CI.
4. Crear un proyecto de ensayo Supabase aparte de producción, aplicar las 20
   migraciones desde cero y repetir allí la suite RLS con datos sintéticos
   (tarea `M-1`). La persistencia 1.2 y C01–C57 ya están aplicados y
   publicados directamente en el proyecto de producción; este ensayo separado
   con datos que no sean reales sigue pendiente.

### Prioridad 1 — Cerrar el pipeline con C01–C57

1. Mantener los localizadores reales y paquetes C01–C57 en contrato 1.2.
2. Verificar por round-trip dinámico que el registro de evidencias persiste sin
   pérdidas.
3. Revisar vigencia jurídica y conteos editoriales.
4. Publicar solo después de la revisión autorizada.
5. Comprobar localmente el recorrido borrador, revisión, aprobación y publicación.

### Prioridad 2 — Desbloquear C58

Obtener una nueva transcripción académica íntegra sobre administración y
cuentas, partición, oposición y adjudicación hereditaria. No crear un paquete
solo con legislación; repetir después el pipeline 1.2 completo descrito en
`C58_SOURCE_AUDIT.md`.

### Prioridad 3 — Calidad de producto

1. Automatizar inicio de sesión, biblioteca, clase, repaso, examen y progreso
   en un navegador real.
2. Probar URLs inválidas, estados vacíos, errores y recuperación.
3. Auditar teclado, lector de pantalla, contraste y uso móvil.
4. Medir la aplicación con 58 clases.

### Prioridad 4 — Despliegue y operación

1. Persistir y verificar las variables de Vercel sin exponer secretos.
2. Configurar las redirecciones de Supabase Auth y probar contra el artefacto
   publicado la cuenta administradora ya creada, su inicio de sesión y acceso
   privado.
3. Probar login y rutas privadas desde teléfono y computadora, y revisar logs.
4. Ejecutar y aprobar el runbook en la siguiente publicación. Vercel ya está
   conectado a Git y el deploy manual por CLI ya se probó dos veces con éxito;
   falta ejecutar el runbook completo sobre ese flujo.
5. Añadir monitoreo continuo; el runbook actual solo cubre observación manual
   en Hobby, respaldo y restauración.
6. Proveedor, planes/precio, prueba, cancelación y reembolsos ya están
   decididos (§4); sigue pendiente cerrar el régimen fiscal por escrito y el
   soporte antes de implementar registro o pagos.
7. Seguir los gates incrementales de `SUBSCRIPTION_ARCHITECTURE.md`: dominio y
   autorización sin cobro, sandbox cerrado, piloto privado y solo después
   apertura comercial explícita.
8. Capturar la línea base de datos definida en `DATA_ARCHITECTURE.md` antes de
   añadir caché, réplicas, búsqueda semántica u otro motor.

---

## 11. Próximas tareas ejecutables

| # | Tarea | Evidencia para cerrarla |
| ---: | --- | --- |
| 1 | Completar el respaldo de transcripciones | Segunda copia independiente y restauración de ensayo |
| 2 | Ejecutar y probar el respaldo documentado | Exportación fechada, copia externa verificada y restauración de ensayo |
| 3 | Ampliar y ejecutar la suite RLS | Comprobaciones actuales y casos de temas no aprobados aprobados en CENEVAL |
| 4 | Crear un proyecto de ensayo Supabase aparte de producción para repetir la suite RLS con datos que no sean reales | Proyecto de ensayo con las 20 migraciones aplicadas y RLS aprobada (tarea `M-1`) |
| 5 | Aprobar C01–C57 — completado | 57 clases publicadas y 57 temas aprobados, verificado el 22 de agosto de 2026 en el proyecto remoto |
| 6 | Crear pruebas de navegador | Flujos centrales reproducibles en CI o entorno aislado |
| 7 | Completar y validar el despliegue privado | Variables persistentes, administradora operativa y URL estable aprobada desde teléfono y computadora |
| 8 | Cerrar los bloqueos de venta (infraestructura apta para cobrar, respaldo real) | Fases 2 y 3 (§5) con evidencia de cierre |

---

## 12. Decisiones de producto abiertas

1. Definir responsables y periodicidad de la revisión jurídica trazable.
2. Confirmar si el estándar definitivo es de tres o cuatro opciones por reactivo.
3. Decidir el alcance de los 16 exámenes acumulativos (tarea `P-6`).
4. Definir responsables del repositorio, Supabase, respaldo y despliegue
   (resuelto para titularidad de cuentas en `D-8`, §4; falta el resto).
5. Confirmación fiscal por escrito del contador (`D-7`) y búsqueda formal de
   marca en el IMPI (`D-9`) — únicas piezas de Fase 0 que siguen abiertas;
   producto, precio, proveedor, nombre comercial, prueba, cancelación y
   reembolsos ya están decididos (§4).

---

## 13. Definición de terminado

El proyecto estará terminado cuando existan 58 clases publicadas y navegables,
los bancos y exámenes acumulativos acordados, protección RLS verificada en
remoto, pruebas automáticas de los flujos centrales, experiencia accesible en
teléfono y computadora, despliegue estable, respaldo restaurable y manual de
operación aprobado por Fatima. Para ofrecerla comercialmente, además deberán
estar aprobados e implementados el modelo de suscripción, el control de acceso
correspondiente y sus recorridos de alta, cobro, cancelación y soporte.

---

## 14. Siguiente acción inmediata

Con C01–C57 publicadas y la Fase 0, Fase 1 y Fase 5 del plan de venta ya
cerradas y publicadas, la siguiente acción es proteger lo que ya existe y
avanzar la infraestructura y el respaldo, no producir más contenido ni tomar
más decisiones de producto:

1. crear una segunda copia independiente del archivo editorial y ensayar su restauración;
2. ejecutar y completar el procedimiento de `docs/SUPABASE_BACKUP.md`;
3. crear un proyecto de ensayo aparte de producción para repetir el gate RLS
   dinámico con datos sintéticos (tarea `M-1`); las migraciones y el
   contenido C01–C57 ya se aplicaron y publicaron directamente en CENEVAL,
   sin pasar primero por ese ensayo;
4. solicitar la nueva transcripción definida en `C58_SOURCE_AUDIT.md`; C58 no
   puede producirse honestamente con el corpus actual;
5. avanzar las Fases 2 y 3 (§5): infraestructura apta para cobrar y respaldo
   real. La Fase 0 (decisiones) y la Fase 1 (legal) ya cerraron — ver §4 y §5.
