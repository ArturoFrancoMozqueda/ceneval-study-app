# Arquitectura objetivo de suscripciones

**Estado:** diseño técnico futuro; no implementado

**Fecha:** 20 de agosto de 2026

**Base auditada:** `origin/main` en `3a1fe92`

Este documento define cómo incorporar suscripciones sin confundir el objetivo
comercial con el estado actual. Stripe y $399 MXN/mes ya fueron decididos
después de la auditoría base; este diseño no abre el registro ni autoriza cobros.

## 1. Estado actual comprobado

Hoy la aplicación:

- tiene un despliegue técnico en Vercel Hobby conectado a Git, todavía no apto
  para operación comercial;
- usa acceso por invitación y mantiene desactivadas las altas públicas;
- admite los roles `admin` y `student` en `profiles`; ambos pueden entrar,
  pero solo `admin` tiene capacidades editoriales;
- autentica con Supabase Auth y cookies de servidor;
- usa `requireUser` para identidad y `requireAdmin` para capacidades
  editoriales;
- aplica RLS a la biblioteca y a la actividad privada por `user_id`;
- no tiene tablas de clientes, suscripciones, derechos de acceso, eventos de
  facturación ni conciliación;
- tiene proveedor, producto, precio y política comercial decididos, pero no
  checkout ni infraestructura de facturación; el régimen fiscal sigue abierto.

El procedimiento de respaldo existe, pero todavía no hay una exportación real
ni una restauración de ensayo desde producción. Las migraciones RLS están
aplicadas en el proyecto remoto. Estos bloqueos son puertas
de entrada para el roadmap, no detalles opcionales.

## 2. Principios obligatorios

1. **Autenticación, rol y derecho son conceptos distintos.** La sesión dice
   quién es la persona; el rol permite tareas editoriales; el entitlement
   determina si puede consumir un producto.
2. **Denegar por defecto.** Estado ausente, desconocido, vencido, inconsistente
   o imposible de comprobar significa que no se concede acceso comercial.
3. **El servidor decide.** El navegador no interpreta estados del proveedor,
   importes, periodos ni permisos.
4. **El webhook no confía en el JSON por sí solo.** Primero valida firma sobre
   el cuerpo original; después valida esquema y tipo de evento.
5. **Repetir debe ser seguro.** Reintentos, duplicados y eventos fuera de orden
   no pueden conceder acceso dos veces ni hacer retroceder un estado nuevo.
6. **La base local conserva el estado operativo mínimo.** El proveedor es la
   fuente financiera; Postgres mantiene una proyección verificable para
   autorizar sin llamar al proveedor en cada solicitud.
7. **Mínimos datos.** La aplicación no guardará tarjeta, CVC ni payloads
   completos indefinidamente. Solo conservará referencias opacas y datos
   necesarios para acceso, soporte y auditoría.
8. **RLS sigue siendo defensa en profundidad.** Los controles de Next.js no
   sustituyen las políticas de base de datos.
9. **La arquitectura sigue siendo monolítica.** Next.js y Supabase son
   suficientes para la primera integración. Una cola se añadirá únicamente si
   mediciones reales muestran que el procesamiento síncrono seguro no basta.

## 3. Separación entre roles y entitlements

### Roles

`profiles.role` conserva exclusivamente capacidades internas:

| Rol | Capacidades objetivo |
| --- | --- |
| `admin` | Importar, revisar, publicar, retirar y diagnosticar contenido. |
| `student` | Usar funciones de estudio permitidas por su entitlement. |

Ser `admin` no significa haber pagado. Para que la administradora pruebe la
experiencia de estudio, recibirá un entitlement operativo explícito y
auditable; no se esconderá un bypass comercial dentro del rol.

### Entitlements

Un entitlement responde a una sola pregunta: “¿esta identidad puede consumir
este producto durante este intervalo?”. El primer producto conceptual puede
identificarse con una clave interna estable, por ejemplo
`ceneval_derecho_library`; el nombre definitivo sigue abierto.

Fuentes posibles, todas explícitas:

- `subscription`: derivado de una suscripción confirmada;
- `trial`: únicamente si se aprueba una política de prueba;
- `operations`: acceso de administración o soporte;
- `manual`: solo si se aprueba acceso de cortesía y con motivo, responsable y
  vencimiento.

