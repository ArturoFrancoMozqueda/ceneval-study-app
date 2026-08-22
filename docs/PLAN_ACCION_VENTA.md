# Plan de acción para vender — CENEVAL Study App

**Fecha:** 22 de agosto de 2026
**Base verificada:** `main` en `9c74f58`, proyecto Supabase `CENEVAL Study App`
(`qcseoivljzuxzqeaxfly`) y proyecto Vercel `ceneval-study-app` (team `kova-mx`),
todos consultados en modo lectura el 22 de agosto de 2026.

Este documento responde a una sola pregunta: **qué falta para poder cobrar por
la aplicación.** No autoriza abrir el registro, contratar planes ni cobrar.

> **Aviso sobre la documentación previa.** `docs/PROJECT_STATUS.md` (21 de
> agosto) afirma que Supabase tiene 0 materias y 0 clases y que Vercel no está
> conectado a Git. **Las dos afirmaciones ya no son ciertas.** Ese documento
> debe conciliarse (tarea `OP-6`) antes de tomar decisiones con él.

> **Actualización del 22 de agosto de 2026 (tarde).** Fase 0 completa: ver
> [`docs/D1_DERECHOS_AUDIOS.md`](D1_DERECHOS_AUDIOS.md) y
> [`docs/PLAN_VENTA_DECISIONES.md`](PLAN_VENTA_DECISIONES.md) (D-1 a D-9
> cerradas: nombre comercial "Sube Legal", $399 MXN/mes, Stripe/México,
> niveles + protección de contenido). `OP-6` ya se ejecutó. Se implementaron
> L-1 a L-6 (Fase 1) y P-1 a P-4 (Fase 5), se unificó la marca "Sube Legal"
> en `app/layout.tsx` y en las pantallas de inicio de sesión/registro, y se
> corrigió que `/terminos` y `/privacidad` quedaran envueltas en
> `MarketingShell` (antes una visitante anónima que llegaba ahí caía en la
> barra lateral de la app autenticada). Se aplicó la migración de `L-3`
> (`terms_accepted_at`) al proyecto remoto — ver §3 más abajo, ahora son
> **20 migraciones**, no 19. **Todo esto ya está fusionado en `main` y
> desplegado en producción** (push directo, sin PR, igual que el resto del
> historial del repositorio). Nada de esto abre el registro, activa cobro
> real ni cambia `PRIVATE_ACCESS_ONLY`.

---

## 1. Estado real verificado hoy

### Lo que sí existe y funciona

| Área | Estado comprobado el 22 de agosto de 2026 |
| --- | --- |
| Despliegue | Vercel **conectado a Git**. El último deployment es `READY`, target `production`, y corresponde al commit actual de `main` (`9c74f58`). |
| Salud | `GET /api/health/live` responde `200`. `GET /api/health/ready` responde `404` sin token, que es el comportamiento correcto. |
| Base de datos | Las **20 migraciones** del repositorio están aplicadas en el proyecto remoto (19 verificadas el 22 de agosto por la mañana + `20260822160822_add_profiles_terms_accepted_at` de la tarea `L-3`, aplicada esa misma tarde). Coinciden una a una con `supabase/migrations/`. |
| Contenido publicado | **24 materias, 57 clases (todas `published`), 57 temas (todos `approved`), 513 materiales, 57 mapas conceptuales, 685 flashcards, 57 exámenes, 570 preguntas y 570 claves de respuesta.** |
| Seguridad de base | Los asesores de Supabase solo reportan el `INFO` esperado de `exam_answer_keys` sin políticas (bloqueo deliberado) y un `WARN` de contraseñas filtradas. Sin errores. |
| Código | `npm run lint` pasa sin hallazgos. El build de producción del mismo commit se completó en Vercel. |
| Usuarios | **1 usuario, 1 perfil administrador, 0 intentos de examen.** |

