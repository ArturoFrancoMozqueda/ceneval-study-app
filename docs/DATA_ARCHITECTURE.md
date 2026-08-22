# Arquitectura de datos y roadmap de optimización

Última revisión: 20 de agosto de 2026

Estado: decisión vigente y documento vivo

## Decisión ejecutiva

CENEVAL Study App mantendrá **Supabase PostgreSQL como fuente única de verdad**.
No se migrará el núcleo académico, el progreso, los exámenes ni los futuros
entitlements a una base no relacional mientras no exista una medición que
demuestre un problema que PostgreSQL no pueda resolver de forma razonable.

La optimización seguirá este orden:

1. medir consultas y consumo reales;
2. corregir modelo, consultas, índices y RLS;
3. cachear únicamente lecturas públicas o editoriales compartidas con una
   estrategia de invalidación explícita;
4. separar archivos grandes hacia almacenamiento de objetos;
5. escalar cómputo o añadir réplicas solo después de agotar los pasos
   anteriores;
6. considerar otro motor únicamente para un caso de uso acotado, nunca como
   reescritura preventiva del sistema completo.

Esta decisión amplía ADR-005 y ADR-015. No autoriza desplegar, abrir registro,
contratar un plan ni implementar cobros.

## Por qué los datos de CENEVAL son relacionales

La elección se apoya en el código versionado, no solo en una comparación de
productos:

- `subjects`, `classes`, `topics`, `study_materials`, `flashcards`, `exams`,
  preguntas y opciones forman una jerarquía con claves foráneas y restricciones
  de unicidad;
- una misma fuente legal puede relacionarse con varios temas mediante
  `topic_references`;
- intentos, respuestas, revisiones y progreso pertenecen a una identidad y
  deben aislarse por `user_id`;
- la visibilidad de materiales depende de que toda la cadena termine en una
  clase con `publication_status = 'published'`;
- la respuesta correcta vive separada en `exam_answer_keys`, está bloqueada
  para clientes y la calificación sucede en el servidor;
- crear un tema, importar un paquete y proyectar en el futuro una suscripción
  requieren consistencia transaccional e idempotencia;
- el historial es importante: una revisión, un intento o una versión editorial
  nueva no debe sobrescribir el evento anterior.

Estas reglas están expresadas en `supabase/migrations/`, en
`lib/data/academic.ts` y en las pruebas locales. Un modelo documental obligaría
a duplicar relaciones, mantener copias sincronizadas y trasladar a la
aplicación garantías que PostgreSQL ya aplica de forma centralizada.

El volumen conocido tampoco justifica una base distribuida: el repositorio
contiene 41 paquetes históricos y el objetivo editorial actual es de 58 clases.
El crecimiento relevante vendrá primero por usuarios y eventos de estudio, no
por un catálogo académico de tamaño masivo.

## Arquitectura híbrida objetivo

"Híbrida" no significa varias bases de verdad. Significa asignar cada tipo de
dato al servicio apropiado sin romper su autoridad:

```text
Navegador
   |
   v
Next.js (autenticación, autorización y reglas de negocio)
   |
   +-- Supabase Auth: identidad
   |
   +-- PostgreSQL: fuente de verdad
   |      +-- catálogo editorial y fuentes
   |      +-- progreso, repasos e intentos
   |      +-- entitlements y proyección de pagos futura
   |      +-- RLS, restricciones, índices y transacciones
   |
   +-- Object Storage: audio y otros binarios grandes
   |
   +-- CDN/caché: copia derivada y reemplazable de contenido publicado
   |
   +-- proveedor de pagos futuro
          +-- evento firmado
          +-- webhook idempotente
          +-- proyección local en PostgreSQL
```

### PostgreSQL

Conserva datos estructurados, relaciones, metadatos de evidencia, estado
editorial, eventos de aprendizaje y la futura decisión local de acceso. Una
suscripción no se modelará como un booleano en el perfil: seguirá el diseño de
[`SUBSCRIPTION_ARCHITECTURE.md`](SUBSCRIPTION_ARCHITECTURE.md).

### Almacenamiento de objetos

Los audios, imágenes o exportaciones no deben guardarse como binarios dentro
de PostgreSQL. La base almacenará metadatos, checksum, tamaño, tipo y una ruta
estable. El acceso privado tendrá políticas propias. El texto consultable de
el texto de una transcripción permanece en el archivo editorial privado y no
en PostgreSQL; la base recibe únicamente audio, localizador y vínculos.

### Caché y CDN

La caché será una copia derivada, nunca autoridad. El primer candidato es el
catálogo **publicado e idéntico para todas las estudiantes**. El progreso,
intentos, repaso, rol, entitlement y cualquier respuesta sujeta a RLS no se
compartirán entre usuarias. Toda entrada tendrá clave completa, duración,
propietario e invalidación documentados.