No se guardarán entitlements en `raw_user_meta_data`, porque la persona puede
editarlo, ni se dependerá exclusivamente de claims del JWT, porque pueden
quedar desactualizados hasta que se renueve la sesión.

## 4. Estados conceptuales y regla de acceso

Los proveedores usan vocabularios distintos. La integración deberá traducir
sus eventos a un conjunto interno pequeño y conservar el estado original para
soporte. Estos estados describen facturación, no conceden acceso por sí solos:

| Estado normalizado | Significado | Acceso por defecto |
| --- | --- | --- |
| `pending` | Alta iniciada, sin confirmación autoritativa. | Denegado. |
| `trialing` | Prueba vigente, solo si existe política aprobada. | Denegado hasta materializar un entitlement de prueba válido. |
| `active` | Periodo vigente confirmado por el proveedor. | Permitido mediante entitlement vigente. |
| `past_due` | Cobro vencido o fallido que requiere recuperación. | Denegado; una gracia requeriría política explícita y un `valid_until`. |
| `paused` | Suscripción pausada. | Denegado. |
| `canceled` | Relación terminada. | Denegado cuando ya terminó el entitlement. |
| `expired` | Periodo o prueba concluidos. | Denegado. |

`cancel_at_period_end` será un indicador aparte. Una suscripción puede seguir
`active` hasta el final del periodo ya cubierto y tener cancelación programada.
Si ese tratamiento se aprueba, el entitlement tendrá `valid_until` igual al
fin confirmado del periodo. La cancelación inmediata revocará o acortará ese
intervalo.

Un reembolso no es un estado de suscripción. Es un movimiento financiero que
debe quedar registrado y reconciliado. La futura política decidirá si un
reembolso total o parcial cambia el entitlement; mientras no exista esa
decisión, ningún evento desconocido ampliará acceso.

## 5. Modelo de datos conceptual

Los nombres son una propuesta para una migración futura, no tablas autorizadas.

### `private.billing_customers`

- `id` interno;
- `user_id` con referencia a `auth.users(id)`;
- `provider_key` y `environment`;
- `provider_customer_id`, opaco y único por proveedor/entorno;
- marcas de creación y actualización.

No duplicará correo, nombre, domicilio o datos fiscales salvo obligación
documentada. Si el soporte necesita mostrar algo, se resolverá bajo permisos
administrativos y retención definida.

### `private.subscription_records`

- referencia a `billing_customers`;
- `provider_subscription_id`, opaco y único por proveedor/entorno;
- clave interna de producto y referencia opaca de precio;
- estado normalizado y estado original del proveedor;
- inicio y fin del periodo confirmado;
- `cancel_at_period_end`, `canceled_at` y `ended_at`;
- versión o instante autoritativo del proveedor;
- marcas de creación y actualización.

No se aceptará el precio desde el navegador. Una configuración de servidor
mapeará una clave interna permitida a la referencia del proveedor para cada
entorno.

### `private.entitlements`

- `user_id`;
- `product_key`;
- `source` y referencia a la suscripción cuando corresponda;
- `valid_from`, `valid_until` y `revoked_at`;
- `reason_code` no sensible;
- identificador del evento que originó el cambio;
- marcas de creación y actualización.

Una restricción impedirá dos intervalos activos incompatibles para la misma
persona y producto. Los índices empezarán por `(user_id, product_key)` y se
validarán con las consultas reales de autorización.

### `private.billing_events`

- proveedor, entorno e ID de evento;
- tipo y versión de API;
- hash del cuerpo original;
- instante declarado por el proveedor e instante de recepción;
- estado `received`, `processing`, `processed` o `failed`;
- número de intentos, código de error seguro y marcas de procesamiento;
- referencias internas afectadas.

La unicidad `(provider_key, environment, provider_event_id)` es la primera
barrera de idempotencia. El mismo ID con otro hash es un incidente: se bloquea
y se investiga. El payload completo solo se conservará si una necesidad legal
o de soporte lo justifica, con cifrado y retención limitada.

### Auditoría y conciliación

`private.billing_audit_log` registrará cambios de estado y entitlement con
actor (`webhook`, `reconciliation`, `admin`), motivo, valores anteriores y
nuevos sin secretos. `private.reconciliation_runs` registrará alcance,
conteos, diferencias y resultado de cada conciliación.

Los eventos financieros no se borrarán para “corregir” un caso: se agregará un
evento o ajuste compensatorio.