En términos simples: **el producto ya está construido, desplegado y con su
catálogo cargado.** Lo que falta no es programar más funciones de estudio; es
todo lo que rodea a un cobro.

### Lo que no existe

- No hay pagos, planes, precios, entitlements, checkout ni webhook.
- No hay registro abierto: `PRIVATE_ACCESS_ONLY` es obligatorio en `true` y
  `lib/operations/runtime-env.ts:91` **falla el arranque** si vale otra cosa.
- No hay aviso de privacidad, términos de uso, política de cancelación ni de
  reembolso.
- No hay página pública de presentación ni de precios: la raíz del sitio lleva
  directo a la app autenticada.
- No hay dominio propio: solo `ceneval-study-app.vercel.app`.
- No hay respaldo real de la base remota, ni copia externa, ni restauración
  ensayada.
- No hay monitoreo, alertas, registro de errores ni canal de soporte.
- **No existe ningún documento que registre los derechos sobre las 70
  grabaciones que originaron el contenido.**

---

## 2. Los cinco bloqueos que impiden cobrar

Ninguno se resuelve con código. Están ordenados por gravedad.

### B1 — Derechos sobre los audios de origen · **crítico**

Las evidencias del repositorio (exámenes parciales numerados, promociones de
una plataforma anterior, referencias sistemáticas a "el docente", limpieza de
la marca de TurboScribe) indican que las 70 transcripciones provienen de **un
curso comercial ajeno grabado**. La auditoría de producto lo documentó en
`docs/auditoria-2026-08/03-producto.md` §3.1 y hoy confirmé que **no hay ningún
documento de licencia, autorización, cesión o consentimiento** en todo el
repositorio.

Mientras la app es privada y de uso personal, el riesgo práctico es bajo. **En
el momento en que se cobra, deja de ser uso personal y pasa a ser explotación
comercial de contenido derivado de obra ajena, compitiendo con el curso
original.** En México eso se rige por la Ley Federal del Derecho de Autor.

Hay tres salidas y hay que elegir una **antes** de invertir en pagos:

- **(a)** Permiso escrito del titular de las grabaciones, con alcance comercial.
- **(b)** Rehacer el temario de modo que la secuencia y el contenido provengan
  solo de fuentes oficiales, sin la estructura del curso grabado.
- **(c)** No vender y mantener la app privada.

Cada camino cambia por completo el resto del plan. **Esta es la primera
decisión, no la última.**

### B2 — Los planes contratados prohíben o impiden vender · **crítico**

- **Vercel Hobby** no permite uso comercial. Cobrar sobre Hobby es una
  violación de sus términos y expone a la suspensión del proyecto.
- **La organización de Supabase está en plan `free`.** El plan gratuito no
  incluye respaldos automáticos diarios ni recuperación a un punto en el
  tiempo. Cobrar por acceso a datos que no tienen respaldo gestionado es un
  riesgo operativo que no se debe asumir.

### B3 — Sin marco legal de cara a la usuaria · **crítico**

Al entrar la primera estudiante de pago, la app guarda correo, nombre,
contraseña, progreso por tema, intentos y cada respuesta individual, en
proveedores fuera de México. Eso exige aviso de privacidad conforme a la
LFPDPPP con derechos ARCO y transferencia internacional, términos de uso,
política de cancelación y reembolso, y datos fiscales. Nada de eso existe.

### B4 — Sin correo transaccional propio · **alto**

El registro, la confirmación de cuenta y la recuperación de contraseña dependen
del correo. El servicio de correo por defecto de Supabase está limitado a unos
pocos envíos por hora y es solo para desarrollo. Con registro abierto, las
altas fallarían silenciosamente.

### B5 — La aplicación nunca ha sido usada por dos personas a la vez · **alto**

Hay 1 usuario y 0 intentos de examen en producción. Las 141 comprobaciones RLS
y el E2E se ejecutaron **en local**, no contra el proyecto remoto. El
aislamiento entre estudiantes está diseñado y probado localmente, pero no
demostrado en el entorno real.

