# Registro de decisiones

## ADR-001 — Enfoque inicial en CENEVAL de Derecho

**Fecha:** 2026-07-23  
**Estado:** Aceptada

La primera versión estará enfocada únicamente en personas egresadas de Derecho que se preparan para CENEVAL.

**Razón:** permite crear una experiencia específica antes de generalizar.

---

## ADR-002 — Una sola usuaria en la primera versión

**Fecha:** 2026-07-23  
**Estado:** Aceptada

La primera versión no necesita registro público ni gestión completa de múltiples usuarios.

**Razón:** reduce complejidad y permite validar el flujo central.

---

## ADR-003 — Conservar la transcripción original

**Fecha:** 2026-07-23  
**Estado:** Aceptada

La versión original será inmutable desde el procesamiento automático.

**Razón:** permite verificar cambios y conservar la fuente.

---

## ADR-004 — Contenido generado editable

**Fecha:** 2026-07-23  
**Estado:** Aceptada

El material generado por IA podrá revisarse, modificarse, aceptarse o rechazarse.

**Razón:** la IA puede cometer errores y el estudiante debe mantener control.

---

## ADR-005 — Arquitectura monolítica

**Fecha:** 2026-07-23  
**Estado:** Aceptada

Se usará una aplicación Next.js monolítica con Supabase.

**Razón:** es suficiente para el alcance inicial y más sencilla de aprender y mantener.

---

## ADR-006 — IA después del flujo manual

**Fecha:** 2026-07-23  
**Estado:** Aceptada

Primero se diseñarán datos, pantallas y flujos manuales. Después se integrará IA.

**Razón:** evita que la lógica principal dependa desde el inicio de una integración costosa e incierta.

---

## ADR-007 — Documentación antes de implementación

**Fecha:** 2026-07-23  
**Estado:** Aceptada

Se terminarán visión, requisitos, historias, navegación, arquitectura y datos antes de implementar funciones grandes.

**Razón:** el usuario desea aprender ingeniería de software completa y evitar construir sin dirección.

---

## ADR-008 — No usar infraestructura avanzada inicialmente

**Fecha:** 2026-07-23  
**Estado:** Aceptada

No se usarán microservicios, Kubernetes ni Docker obligatorio.

**Razón:** no existe una necesidad técnica que justifique esa complejidad.

---

## ADR-009 — Acceso a Supabase únicamente desde el servidor

**Fecha:** 2026-07-23  
**Estado:** Reemplazada por ADR-012

Mientras la aplicación sea de una sola usuaria y no tenga autenticación, las
tablas permanecerán cerradas para los roles `anon` y `authenticated`. Next.js
accederá mediante una clave privada disponible solamente en el servidor.

**Razón:** una política pública para una aplicación sin identidad permitiría
que cualquier persona con la URL y la clave publicable leyera o modificara los
datos. Cuando se incorpore Auth, se añadirán `user_id` y políticas de propiedad
por fila.

La etapa multiusuario ya comenzó. Las lecturas cotidianas usan la identidad
autenticada y RLS; la clave privada se reserva para operaciones administrativas
controladas.

---

## ADR-010 — Biblioteca editorial en lugar de contenido creado por estudiantes

**Fecha:** 2026-07-23  
**Estado:** Aceptada

Codex prepara los paquetes a partir de las transcripciones entregadas por la
administradora. Los estudiantes reciben contenido terminado y publicado.

## ADR-011 — Revisión humana antes de publicar

**Fecha:** 2026-07-23  
**Estado:** Aceptada

Todo paquete queda como borrador y necesita aprobación de la administradora.

## ADR-012 — Cuentas individuales con biblioteca compartida

**Fecha:** 2026-07-23  
**Estado:** Pospuesta temporalmente

El registro es abierto; todo estudiante ve la misma biblioteca publicada, pero
su progreso es privado.

Esta decisión queda pospuesta por ADR-014 mientras la aplicación se utiliza de
forma privada.

## ADR-013 — Posponer OpenAI en el runtime

**Fecha:** 2026-07-23  
**Estado:** Aceptada

Codex prepara e importa el contenido. La API de OpenAI se reserva para una
automatización o tutor futuro.

---

## ADR-014 — Acceso privado para una sola administradora

**Fecha:** 2026-07-29  
**Estado:** Aceptada

Por el momento, la aplicación solo permite el acceso de cuentas con rol
`admin`. El registro público está desactivado y las cuentas con rol `student`
no pueden entrar en las rutas protegidas.