## 6. Flujo de alta y pago

```text
Persona autenticada
  → solicita un producto interno permitido
  → Server Action valida sesión, producto y estado actual
  → servidor crea o recupera la referencia del cliente
  → servidor crea una sesión de pago con referencia e idempotency key
  → proveedor realiza el flujo de pago
  → regreso a la app muestra “confirmando”, no concede acceso
  → webhook firmado actualiza proyección y entitlement
  → la siguiente solicitud autorizada puede entrar
```

Si el proveedor ofrece una página alojada para capturar datos de pago, se
preferirá para reducir el alcance de datos sensibles. Esa preferencia no elige
proveedor ni sustituye la revisión legal y fiscal.

La URL de éxito es navegación, no prueba de pago. Tampoco se confiará en un
`price_id`, importe, correo, `user_id` o estado enviado por el navegador. Las
referencias internas se enlazarán con metadatos controlados por el servidor y
se verificarán contra la sesión.

## 7. Webhook autenticado, idempotente y resistente a replay

La futura Route Handler reservada para el webhook seguirá este orden:

1. aceptar solo `POST` por HTTPS y aplicar un límite de tamaño;
2. leer el cuerpo original una sola vez;
3. obtener el secreto exclusivo del entorno;
4. verificar con la biblioteca oficial del proveedor la firma y, si el
   protocolo lo ofrece, la antigüedad permitida del timestamp;
5. usar comparación en tiempo constante si la verificación no queda encapsulada
   por la biblioteca oficial;
6. rechazar antes de parsear cualquier firma ausente o inválida;
7. validar el esquema y aceptar solo los tipos de evento necesarios;
8. insertar o recuperar `billing_events` por su clave única;
9. responder `2xx` a un duplicado ya procesado con el mismo hash;
10. reprocesar de forma segura un evento `failed` y bloquear el mismo ID con
    hash distinto;
11. actualizar suscripción, entitlement y auditoría en una transacción;
12. marcar el evento `processed` solo después del commit.

Si el procesamiento transitorio falla, se registra un error sin datos
sensibles y se devuelve un estado que permita reintento. Un evento desconocido
se registra como no soportado y no cambia acceso.

### Concurrencia y desorden

- La transición bloqueará la fila de suscripción o usará una versión
  optimista para evitar carreras.
- Un evento con instante o versión anterior no podrá sobrescribir estado más
  reciente.
- Cuando falte contexto o llegue un evento fuera de orden, el servidor
  consultará el objeto canónico del proveedor antes de decidir.
- Cada operación saliente que el proveedor permita llevará una idempotency key
  estable por intención de negocio, no una clave nueva por reintento.
- El endpoint se suscribirá solo a los eventos requeridos.

El procesamiento inicial puede ser síncrono si termina dentro del límite del
proveedor. Antes de añadir una cola se medirán latencia, volumen y reintentos.
Si una cola se vuelve necesaria, el evento ya persistido será el trabajo
durable y conservará la misma idempotencia.

## 8. Autorización server-side denegada por defecto

El futuro control central seguirá una interfaz conceptual equivalente a:

```text
requireUser()
  → requireEntitlement(product_key)
    → comprobar intervalo vigente y no revocado en Postgres
      → permitir o redirigir a un estado seguro
```

Reglas:

- `proxy.ts` seguirá refrescando sesión; no será la autoridad de acceso;
- cada página, Server Action y Route Handler de estudio volverá a comprobar el
  entitlement;
- cada escritura validará además propiedad y publicación del recurso;
- una falla de base, estado desconocido o timeout denegará acceso y mostrará
  recuperación, no “fallará abierto”;
- el módulo de facturación será `server-only` y será el único que pueda usar
  secretos del proveedor;
- la clave privilegiada de Supabase no se reutilizará como identidad de una
  persona ni se importará en componentes de cliente;
- errores para estudiantes no permitirán enumerar cuentas, clientes, planes o
  suscripciones.

Las rutas editoriales continuarán protegidas por `requireAdmin`. Las rutas de
estudio exigirán entitlement, incluso para la administradora, mediante una
concesión `operations` explícita.

## 9. RLS y aislamiento multiusuario

El producto actual comparte una biblioteca publicada y aísla la actividad por
`user_id`; no existe todavía el concepto de organización o tenant. No se
añadirá `tenant_id` hasta que un requisito real defina organizaciones,
miembros y propietarios.