---

## 3. Plan de acción

Cada tarea tiene una evidencia de cierre. Sin esa evidencia, la tarea no está
hecha.

### Fase 0 — Decisiones que bloquean todo lo demás

| ID | Tarea | Evidencia de cierre |
| --- | --- | --- |
| D-1 | Resolver B1: elegir camino (a), (b) o (c) sobre los derechos de los audios y dejarlo por escrito con fecha y firma. | Documento en `docs/` con la decisión, y si es (a), el permiso escrito del titular con alcance comercial. |
| D-2 | Definir el producto comercial: qué se vende (biblioteca completa), a quién, y si hay uno o varios planes. | Una página en `docs/` con producto, plan(es) y alcance. |
| D-3 | Fijar precio, moneda y periodicidad. | Precio escrito y aprobado. |
| D-4 | Decidir si habrá periodo de prueba y con qué duración y condiciones. | Decisión escrita, o "no habrá prueba". |
| D-5 | Decidir la política de cancelación (inmediata o a fin de periodo) y de reembolso. | Ambas políticas escritas. |
| D-6 | Elegir proveedor de pagos y país de la cuenta contractual. | Proveedor elegido y cuenta abierta a nombre de quien corresponda. |
| D-7 | Resolver el régimen fiscal: IVA, emisión de comprobantes o CFDI, y quién los emite. | Confirmación del contador o asesor fiscal por escrito. |
| D-8 | Registrar por escrito quién es titular de las cuentas de GitHub, Vercel, Supabase y del proveedor de pagos, dónde viven las claves y quién es el contacto de recuperación. | Documento en `docs/` con el inventario de titularidad, sin secretos. |
| D-9 | Definir el nombre comercial y verificar que no invade la marca CENEVAL, incluyendo un aviso visible de no afiliación. | Nombre elegido y búsqueda de marca documentada. |

> Hasta cerrar **D-1**, no conviene gastar dinero ni horas en las fases
> siguientes: si la respuesta es (b) o (c), el trabajo de pagos se pierde.

### Fase 1 — Marco legal y de cumplimiento

| ID | Tarea | Evidencia de cierre |
| --- | --- | --- |
| L-1 | Redactar y publicar el **aviso de privacidad** LFPDPPP: datos recabados, finalidades, transferencia internacional (Supabase y Vercel fuera de México), plazo de conservación y ejercicio de derechos ARCO con un correo de contacto real. | Ruta `/privacidad` publicada y enlazada desde el pie y desde el registro. **✅ Publicado en producción (22 ago).** Correo `privacidad@sube-legal.mx` sigue siendo provisional hasta tener dominio propio (`I-3`). |
| L-2 | Redactar y publicar los **términos de uso**, incluyendo cancelación, reembolso, uso permitido y limitación de responsabilidad. | Ruta `/terminos` publicada y enlazada. **✅ Publicado en producción (22 ago).** |
| L-3 | Añadir en el registro una casilla explícita de aceptación de términos y aviso de privacidad, y guardar la fecha de aceptación. | Casilla en `/registro` y columna con la fecha en base de datos. **✅ Hecho (22 ago).** Columna `profiles.terms_accepted_at` aplicada al proyecto remoto (migración `20260822160822_add_profiles_terms_accepted_at`). |
| L-4 | Implementar **borrado de cuenta y exportación de datos personales** a solicitud de la usuaria. | Flujo probado de principio a fin con una cuenta de prueba. **✅ Publicado en producción (22 ago)**, `/cuenta`. Falta la prueba de extremo a extremo con una cuenta real. |
| L-5 | Añadir el aviso de no afiliación con CENEVAL en un lugar visible. | Texto visible en la app y en la página pública. **✅ Hecho (22 ago).** |
| L-6 | Definir el canal de soporte y el compromiso de tiempo de respuesta. | Correo o formulario publicado y quién lo atiende. **✅ Publicado en producción (22 ago).** Correo `soporte@sube-legal.mx` provisional hasta tener dominio propio (`I-3`); falta definir quién lo atiende. |

