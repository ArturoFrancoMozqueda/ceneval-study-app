# Roadmap

## Reordenamiento aprobado

El producto pasa a una biblioteca editorial. Autenticación, publicación,
material, mapas, flashcards, exámenes y progreso forman una sola entrega
integrada. La generación automática con OpenAI se pospone.

### Entrega editorial integrada

1. migración y RLS;
2. registro, sesión y roles;
3. importador de paquetes;
4. vista previa y publicación;
5. lección completa;
6. flashcards, exámenes y progreso;
7. primera clase real preparada por Codex y aprobada por la administradora.

**Criterio de salida:** una transcripción real termina publicada como paquete
completo y dos cuentas de estudiante no pueden compartir datos de progreso.

## Principio

Construir primero el flujo central sin depender de inteligencia artificial.

Cada fase debe producir un resultado visible, verificable y comprensible. No se considerará terminada únicamente porque el código compile.

## Fase 0: Documentación

- visión;
- requisitos;
- historias;
- navegación;
- arquitectura;
- base de datos;
- decisiones;
- roadmap.

**Estado:** completada y aprobada por la usuaria el 2026-07-23.

### Resultado

Una descripción coherente de qué se construirá, cómo se navegará, dónde vivirá cada responsabilidad y qué datos se conservarán.

### Criterio de salida

- historias aprobadas;
- navegación aprobada;
- arquitectura aprobada;
- diseño de datos aprobado;
- roadmap aprobado.

Al aprobar este documento, la fase 0 quedará terminada.

## Fase 0.5: Diseño visual

**Estado:** completada y aprobada por la usuaria el 2026-07-23.

- personalidad visual;
- colores y tipografía;
- componentes principales;
- diseño de escritorio y móvil;
- estados vacío, carga, error y éxito;
- prototipo de inicio, materias y detalle de clase.

### Resultado

Una guía visual pequeña y suficiente para implementar pantallas coherentes.

### Criterio de salida

- navegación principal reconocible;
- contraste y foco accesibles;
- formularios legibles;
- aprobación de la usuaria.

## Fase 1: Fundamentos de interfaz

- layout;
- navegación;
- dashboard básico;
- materias;
- clases;
- estados vacíos;
- formularios;
- datos temporales en memoria.

### Entrega 1A

- layout adaptable;
- navegación principal;
- inicio;
- lista de materias;
- formulario de nueva materia;
- estados vacíos.

**Estado:** completada y aprobada por la usuaria el 2026-07-23.

### Entrega 1B

- detalle de materia;
- formulario de nueva clase;
- detalle de clase;
- navegación de regreso.

**Estado:** completada y aprobada por la usuaria el 2026-07-23.

### Entrega 1C

- pantalla para pegar transcripción;
- revisión de temas;
- detalle básico de tema;
- centro de estudio y búsqueda visual.

**Estado:** completada y aprobada por la usuaria el 2026-07-23.

### Criterio de salida

- el flujo completo puede recorrerse con datos temporales;
- funciona en escritorio y móvil;
- formularios muestran validaciones;
- existen estados vacío, carga y error;
- lint y compilación terminan correctamente;
- la usuaria aprueba la experiencia.

**Estado de la fase:** completada el 2026-07-23.

## Fase 2: Persistencia

- proyecto de Supabase;
- variables de entorno;
- esquema inicial;
- migraciones;
- conexión desde Next.js;
- guardar materias;
- guardar clases;
- guardar transcripciones;
- validaciones.

### Entrega 2A

- proyecto y variables de entorno;
- cliente de servidor;
- migración de `subjects`, `classes`, `transcripts` y `topics`;
- restricciones, índices y seguridad.

**Estado:** completada el 2026-07-23.

### Entrega 2B

- reemplazar datos temporales;
- guardar y consultar materias;
- guardar y consultar clases;
- guardar la transcripción original;
- crear y aprobar temas manualmente.

### Criterio de salida

