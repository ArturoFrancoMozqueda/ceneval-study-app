# Arquitectura del sistema

## Actualización: plataforma editorial multiusuario

- Supabase Auth mantiene sesiones por cookies mediante `@supabase/ssr`.
- Los Server Components consultan con la identidad del usuario para que RLS sea
  la barrera principal de acceso.
- La clave secreta se limita al importador editorial, promoción de la única
  administradora y calificación segura.
- Las acciones del servidor vuelven a validar identidad y rol; el proxy solo
  refresca sesiones.
- Las respuestas correctas viven en una tabla separada sin permisos para
  estudiantes.
- Los paquetes preparados por Codex se validan con un esquema versionado antes
  de escribirse.
- La automatización con OpenAI no forma parte del runtime actual.

## Estado

**Aprobado por la usuaria el 2026-07-23.**

La navegación y las pantallas fueron aprobadas el 2026-07-23.

## Objetivo

Construir una aplicación web monolítica, sencilla y mantenible.

Una aplicación monolítica reúne interfaz, reglas y acceso a datos en un solo proyecto. Para esta primera versión facilita aprender, probar y desplegar sin coordinar varios servicios.

## Componentes principales

```text
Navegador
   |
   v
Next.js
   |---- Componentes de servidor
   |---- Componentes interactivos del navegador
   |---- Acciones del servidor
   |---- Validación y reglas de negocio
   |---- Acceso centralizado a datos
   |
   v
Supabase PostgreSQL
   |
   +---- Datos académicos
   +---- Resultados
   +---- Progreso
   +---- Autenticación futura
   +---- Storage futuro
```

En la fase de IA:

```text
Next.js Server
   |
   v
Proveedor de IA
   |
   v
Respuesta estructurada y validada
   |
   v
Supabase
```

## Decisiones iniciales

- Next.js con App Router.
- TypeScript estricto.
- Tailwind CSS.
- Supabase como base de datos.
- Vercel como plataforma de despliegue.
- Aplicación monolítica.
- Procesamiento de IA únicamente desde el servidor.
- Variables de entorno para secretos.
- Ninguna clave secreta debe llegar al navegador.

## Responsabilidades

### Navegador

El navegador mostrará las pantallas y manejará interacciones inmediatas:

- escribir en formularios;
- abrir y cerrar elementos;
- seleccionar respuestas;
- mostrar validaciones sencillas;
- comunicar estados de carga, éxito y error.

El navegador no accederá a claves secretas, no llamará directamente al proveedor de IA y no decidirá permisos.

### Next.js

Next.js será el centro de la aplicación:

- construirá las rutas definidas en `04-navigation-and-screens.md`;
- leerá datos para las páginas;
- recibirá y validará formularios;
- aplicará reglas de negocio;
- coordinará escrituras en Supabase;
- protegerá secretos;
- devolverá errores comprensibles.

Se preferirán componentes de servidor. Los componentes del navegador se usarán solamente cuando exista interacción, estado local o una API del navegador.

### Supabase

Supabase PostgreSQL será la fuente permanente de verdad:

- guardará materias, clases y transcripciones;
- conservará relaciones entre clases, temas y materiales;
- almacenará flashcards, exámenes e intentos;
- aplicará integridad referencial;
- permitirá migraciones reproducibles;
- incorporará políticas de acceso antes de habilitar múltiples usuarios.

En la fase inicial no se usarán Auth ni Storage porque habrá una sola usuaria y las transcripciones se pegarán como texto.

## Flujo de lectura

```text
La usuaria abre una página
  → un componente de servidor de Next.js solicita los datos
  → la capa de datos consulta Supabase
  → Next.js transforma el resultado para la pantalla
  → el navegador recibe la página
```

Las consultas que no dependan unas de otras se ejecutarán en paralelo. Las pantallas tendrán estados de carga, vacío y error.

## Flujo de escritura

```text
La usuaria envía un formulario
  → una acción del servidor recibe los datos
  → se validan formato y reglas
  → la capa de datos escribe en Supabase
  → Next.js actualiza la pantalla afectada
  → se muestra confirmación o un error recuperable
```

La validación del navegador ayuda a la experiencia, pero la validación del servidor es obligatoria porque los datos del navegador no son confiables.

## Reglas arquitectónicas