La activación inicial no se considera registro público: con el modo privado
activo, `/registro` solo envía la solicitud a Supabase cuando el correo
normalizado coincide exactamente con `ADMIN_EMAIL`. La respuesta es idéntica
para correos permitidos, no permitidos o ya existentes. Las confirmaciones e
invitaciones vuelven a comprobar ese correo antes de conservar la sesión. El
callback no concede roles: la promoción se realiza con el bootstrap explícito
desde una terminal confiable y se verifica volviendo a leer el perfil. No hay
escrituras durante el render de páginas.

**Razón:** Fatima desea usar y validar personalmente la biblioteca antes de
abrirla a otras personas.

El modo público podrá recuperarse explícitamente con
`PRIVATE_ACCESS_ONLY=false`, acompañado de una nueva revisión de seguridad.
La operación de esta excepción cerrada se documenta en
[`PRIVATE_ADMIN_ACTIVATION.md`](PRIVATE_ADMIN_ACTIVATION.md).

---

## ADR-015 — Suscripción separada de roles y denegada por defecto

**Fecha:** 2026-08-20

**Estado:** Aceptada como arquitectura objetivo; implementación bloqueada

El objetivo comercial futuro es vender acceso a la biblioteca mediante
suscripción. Esta dirección no reemplaza todavía ADR-014: la aplicación sigue
privada, sin registro público y sin cobros.

Cuando se implemente, identidad, rol y derecho de acceso serán conceptos
separados:

- Supabase Auth comprobará la identidad;
- `profiles.role` conservará capacidades editoriales `admin` o de estudio
  `student`;
- un entitlement server-side, acotado por producto y tiempo, decidirá el
  acceso comercial;
- la administradora tendrá un entitlement operativo explícito, no un bypass
  comercial implícito por su rol.

El acceso se denegará si el entitlement falta, venció, fue revocado o no puede
comprobarse. Los eventos firmados del proveedor actualizarán una proyección
local idempotente y auditable; una página de éxito del navegador nunca
concederá acceso. RLS añadirá defensa en profundidad y las tablas de
facturación no quedarán expuestas a clientes autenticados.

La integración permanecerá dentro del monolito Next.js + Supabase mientras no
exista evidencia que justifique infraestructura adicional.

**Razón:** un rol describe responsabilidades, no una relación comercial.
Separarlo de entitlements evita que una promoción administrativa conceda un
producto, que un parámetro del navegador simule pago o que una falla del
proveedor abra acceso por accidente.

**Decisiones todavía abiertas:**

- proveedor y cuenta contractual;
- productos, planes, precios y moneda;
- existencia y reglas de prueba;
- cancelación inmediata o al final del periodo;
- gracia por cobro fallido;
- reembolsos, contracargos e impuestos;
- portal, medios de pago, soporte y fecha de apertura.

Ninguna de estas decisiones se infiere en este ADR. Antes de activar cobros se
deben completar los gates de respaldo restaurable, RLS remota verificada,
despliegue privado, observabilidad, recorridos de navegador y políticas
legales/fiscales descritos en
[`SUBSCRIPTION_ARCHITECTURE.md`](SUBSCRIPTION_ARCHITECTURE.md).

**Consecuencias:** habrá más estados y trabajo operativo que en un booleano
`is_paid`, pero se obtienen revocación explicable, reintentos seguros,
conciliación y una frontera auditable entre administración y acceso comercial.

---

## ADR-016 — PostgreSQL como fuente única de verdad y escala por evidencia

**Fecha:** 2026-08-20

**Estado:** Aceptada

CENEVAL Study App mantendrá Supabase PostgreSQL como fuente única de verdad
para contenido editorial, progreso, exámenes y los futuros entitlements. No se
migrará el núcleo a Firestore, MongoDB u otra base no relacional sin un ADR
nuevo respaldado por mediciones.

La arquitectura podrá usar servicios especializados como almacenamiento de
objetos, CDN o caché, pero sus datos serán derivados y reemplazables. Las
optimizaciones seguirán el orden consultas, índices, RLS, caché segura,
capacidad y réplicas. Otro motor solo se evaluará para un caso de uso acotado
que cruce los umbrales versionados en
[`DATA_ARCHITECTURE.md`](DATA_ARCHITECTURE.md).

**Razón:** el dominio ya depende de relaciones, integridad referencial,
transacciones, historial y aislamiento por fila. Una migración NoSQL
trasladaría esas garantías a la aplicación y obligaría a reescribir el modelo,
la seguridad y las pruebas sin que el volumen actual lo justifique.

**Consecuencias:** se evita complejidad prematura y se conserva la portabilidad
del núcleo PostgreSQL. Supabase Auth, Storage, Data API y sus helpers crean un
acoplamiento moderado, por lo que el plan de salida exige migraciones
versionadas, respaldos restaurables e inventario de extensiones y políticas.
Los precios y umbrales se revisarán antes del piloto y trimestralmente cuando
existan usuarias de pago.