No se añade Redis en la etapa actual. PostgreSQL puede resolver inicialmente
idempotencia de webhooks mediante una restricción única sobre el ID del evento,
además de transacciones. Redis se evaluará solo para un problema medido de
caché, rate limiting distribuido o coordinación efímera.

### Búsqueda

La búsqueda actual por título usa `ILIKE`. La siguiente evolución natural es
Full Text Search de PostgreSQL, con índice apropiado y configuración en
español, no una base externa. `pgvector` será una opción posterior para una
necesidad semántica validada; no reemplaza la búsqueda léxica ni se incorpora
por moda.

## Opciones evaluadas

Los precios son referencias públicas consultadas el 20 de agosto de 2026; se
deben volver a verificar antes de contratar o abrir el producto.

| Opción | Entrada y crecimiento | Autenticación y aislamiento | Portabilidad y costo de cambio | Decisión |
| --- | --- | --- | --- | --- |
| **Supabase PostgreSQL** | Free incluye 500 MB de base, 50 000 MAU, 5 GB de egress y dos proyectos activos; pausa tras una semana sin actividad. Pro inicia en USD 25/mes e incluye 8 GB y respaldos diarios por siete días. | Supabase Auth se integra con RLS nativa de PostgreSQL. Es el modelo ya probado y versionado por la aplicación. | Los datos y el esquema son PostgreSQL y pueden exportarse; Auth, Storage, Data API y helpers propios sí generan acoplamiento moderado. | **Mantener.** Es la menor complejidad y el menor riesgo total. |
| **Neon / Postgres de Vercel** | Vercel Postgres ya no existe como producto propio; las bases nuevas se conectan desde Marketplace. Neon Free ofrece 0.5 GB y cómputo que escala a cero; Launch cobra cómputo y almacenamiento por uso. | Neon ofrece Auth y dos caminos de RLS, pero habría que adaptar la integración existente y sus políticas. | El esquema y los datos son portables mediante herramientas PostgreSQL; sustituir Auth, Storage, Data API y clientes sigue siendo trabajo real. | Alternativa válida si una medición futura demuestra una ventaja material de costo o branching. No migrar ahora. |
| **Firebase / Firestore** | Free ofrece 1 GiB, 50 000 lecturas, 20 000 escrituras y 20 000 borrados diarios; después cobra por documentos, índices, almacenamiento y red. | Firebase Auth y Security Rules están integrados, pero las reglas no filtran resultados y los SDK de servidor las omiten. | Exigiría rediseñar relaciones como documentos, reescribir consultas, seguridad, importador y pruebas. El cobro por lectura puede amplificarse con duplicación y listeners. | No adecuado como fuente principal para este dominio relacional. |
| **MongoDB Atlas** | Free ofrece 512 MB; Flex llega hasta USD 30/mes para prototipos y Dedicated parte aproximadamente de USD 56.94/mes. | Atlas App Services, incluida su gestión de usuarios de aplicación, llegó a fin de vida; sería necesario integrar Auth y autorización por separado. | Las referencias entre documentos requieren resolución adicional y la migración cambiaría el modelo, no solo el proveedor. | Sin beneficio que compense la reescritura. |
| **PlanetScale PostgreSQL** | No tiene plan gratuito; un nodo único parte de USD 5/mes y cada branch usa un clúster facturado. | PostgreSQL ofrece RLS, pero PlanetScale no entrega el puente integrado de identidad de Supabase para este proyecto. | El núcleo SQL es portable; Auth, API y Storage deben reemplazarse. El branching de Postgres todavía requiere aplicar manualmente los cambios de esquema entre ramas. | Considerar solo si una necesidad comprobada de rendimiento u operación supera su costo y trabajo de integración. |

### Fuentes oficiales