Para la etapa de suscripción:

- las tablas de facturación permanecerán en un esquema no expuesto y sin
  grants para `anon` o `authenticated`;
- solo procesos de servidor estrechamente delimitados escribirán eventos,
  suscripciones y entitlements;
- si la interfaz necesita mostrar el estado, recibirá una proyección mínima
  desde servidor, no IDs del proveedor ni payloads;
- una función `private.has_active_entitlement(product_key)` podrá comprobar
  `auth.uid()` contra intervalos locales; será `security definer`, con
  `search_path` vacío, nombres cualificados y `EXECUTE` solo para el rol
  necesario;
- las políticas de lectura de contenido publicado exigirán administrador o
  entitlement vigente;
- las políticas de inserción/actualización de progreso exigirán propiedad,
  contenido publicado y entitlement vigente;
- el acceso de una persona a su historial para exportación o eliminación se
  diseñará aparte, para que cancelar no suprima sus derechos sobre datos
  personales;
- cada política nombrará explícitamente `to authenticated` y conservará
  índices para `user_id`, producto y vigencia.

No se consultará al proveedor dentro de RLS. Tampoco se usará
`raw_user_meta_data` como autorización. Si se creara una vista, deberá ser
`security_invoker` o quedar fuera de esquemas expuestos.

## 10. Cancelación, fin de periodo y reembolsos

### Cancelación

La solicitud se autenticará, resolverá el cliente desde `user_id` y enviará al
proveedor una intención idempotente. El servidor nunca aceptará un ID de
suscripción arbitrario del formulario.

La política abierta deberá elegir entre:

- cancelación al final del periodo cubierto;
- cancelación inmediata;
- ambas, según condiciones transparentes.

El sistema soportará las dos sin decidir cuál ofrecer. `cancel_at_period_end`
no revoca por sí mismo; `valid_until` representa el límite efectivo aprobado.
Una reactivación antes del final también será idempotente y auditable.

### Cobro fallido

`past_due` deniega por defecto. Si se aprueba una gracia, tendrá duración
explícita, se materializará como un entitlement acotado y será visible para
soporte. No habrá una gracia infinita implícita en código.

### Reembolso y contracargo

El proveedor conserva la verdad financiera. La aplicación registrará la
referencia opaca, importe, moneda, tipo y estado estrictamente necesarios para
conciliar. La política pendiente definirá impacto en acceso, reembolsos
parciales, contracargos y atención al usuario. Cada cambio de entitlement
quedará enlazado al evento que lo justificó.

No se borrará progreso académico al cancelar, vencer o reembolsar. Retención,
exportación y eliminación de cuenta tendrán su propio flujo y política.

## 11. Conciliación, auditoría y observabilidad

El webhook reduce latencia, pero no basta como única vía. Un proceso periódico
de conciliación deberá:

1. paginar suscripciones cambiadas desde un cursor seguro;
2. consultar su estado canónico;
3. comparar referencia, estado, periodo, cancelación y entitlement;
4. corregir mediante la misma función de transición idempotente;
5. registrar cada diferencia y resultado;
6. alertar sin incluir PII o secretos.

La frecuencia y retención siguen abiertas hasta conocer proveedor, volumen y
obligaciones. Como mínimo se medirán:

- webhooks recibidos, inválidos, duplicados, fallidos y retrasados;
- antigüedad del evento procesado más reciente;
- suscripciones sin entitlement y entitlements sin fuente válida;
- diferencias de conciliación;
- fallos de renovación y cambios manuales;
- accesos denegados por estado desconocido.

Toda operación administrativa registrará actor, instante, motivo y cambio. Los
logs técnicos usarán IDs internos o hashes; no incluirán cuerpos completos,
tokens, firmas, correos ni datos de pago.

## 12. Entornos y secretos

### Separación de entornos

| Entorno | Datos y proveedor | Uso |
| --- | --- | --- |
| Local | Supabase local o proyecto de desarrollo y sandbox del proveedor. | Desarrollo y reenvío controlado de webhooks. |
| Prueba/preview | Proyecto y credenciales de prueba separados; sin producción. | Recorridos automáticos y revisión previa. |
| Producción | Proyecto, cuenta, catálogo y endpoint exclusivos. | Solo después de aprobar gates de lanzamiento. |

