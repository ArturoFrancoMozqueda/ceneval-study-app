# Navegación y pantallas

## Navegación aprobada para la biblioteca

### Rutas públicas de autenticación

- `/iniciar-sesion`
- `/registro` (aviso de acceso por invitación; no captura datos ni crea cuentas)
- `/recuperar-contrasena`
- `/auth/confirm`

### Ruta autenticada previa al estudio

- `/aceptar-terminos` (paso autenticado aislado; el catálogo permanece cerrado
  por RLS hasta registrar la aceptación)

### Rutas del estudiante autenticado

- `/`: biblioteca reciente y progreso;
- `/materias`: materias con contenido publicado;
- `/materias/[subjectId]`: clases publicadas;
- `/clases/[classId]`: ruta de temas;
- `/temas/[topicId]`: lección con Aprender, Mapa, Guía, Flashcards, Examen y
  Fuente;
- `/estudiar`: actividad y temas disponibles;
- `/buscar`: búsqueda dentro de temas publicados.

### Rutas administrativas

- `/administrar`: estado editorial de todas las clases;
- `/administrar/clases/[classId]`: vista previa y publicación;
- las rutas de creación y temas quedan limitadas al rol administrador; no
  existe una ruta web de captura o lectura de transcripciones.

## Estado

**Aprobado por la usuaria el 2026-07-23.**

Las historias de usuario y el alcance de la primera entrega fueron aprobados el 2026-07-23.

## Objetivo

Definir una navegación sencilla para que una persona pueda pasar de una transcripción al estudio y la práctica sin perderse.

## Principios

- Mostrar una acción principal clara en cada pantalla.
- Usar palabras conocidas por el estudiante, no términos técnicos.
- Mantener visible la relación materia → clase → tema.
- Conservar acceso a la fuente original desde el material generado.
- Diseñar primero para escritorio y adaptar las mismas acciones a móvil.
- Incluir estados vacíos, de carga y error desde la primera entrega.
- No mostrar calendario, tutor ni progreso avanzado hasta su fase correspondiente.

## Navegación principal

La primera entrega tendrá cuatro destinos principales:

1. **Inicio:** resumen y siguiente acción recomendada.
2. **Materias:** organización de materias y clases.
3. **Estudiar:** acceso a temas, flashcards y exámenes disponibles.
4. **Buscar:** búsqueda global de contenido.

En escritorio aparecerán en una barra lateral. En móvil aparecerán en una barra inferior; las acciones menos frecuentes estarán en un menú adicional.

## Mapa aprobado para revisión

```text
Inicio
├── Materias
│   ├── Nueva materia
│   └── Detalle de materia
│       ├── Nueva clase
│       └── Detalle de clase
│           ├── Transcripción
│           └── Temas
│               └── Detalle de tema
│                   ├── Material
│                   ├── Flashcards
│                   └── Mini examen
├── Estudiar
│   ├── Temas disponibles
│   ├── Sesión de flashcards
│   └── Mini examen
└── Buscar
    └── Resultado
```

## Rutas

| Ruta | Pantalla | Acción principal |
|---|---|---|
| `/` | Inicio | Continuar estudiando o crear la primera materia |
| `/materias` | Lista de materias | Crear materia |
| `/materias/nueva` | Nueva materia | Guardar materia |
| `/materias/[materiaId]` | Detalle de materia | Crear clase |
| `/materias/[materiaId]/clases/nueva` | Nueva clase | Guardar clase |
| `/clases/[claseId]` | Detalle de clase | Abrir temas o revisión editorial |
| `/clases/[claseId]/temas` | Temas detectados | Aprobar temas |
| `/temas/[temaId]` | Detalle de tema | Estudiar material |
| `/temas/[temaId]/flashcards` | Flashcards | Iniciar sesión |
| `/temas/[temaId]/examen` | Configurar mini examen | Comenzar examen |
| `/examenes/[examenId]/intento` | Resolver examen | Entregar respuestas |
| `/examenes/intentos/[intentoId]` | Resultado | Revisar explicaciones |
| `/estudiar` | Centro de estudio | Elegir tema o actividad |
| `/buscar` | Búsqueda | Abrir resultado |

Los identificadores entre corchetes representan el elemento que se está consultando. Por ejemplo, `[temaId]` permite abrir un tema específico.

## Pantallas de la primera entrega

### 1. Inicio

Debe mostrar:

- saludo y propósito de la aplicación;
- botón **Crear mi primera materia** cuando no existan datos;
- acceso a materias recientes;
- actividad pendiente cuando ya exista contenido;
- acceso visible a búsqueda.

### 2. Lista de materias

Debe mostrar:

- título **Mis materias**;
- tarjetas con nombre, descripción y cantidad de clases;
- botón **Nueva materia**;
- mensaje educativo cuando la lista esté vacía.