- los datos permanecen después de recargar;
- la transcripción original no se sobrescribe;
- entradas inválidas son rechazadas;
- migraciones se reproducen correctamente;
- consultas e índices se verifican;
- no existen secretos en el navegador o repositorio.

## Fase 3: Organización académica

- temas manuales;
- orden de temas;
- edición;
- eliminación segura;
- búsqueda básica.

### Criterio de salida

- los temas pueden crearse, ordenarse y encontrarse;
- editar o eliminar explica su impacto;
- la búsqueda abre el resultado correcto.

## Fase 4: Material sin IA

- estructura de material;
- edición manual;
- secciones;
- relación con fuentes;
- visualización.

### Criterio de salida

- cada tema admite secciones manuales;
- el contenido puede editarse;
- la fuente original está disponible;
- una sección no sobrescribe otra.

## Fase 5: Inteligencia artificial

- proveedor;
- prompts versionados;
- salida estructurada;
- limpieza de transcripción;
- detección de temas;
- generación de explicaciones;
- generación de resúmenes;
- manejo de errores;
- límites y costos.

### Criterio de salida

- la IA se ejecuta solo en el servidor;
- la salida se valida antes de guardar;
- el original permanece intacto;
- cada generación conserva fuente y versión;
- los errores permiten reintentar;
- existe un límite de uso o costo.

## Fase 6: Flashcards

- generación;
- edición;
- sesión de estudio;
- revisiones;
- clasificación de dificultad.

### Criterio de salida

- la pregunta aparece antes de la respuesta;
- las tarjetas pueden revisarse y editarse;
- cada revisión se conserva;
- la sesión funciona con teclado y pantalla táctil.

## Fase 7: Exámenes

- generación;
- preguntas y opciones;
- intentos;
- calificación;
- explicaciones;
- historial.

### Criterio de salida

- las respuestas correctas permanecen ocultas durante el intento;
- la calificación es reproducible;
- se explican opciones correctas e incorrectas;
- repetir no elimina intentos anteriores.

## Fase 8: Progreso

- temas débiles;
- temas dominados;
- errores recurrentes;
- recomendaciones;
- dashboard.

### Criterio de salida

- el cálculo usa actividad real;
- los umbrales débil, en proceso y dominado se prueban;
- cada recomendación explica por qué se muestra.

## Fase 9: Calendario y tutor

- sesiones;
- repasos;
- tutor contextual;
- evaluación de comprensión.

Esta fase se dividirá en calendario y tutor para evitar implementar dos funciones grandes al mismo tiempo.

## Fase 10: Calidad y despliegue

- pruebas;
- accesibilidad;
- seguridad;
- rendimiento;
- observabilidad;
- Vercel;
- documentación de uso.

### Criterio de salida

- flujos centrales probados;
- revisión de accesibilidad y seguridad;
- compilación de producción exitosa;
- variables configuradas en el entorno de despliegue;
- despliegue aprobado por la usuaria;
- guía de uso actualizada.

## Futuro

- múltiples usuarios;
- autenticación completa;
- audio;
- transcripción automática;
- profesores;
- otras carreras;
- móvil;
- pagos.

## Regla

No iniciar una fase solo porque resulta atractiva. Debe cumplirse la definición de terminado de la fase anterior o existir una decisión documentada que justifique el cambio.

## Verificación de cada entrega

1. Revisar las historias relacionadas.
2. Implementar el cambio mínimo.
3. Probar el flujo normal.
4. Probar entradas vacías y errores.
5. Revisar escritorio y móvil.
6. Ejecutar lint y compilación.
7. Actualizar documentación y estado.
8. Mostrar el resultado a la usuaria.

## Próxima acción

El roadmap fue aprobado por la usuaria el 2026-07-23. La siguiente acción es:

1. definir la personalidad visual;
2. crear una guía pequeña de colores, tipografía y componentes;
3. diseñar la pantalla de inicio y materias;
4. solicitar aprobación;
5. comenzar la Entrega 1A.