- [Precios de Supabase](https://supabase.com/pricing)
- [Row Level Security de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Conexiones y pooler de Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Exportar una instancia administrada de Supabase](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [Precios de Neon](https://neon.com/pricing)
- [RLS en Neon](https://neon.com/docs/guides/row-level-security)
- [Estado de Postgres en Vercel](https://vercel.com/docs/postgres)
- [Precios de Firestore](https://firebase.google.com/docs/firestore/pricing)
- [Reglas y consultas de Firestore](https://firebase.google.com/docs/firestore/security/rules-query)
- [Modelo documental de Firestore](https://firebase.google.com/docs/firestore/data-model)
- [Precios de MongoDB Atlas](https://www.mongodb.com/pricing)
- [Fin de vida de Atlas App Services](https://www.mongodb.com/docs/api/doc/atlas-app-services-admin-api-v3/)
- [Referencias entre documentos de MongoDB](https://www.mongodb.com/docs/manual/reference/database-references/)
- [Planes de PlanetScale](https://planetscale.com/docs/planetscale-plans)
- [Precios de PlanetScale PostgreSQL](https://planetscale.com/docs/postgres/pricing)
- [Branching de PlanetScale PostgreSQL](https://planetscale.com/docs/postgres/branching)

## Roadmap de optimización

### P0 — Medir, proteger y establecer una línea base

Debe completarse antes de optimizar infraestructura:

1. recuperar/importar la biblioteca en el proyecto CENEVAL correcto;
2. obtener un respaldo real, verificarlo y restaurarlo en un proyecto de
   ensayo conforme a [`SUPABASE_BACKUP.md`](SUPABASE_BACKUP.md);
3. mantener conciliado el historial local y remoto de migraciones, ampliar y
   ejecutar la suite RLS autorizada y atender futuros hallazgos de los
   asesores de seguridad;
4. registrar semanalmente tamaño de base y Storage, MAU, egress, conexiones,
   CPU, memoria, latencia p50/p95/p99 y las diez consultas más lentas;
5. capturar `EXPLAIN (ANALYZE, BUFFERS)` de consultas lentas con datos de ensayo
   representativos, sin copiar datos privados al repositorio;
6. verificar índices de claves foráneas, columnas de RLS, cursores y filtros de
   publicación;
7. definir presupuesto mensual y alertas antes de habilitar consumo pagado;
8. conservar SQL versionado como única vía normal de cambio de esquema.

Resultado esperado: una línea base reproducible. Sin ella no se aprobará un
cambio de motor, una réplica ni una caché distribuida.

### P1 — Preparar el piloto de suscripción

Se ejecuta cuando el producto tenga usuarios piloto y proveedor de pagos
aprobado:

1. pasar a un plan con continuidad y respaldos administrados antes de depender
   de ingresos; Supabase Free puede pausarse y no ofrece backups automáticos;
2. ubicar funciones y base en regiones compatibles y medir la latencia real;
3. implementar clientes, suscripciones, entitlements y eventos de webhook en
   tablas normalizadas, con IDs externos únicos y transición idempotente;
4. mantener tablas de facturación fuera de la Data API y probar denegación por
   defecto;
5. mover audio y binarios a Storage con políticas, checksums y límites;
6. introducir FTS únicamente si cruza su umbral;
7. cachear contenido publicado únicamente si cruza su umbral y existe una
   prueba que demuestre aislamiento entre usuarias;
8. añadir pruebas de carga representativas y alertas de costo.

### P2 — Escalar por evidencia

Cada elemento es independiente; P2 no es una migración obligatoria:

- añadir una réplica de lectura solo si el primario sigue limitado después de
  optimizar consultas, índices y caché segura;
- evaluar `pgvector` solo con un conjunto de relevancia y una mejora medible;
- particionar o archivar tablas de eventos solo cuando tamaño y planes de
  consulta lo requieran;
- evaluar Redis administrado únicamente para un caso efímero con objetivos de
  latencia y disponibilidad explícitos;
- evaluar Neon, PlanetScale u otro PostgreSQL si el costo mensual proyectado
  mejora de forma material después de incluir migración, Auth, Storage,
  observabilidad y operación;
- usar NoSQL solo como proyección especializada y reconstruible si un patrón
  de acceso independiente cumple los umbrales de esta guía.

## Umbrales para reconsiderar decisiones

Los umbrales son puertas de investigación, no órdenes automáticas de compra.
Primero deben repetirse durante siete días o en tres pruebas de carga
representativas y debe descartarse una regresión de código.

| Decisión | Umbral para abrir evaluación | Condición para adoptar |
| --- | --- | --- |
| **Full Text Search de PostgreSQL** | Más de 10 000 filas buscables, p95 de búsqueda mayor a 250 ms, o al menos 10% de búsquedas reales sin resultados pese a existir contenido relevante. | Un índice FTS reduce p95 al menos 30% o mejora la tasa de éxito al menos 15% en un conjunto de consultas en español, sin romper filtros de publicación. |
| **`pgvector` / búsqueda semántica** | Después de FTS, al menos 15% de búsquedas reales siguen sin encontrar contenido que una revisión humana considera relevante. | Una evaluación offline muestra al menos 20% de mejora en nDCG@10 o tasa de éxito y el costo mensual estimado queda dentro del presupuesto aprobado. |
| **Caché de contenido publicado** | Una lectura idéntica representa al menos 20% de las consultas durante siete días, o p95 de una página de catálogo supera 300 ms después de optimizar SQL e índices. | Una prueba reduce carga de lectura y p95 al menos 30%, tiene invalidación por publicación/retiro y demuestra que ninguna respuesta personalizada se comparte. |
| **Redis u otra caché distribuida** | Se necesita rate limiting coordinado entre instancias, una caché local no alcanza el objetivo, o hay más de 1 000 operaciones por segundo sobre una clave efímera caliente. | Existe objetivo de disponibilidad, TTL, fallback y presupuesto; perder Redis no pierde datos ni concede acceso. |
| **Réplica de lectura** | Lecturas son más de 80% de la carga y CPU del primario permanece sobre 70% durante 15 minutos en periodos pico, o p95 de lectura supera 500 ms tras corregir SQL, índices y caché. | Una prueba con tráfico representativo alcanza el objetivo sin usar la réplica para lecturas que necesitan consistencia inmediata. |
| **Particionado o archivo de eventos** | Una tabla de intentos/revisiones supera 10 millones de filas o 50 GB y las consultas acotadas por usuario/fecha siguen fuera del objetivo con índices correctos. | El plan particionado reduce p95 al menos 30%, conserva RLS y tiene procedimiento probado de mantenimiento y restauración. |
| **Otro proveedor PostgreSQL** | El costo recurrente proyectado supera el presupuesto durante tres meses, hay un requisito de región/SLA incumplido o una limitación demostrada bloquea el producto. | El análisis de costo total incluye Auth, Storage, egress, backups, soporte, tiempo de migración y rollback; el ensayo restaura esquema, datos, usuarios y seguridad. |
| **NoSQL para un caso acotado** | Un flujo independiente y sin joins requiere más de 5 000 escrituras por segundo sostenidas, más de 100 millones de eventos, o distribución multi-región que PostgreSQL no cumple aun después de una prueba de diseño. | La proyección puede reconstruirse desde PostgreSQL, no contiene decisiones de autorización y una prueba demuestra ventaja de costo o latencia de al menos 30%. |
| **Reescritura total en NoSQL** | No existe un umbral operativo ordinario que la autorice. Requiere un ADR nuevo y evidencia de que la mayoría del dominio dejó de ser relacional. | Plan de migración y rollback, equivalencia de integridad, RLS/Auth, auditoría, respaldo y costo total aprobados explícitamente. |

## Portabilidad y plan de salida

Supabase reduce el lock-in de datos porque el núcleo es PostgreSQL, pero no lo
elimina. Para conservar una salida viable:

- mantener todas las migraciones propias en Git;
- no depender de cambios manuales sin una migración equivalente;
- generar periódicamente dumps de esquema y datos con la CLI fijada;
- inventariar extensiones, roles, políticas, funciones y triggers;
- aislar el acceso a datos en módulos de servidor;
- guardar IDs externos de pagos sin convertir al proveedor en autoridad de
  acceso en cada request;
- documentar por separado la exportación de Auth y de objetos de Storage;
- probar restauraciones, no solo generar archivos;
- exigir un ensayo en un proyecto distinto antes de cualquier cambio de
  proveedor.

Migrar de Supabase a Neon o PlanetScale PostgreSQL conservaría buena parte del
DDL y los datos, pero no sustituye automáticamente Supabase Auth, Storage,
PostgREST ni sus helpers de RLS. Migrar a Firestore o MongoDB implica además
rediseñar el modelo y las consultas; no debe describirse como un simple cambio
de conexión.

## Antipatrones prohibidos

- añadir MongoDB, Firestore, Redis o una base vectorial antes de medir una
  necesidad concreta;
- guardar la misma entidad académica como autoridad en dos bases;
- una base, esquema o tabla por estudiante;
- convertir relaciones académicas en documentos anidados que deban copiarse y
  sincronizarse;
- usar Redis, la caché de Next.js o el navegador como fuente de verdad de un
  entitlement;
- cachear respuestas sujetas a RLS sin incluir y validar la identidad y sin
  una razón revisada de seguridad;
- conceder acceso desde la página de éxito de un pago en vez de un webhook
  firmado e idempotente;
- consultar el proveedor de pagos en cada request de la estudiante;
- exponer `service_role`, una secret key, respuestas correctas o tablas de
  facturación al cliente;
- autorizar con `user_metadata` editable;
- añadir índices a todas las columnas sin consultar planes y carga de
  escritura;
- usar `OFFSET` creciente para historiales grandes cuando existe paginación
  por cursor;
- adoptar réplicas para ocultar consultas defectuosas;
- almacenar audio o respaldos binarios dentro de PostgreSQL;
- considerar que Git, una caché o una réplica sustituyen un respaldo
  restaurable.

## Registro de revisión

Este documento se revisará:

- antes de abrir un piloto de suscripción;
- al cambiar de plan o proveedor de datos;
- cuando un umbral de la tabla se mantenga durante el periodo indicado;
- después de un incidente de disponibilidad, aislamiento o costo;
- al menos una vez por trimestre mientras existan usuarias de pago.

Cada revisión debe registrar métricas, decisión, responsable y enlace al ADR o
issue correspondiente. Si no hay mediciones, la decisión predeterminada es
mantener la arquitectura simple actual.