### 3. Nueva materia

Debe incluir:

- nombre obligatorio;
- descripción opcional;
- botones **Guardar materia** y **Cancelar**;
- error visible si el nombre está vacío;
- protección contra envíos duplicados.

### 4. Detalle de materia

Debe mostrar:

- nombre y descripción;
- lista de clases;
- botón **Nueva clase**;
- cantidad de temas disponibles;
- estado vacío que explique cómo registrar la primera clase.

### 5. Nueva clase

Debe incluir:

- materia seleccionada;
- título obligatorio;
- fecha, profesor y descripción opcionales;
- botones **Guardar clase** y **Cancelar**.

Después de guardar, debe abrir el detalle de la clase.

### 6. Detalle de clase

Debe mostrar:

- título, materia y datos de la clase;
- audios y fragmentos editoriales declarados;
- lista de temas;
- acción principal según el avance:
  - **Revisar temas** si el paquete está en preparación;
  - **Estudiar temas** si fueron aprobados.

### 7. Evidencia editorial

La transcripción completa permanece fuera de la aplicación. Administración
consulta en el paquete local los rangos usados y, en la app, revisa únicamente
las dinámicas, referencias públicas y metadatos de vigencia.

### 8. Revisión de temas

Debe mostrar cada propuesta con:

- nombre;
- descripción;
- estado pendiente, aprobado o rechazado;
- acciones **Aprobar**, **Editar** y **Rechazar**;
- botón **Continuar con temas aprobados**.

### 9. Detalle de tema

Debe mantener visibles la materia y la clase de origen. Tendrá secciones para:

- respuesta breve;
- explicación completa;
- ejemplo cotidiano;
- ejemplo tipo CENEVAL;
- resumen;
- fuente original.

El contenido podrá editarse. Desde esta pantalla se podrá abrir flashcards o mini examen.

### 10. Sesión de flashcards

Debe mostrar:

- una pregunta a la vez;
- botón **Mostrar respuesta**;
- avance actual, por ejemplo `3 de 10`;
- botón para pasar a la siguiente tarjeta.

La respuesta nunca aparecerá antes de que la usuaria la solicite.

### 11. Mini examen

Antes de comenzar permitirá seleccionar dificultad y cantidad de preguntas.

Durante el intento debe mostrar:

- una pregunta y sus opciones;
- avance;
- selección actual;
- botón para continuar;
- confirmación antes de entregar.

El resultado mostrará porcentaje, aciertos, errores y explicación de cada opción. Las respuestas correctas no se mostrarán antes de finalizar.

### 12. Buscar

Debe incluir:

- campo de búsqueda;
- resultados agrupados por materia, clase, tema o contenido;
- fragmento que explique por qué coincide;
- enlace al contenido correspondiente;
- mensaje claro cuando no existan resultados.

## Flujo principal

```text
Preparar paquete editorial con la transcripción privada
  → validar evidencia y localizadores
  → importar proyección sin texto como borrador
  → revisar y aprobar temas
  → abrir material de un tema
  → estudiar flashcards
  → resolver mini examen
  → revisar errores
```

Cada pantalla debe indicar cuál es el siguiente paso, pero también permitir volver a la materia o clase anterior.

## Estados compartidos

### Vacío

Explicará qué falta y ofrecerá una sola acción directa. No mostrará únicamente “No hay datos”.

### Carga

Mostrará una estructura temporal de la pantalla y desactivará acciones duplicadas.

### Error

Explicará en lenguaje sencillo qué no se pudo completar y permitirá intentar nuevamente sin perder el texto escrito cuando sea posible.

### Éxito

Confirmará qué se guardó y llevará al siguiente paso lógico.

## Navegación móvil

- Barra inferior con **Inicio**, **Materias**, **Estudiar** y **Buscar**.
- Encabezado compacto con botón para volver.
- Formularios en una sola columna.
- Acciones principales visibles sin depender de pasar el cursor.
- Botones y opciones con tamaño suficiente para uso táctil.
- Transcripciones y explicaciones largas con lectura cómoda, sin desplazamiento horizontal.

## Pantallas pospuestas

No forman parte de la primera implementación:

- progreso detallado;
- calendario;
- tutor de IA;
- edición y eliminación avanzada;
- autenticación;
- administración de múltiples usuarios;
- carga de audio.

## Criterios de validación

La usuaria confirmó:

- que puede anticipar dónde crear una materia y una clase;
- que entiende que las transcripciones se conservan fuera de la app;
- que el paso de clase a tema y material es claro;
- que flashcards y examen son fáciles de encontrar;
- que la búsqueda está en un lugar esperado;
- que no falta una pantalla esencial para la primera entrega.

La siguiente etapa es validar `05-system-architecture.md`.