- Las páginas no escribirán consultas de base de datos directamente.
- El acceso a datos estará centralizado por entidad o caso de uso.
- La lógica de negocio no dependerá del diseño visual.
- Los formularios usarán acciones del servidor para las operaciones internas.
- Las rutas de API se reservarán para integraciones externas, webhooks o necesidades que no resuelva una acción del servidor.
- Las entradas externas se validarán en tiempo de ejecución.
- Los errores técnicos se registrarán en el servidor; la pantalla recibirá mensajes seguros.
- Las operaciones repetidas accidentalmente deberán ser detectables o seguras.
- La transcripción original será inmutable para el procesamiento automático.

## Estructura prevista

```text
app/
  (app)/
    materias/
    clases/
    temas/
    estudiar/
    buscar/
  actions/
components/
  layout/
  forms/
  feedback/
features/
  subjects/
  classes/
  transcripts/
  topics/
  study-materials/
  flashcards/
  exams/
lib/
  validation/
  supabase/
  errors/
supabase/
  migrations/
```

Esta estructura es una guía. Solo se crearán carpetas cuando contengan código real; no se generarán archivos vacíos para anticipar fases futuras.

## Capas conceptuales

### Presentación

- páginas;
- componentes;
- formularios;
- estados de carga y error.

### Aplicación

- casos de uso;
- validaciones;
- permisos;
- coordinación de procesos.

### Dominio

- materias;
- clases;
- transcripciones;
- temas;
- materiales;
- flashcards;
- exámenes;
- progreso.

### Datos

- consultas;
- persistencia;
- migraciones;
- políticas de acceso.

### Integraciones

- inteligencia artificial;
- almacenamiento;
- servicios futuros.

## Límite entre capas

```text
Pantalla
  → caso de uso o acción
    → validación y regla de negocio
      → función de datos
        → Supabase
```

Una capa puede depender de la que está debajo, pero la función de datos no debe depender de un botón o una pantalla específica.

## Seguridad inicial

- secretos únicamente del lado servidor;
- validación de entradas;
- sanitización de contenido cuando aplique;
- límites de tamaño para transcripciones;
- protección contra acciones duplicadas;
- registro de errores sin exponer información sensible;
- políticas de acceso de Supabase antes de múltiples usuarios.
- claves públicas únicamente donde sean necesarias;
- claves privilegiadas exclusivamente en el servidor;
- Row Level Security en cualquier tabla expuesta por la API de datos;
- ninguna autorización basada en metadatos editables por la usuaria.

## IA

La IA no debe reemplazar el texto original.

Cada generación debe relacionarse con:

- fuente;
- versión del prompt;
- fecha;
- estado;
- contenido generado;
- posible edición manual.

Las respuestas estructuradas deberán validarse antes de guardarse.

La integración de IA se hará después de completar el flujo manual. Si el proveedor falla, la transcripción original y el material editado manualmente deben seguir disponibles.

## Evolución por fases

### Fase de interfaz

Las pantallas utilizarán datos temporales tipados para validar navegación y experiencia.

### Fase de persistencia

Se incorporarán el cliente de Supabase, variables de entorno y migraciones. Los datos temporales se reemplazarán por funciones centralizadas sin cambiar el diseño principal.

### Fase de IA

Las llamadas se ejecutarán únicamente en el servidor. Cada respuesta se validará y conservará junto con su fuente, versión y estado.

## Lo que no se usará inicialmente

- microservicios;
- colas distribuidas;
- Kubernetes;
- Docker obligatorio;
- event sourcing;
- múltiples bases de datos;
- servicios separados por función.

## Verificación prevista

Cada bloque implementado deberá pasar:

- revisión de criterios de aceptación;
- comprobación de TypeScript;
- lint;
- compilación de producción;
- prueba manual del flujo;
- revisión básica de accesibilidad;
- prueba de error y estado vacío;
- revisión de secretos antes de guardar cambios.

## Criterios de validación

La usuaria confirmó:

- que comprende la función del navegador, Next.js y Supabase;
- que Supabase será la fuente permanente de los datos;
- que secretos e IA permanecerán del lado servidor;
- que primero se probarán pantallas con datos temporales;
- que las tablas se diseñarán y aprobarán antes de crearlas;
- que la solución evita infraestructura innecesaria.

La siguiente etapa es validar `06-database-design.md`.