Los IDs de cliente, precio, evento o suscripción de un entorno se rechazarán en
otro. CI usará fixtures y firmas sintéticas; no recibirá secretos ni accederá a
Supabase o al proveedor de producción.

### Inventario mínimo de secretos futuros

- clave API privada del proveedor;
- secreto de firma del webhook por endpoint y entorno;
- credenciales o claves limitadas para conciliación, si el proveedor lo
  permite;
- `SUPABASE_SECRET_KEY`, ya existente y siempre server-side.

Se gestionarán en el almacén de secretos del entorno de despliegue, nunca en
Git ni en variables `NEXT_PUBLIC_*`. Tendrán propietario, propósito, alcance,
fecha de creación, rotación y procedimiento de revocación. La rotación de
webhook aceptará temporalmente clave nueva y anterior solo durante una ventana
controlada.

## 13. Fallos y recuperación

| Fallo | Comportamiento seguro | Recuperación |
| --- | --- | --- |
| Firma inválida o timestamp fuera de tolerancia | Rechazar sin parsear ni cambiar estado. | Revisar secreto, reloj y configuración; no reinyectar manualmente sin evidencia. |
| Evento duplicado | Responder éxito si ID y hash coinciden y ya fue procesado. | Ninguna mutación adicional. |
| Mismo ID con hash distinto | Bloquear como incidente. | Comparar con el proveedor y auditar. |
| Evento fuera de orden | No degradar estado nuevo. | Consultar objeto canónico y conciliar. |
| Base no disponible | Denegar acceso; no conceder por caché vencida. | Proveedor reintenta; procesar pendientes al recuperar. |
| Proveedor no disponible durante checkout/cancelación | Mensaje recuperable, misma idempotency key. | Reintento seguro y conciliación posterior. |
| Webhook perdido | Estado local puede quedar atrasado, nunca ampliarse sin confirmación. | Conciliación detecta y repara. |
| Error parcial de procesamiento | Suscripción, entitlement y auditoría hacen rollback juntos. | Evento queda `failed` y se reintenta. |
| Secreto expuesto | Revocar y rotar; bloquear endpoint si es necesario. | Revisar logs, eventos y accesos durante la ventana. |
| Entitlement inconsistente | Denegar y alertar. | Recalcular desde estado canónico con registro de auditoría. |

Los runbooks de producción deberán incluir reenvío de eventos, reconstrucción
de entitlements desde suscripciones, rotación de secretos y restauración de
base. Ninguno sustituye el respaldo probado.

## 14. Estrategia de pruebas

Antes de producción deberán existir:

- pruebas puras de mapeo de cada estado del proveedor al estado normalizado y
  al entitlement;
- pruebas de firma válida, firma inválida, cuerpo alterado y timestamp
  vencido, según el protocolo elegido;
- pruebas de duplicado, replay, concurrencia y mismo ID con hash distinto;
- eventos fuera de orden y recuperación mediante estado canónico;
- transición de alta, renovación, `past_due`, recuperación, cancelación al
  final, cancelación inmediata, expiración y reactivación;
- reembolso y contracargo conforme a la política aprobada;
- RLS con dos estudiantes, una administradora, contenido publicado y borrador;
- imposibilidad de escribir entitlements o facturación como cliente;
- separación completa entre sandbox y producción;
- conciliación que detecta y repara diferencias sin duplicar auditoría;
- recorridos de navegador para alta, confirmación pendiente, acceso, cobro
  fallido, cancelación y soporte;
- pruebas de restauración que incluyan las futuras tablas de facturación.

Los payloads de prueba serán sintéticos y no contendrán datos reales.

## 15. Roadmap incremental y criterios de aceptación

### Etapa 0 — Cerrar prerrequisitos operativos

No se escribe código de pagos.

**Aceptación:**

- transcripciones copiadas y verificadas fuera de `F:`;
- exportación real de Supabase, copia externa y restauración de ensayo;
- migración RLS remota confirmada y suite remota aprobada;
- despliegue privado estable con observabilidad y rollback;
- flujos centrales probados en navegador;
- responsables de repositorio, Supabase, respaldo, despliegue y soporte;
- decisiones de proveedor, planes/precios, prueba, cancelación, reembolso e
  impuestos registradas.

### Etapa 1 — Dominio y autorización, sin cobro

Crear migraciones y lógica pura detrás de una bandera desactivada.

**Aceptación:**