> El aviso educativo de "no constituye asesoría jurídica" **ya está en la
> aplicación**; se comprobó en el sitio publicado. No hay que rehacerlo.

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
| P-1 | Construir una **página pública** en la raíz: qué es, para quién, qué incluye (57 clases, 685 flashcards, 570 reactivos), y llamada a la acción. Hoy la raíz lleva directo a la app autenticada. | Página publicada y visible sin sesión. **✅ Publicado en producción (22 ago).** `app/page.tsx` muestra la landing a visitantes anónimos. |
| P-2 | Construir la **página de precios** con el plan aprobado en D-3. | Página publicada, con enlace a términos y privacidad. **✅ Publicado en producción (22 ago)**, `/precios`. Botón de suscripción deshabilitado a propósito (sin checkout real). |
| P-3 | Preparar una vista de muestra gratuita: una clase o un examen accesible sin pagar, para que la persona pueda evaluar antes de comprar. | Ruta de muestra publicada. **✅ Publicado en producción (22 ago)**, `/muestra` (C01, sin examen). |
| P-4 | Escribir el texto de venta y las preguntas frecuentes, incluyendo qué **no** incluye el producto. | Contenido publicado. **✅ Publicado en producción (22 ago)**, `/preguntas-frecuentes`. |
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
| OP-6 | Conciliar `docs/PROJECT_STATUS.md`, `AGENTS.md` y `ROADMAP_TRACKING.md` con el estado real verificado hoy. | Los tres documentos coinciden con el remoto. |

---

## 4. Ruta crítica sugerida

```text
D-1 (derechos)  ──►  si es (a) o (b) continúa; si es (c) el plan termina aquí
      │
      ▼
D-2 … D-9 (producto, precio, proveedor, fiscal, titularidad)
      │
      ├──►  L-1 … L-6   (legal)        ─┐
      ├──►  I-1 … I-7   (infra)         ├──►  M-1 … M-6  ──►  P-1 … P-6
      └──►  R-1 … R-5   (respaldo)     ─┘                          │
                                                                   ▼
                                                        S-1 … S-7 (suscripción)
                                                                   │
                                                                   ▼
                                                        OP-1 … OP-6 (operación)
```

Las fases 1, 2 y 3 pueden avanzar en paralelo entre sí. La fase 6 no debe
empezar antes de cerrar la 1, la 2 y la 3, porque la arquitectura de
suscripciones lo exige explícitamente en su Etapa 0.

---

## 5. Qué no hacer todavía

Copiado del §16 de `docs/SUBSCRIPTION_ARCHITECTURE.md`, sigue vigente:

- No cambiar `PRIVATE_ACCESS_ONLY` para abrir el registro.
- No habilitar checkout, portal ni webhook de producción.
- No crear productos, precios ni pruebas reales sin decisión aprobada.
- No aceptar datos de tarjeta dentro de la aplicación.
- No conceder acceso desde la URL de éxito ni desde parámetros del navegador.
- No cobrar antes de tener respaldo restaurable, RLS verificada en remoto,
  políticas legales y fiscales, y soporte.
- No borrar el progreso académico al cancelar o reembolsar.

Y uno propio de este plan:

- **No invertir en la Fase 6 antes de cerrar D-1.**

---

## 6. Lectura honesta del estado

La parte difícil de construir ya está construida y desplegada: el catálogo
completo está publicado, la seguridad de base está en su sitio, el despliegue
es automático desde Git y el código pasa sus controles.

Lo que separa a esta aplicación de poder venderse **no es técnico**: son
derechos de contenido, decisiones comerciales, documentos legales, dos planes
de pago y un respaldo real. La única tarea de este plan que puede invalidar a
todas las demás es `D-1`. Conviene resolverla antes que cualquier otra.