- tablas privadas, grants mínimos, restricciones e índices revisados;
- rol y entitlement demostrablemente independientes;
- `requireEntitlement` deniega por defecto en todos los estados desconocidos;
- entitlement `operations` de la administradora creado y auditado antes de
  activar enforcement;
- RLS multiusuario y reconstrucción de entitlements probadas;
- rollback de migración y respaldo actualizados;
- registro público y cobro continúan desactivados.

### Etapa 2 — Integración sandbox cerrada

Integrar el proveedor elegido solo en desarrollo/prueba y con cuentas
invitadas.

**Aceptación:**

- checkout toma producto/precio únicamente de configuración de servidor;
- webhook firmado supera firma, replay, duplicados y desorden;
- página de éxito no concede acceso;
- alta, renovación, fallo, cancelación y recuperación son idempotentes;
- conciliación detecta diferencias y deja auditoría;
- no hay secretos ni IDs cruzados entre entornos;
- pruebas locales, RLS, navegador, lint y build aprobadas.

### Etapa 3 — Piloto privado

Desplegar con invitaciones limitadas y soporte manual, todavía sin registro
abierto.

**Aceptación:**

- términos, privacidad, impuestos, comprobantes, cancelación, reembolso y
  soporte aprobados;
- alertas y runbooks ensayados;
- respaldo y restauración incluyen suscripciones y eventos;
- métricas no contienen PII;
- reconciliación ejecutada sin diferencias sin resolver;
- revocación y recuperación de acceso probadas con usuarios de ensayo.

### Etapa 4 — Apertura comercial gradual

Solo una decisión explícita puede habilitar registro y cobros de producción.

**Aceptación:**

- checklist de lanzamiento firmado por la responsable;
- credenciales y webhooks de producción rotables y verificados;
- soporte, monitoreo, conciliación y restauración operativos;
- despliegue gradual con forma documentada de detener nuevas altas sin afectar
  a suscripciones existentes;
- revisión posterior confirma que acceso, cobros y cancelaciones coinciden.

## 16. Lo que no debe activarse todavía

Hasta completar las etapas anteriores, queda prohibido:

- habilitar el registro público en la aplicación o en Supabase Auth;
- habilitar checkout, portal o webhook de producción;
- crear productos, precios o pruebas reales sin decisión aprobada;
- aceptar datos de tarjeta en la aplicación;
- conceder acceso desde la URL de éxito o desde parámetros del navegador;
- poner estado de pago o entitlement en metadatos editables por la persona;
- aplicar políticas RLS comerciales antes de crear y comprobar el entitlement
  operativo de la administradora;
- usar secretos de producción en local, preview o CI;
- cobrar antes de tener despliegue, respaldo restaurable, RLS remota
  verificada, políticas legales/fiscales y soporte;
- borrar progreso al cancelar o reembolsar.

## 17. Decisiones abiertas

La arquitectura no responde todavía:

1. proveedor y país/cuenta contractual;
2. catálogo de productos, planes, precios y moneda;
3. duración y condiciones de una prueba, o si existirá;
4. cancelación inmediata o al final de periodo;
5. gracia para `past_due`;
6. reglas de reembolso, reembolso parcial y contracargo;
7. impuestos, facturación y comprobantes aplicables;
8. medios de pago, portal de autoservicio y recuperación de cobro;
9. política de acceso de cortesía;
10. retención de eventos, auditoría y datos de cuenta;
11. atención, tiempos de respuesta y responsable de conciliación;
12. fecha y criterios comerciales de apertura.

Resolverlas requiere decisiones de producto, operación, legales y fiscales;
no deben inferirse desde el código.

## 18. Referencias técnicas

Estas referencias sustentan patrones generales; no seleccionan proveedor:

- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): propiedad por `auth.uid()`, roles explícitos y cuidados con claims editables o desactualizados.
- [Supabase — Securing your API](https://supabase.com/docs/guides/api/securing-your-api): grants, RLS, esquemas no expuestos y revisión de funciones privilegiadas.
- [OWASP — Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html): inventario, ciclo de vida y rotación de secretos.
- [GitHub — Validating webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries): firma sobre el cuerpo original, secreto server-side y comparación segura.
- [Stripe — Webhooks](https://docs.stripe.com/webhooks): ejemplo documentado de reintentos, duplicados y entrega fuera de orden. Se cita como evidencia del patrón, no como elección de proveedor.
