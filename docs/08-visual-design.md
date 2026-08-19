# Diseño visual

## Estado

**Aprobado por la usuaria el 2026-07-23.**

La documentación funcional y técnica fue aprobada el 2026-07-23.

## Objetivo

Crear una experiencia de estudio clara, tranquila y confiable para Derecho. La aplicación debe sentirse rigurosa sin parecer un portal gubernamental ni una plataforma escolar infantil.

## Personalidad

La interfaz será:

- **seria:** el contenido jurídico merece precisión;
- **cálida:** estudiar debe sentirse acompañante, no intimidante;
- **ordenada:** la relación materia → clase → tema siempre será visible;
- **enfocada:** cada pantalla tendrá una acción principal;
- **honesta:** distinguirá fuentes, contenido editado y futuras generaciones de IA.

Palabras guía: **claridad, confianza, progreso y calma**.

La experiencia de aprendizaje también será **activa y variada**. Esto se
conseguirá con casos, preguntas breves, bloques navegables y retroalimentación,
no con puntos, rachas, insignias o competencia.

## Dirección visual

Se usará una base clara inspirada en papel cálido, con azul tinta para estructura y verde como señal de avance. Los acentos serán moderados para que las transcripciones y explicaciones largas sean cómodas de leer.

Se evitarán:

- fondos blancos fríos en toda la pantalla;
- exceso de degradados;
- sombras intensas;
- colores neón;
- tarjetas para cada fragmento de texto;
- iconos sin etiqueta;
- lenguaje visual infantil.

## Colores

| Uso | Nombre | Valor | Propósito |
|---|---|---:|---|
| Fondo general | Papel | `#F7F5F0` | Lectura cálida y descansada |
| Superficie | Blanco cálido | `#FFFDF9` | Formularios y contenido principal |
| Texto principal | Tinta | `#172033` | Contraste y seriedad |
| Texto secundario | Pizarra | `#5B6474` | Información complementaria |
| Marca y acciones | Azul jurídico | `#243B64` | Navegación y botones principales |
| Marca activa | Azul profundo | `#192B4B` | Estados activos y hover |
| Progreso | Verde estudio | `#2F6B57` | Éxito, avance y temas aprobados |
| Acento suave | Salvia | `#DCE9E2` | Fondos de progreso |
| Atención | Ámbar | `#A36316` | Pendientes y advertencias |
| Error | Rojo sobrio | `#A23B3B` | Errores y acciones destructivas |
| Bordes | Piedra | `#DED9CF` | Separación sin ruido |

Los colores de estado siempre estarán acompañados por texto o icono; nunca serán la única señal.

## Tipografía

- **Títulos principales:** Anton.
- **Interfaz, datos y contadores:** Montserrat.
- **Texto de lectura:** Montserrat con ancho de línea limitado.

Jerarquía:

- título de página: 32–40 px, peso 650;
- encabezado de sección: 22–24 px, peso 600;
- título de tarjeta: 17–18 px, peso 600;
- cuerpo: 16 px, altura de línea 1.6;
- texto auxiliar: 14 px;
- etiquetas: 13–14 px, peso 600.

Las explicaciones largas tendrán un máximo aproximado de 72 caracteres por línea.

## Espaciado y forma

- Unidad base: 4 px.
- Separación común: 8, 12, 16, 24, 32 y 48 px.
- Radio de controles: 10 px.
- Radio de paneles: 16 px.
- Bordes finos y sombras muy suaves.
- Área táctil mínima: 44 × 44 px.
- Ancho máximo del contenido: 1200 px.

## Estructura general

### Escritorio

```text
┌──────────────┬─────────────────────────────────────────┐
│ CENEVAL      │ Encabezado: contexto + acción principal │
│ Study App    ├─────────────────────────────────────────┤
│              │                                         │
│ Inicio       │ Contenido de la página                  │
│ Materias     │                                         │
│ Estudiar     │                                         │
│ Buscar       │                                         │
│              │                                         │
└──────────────┴─────────────────────────────────────────┘
```

La barra lateral tendrá 240 px aproximadamente y permanecerá visible. La acción principal aparecerá arriba a la derecha cuando corresponda.

### Móvil

```text
┌─────────────────────────┐
│ Título            Acción│
├─────────────────────────┤
│                         │
│ Contenido               │
│                         │
├─────────────────────────┤
│ Inicio Materias Estudiar│
│          Buscar         │
└─────────────────────────┘
```

La navegación inferior será fija y tendrá icono más etiqueta. Los formularios usarán una sola columna.

## Componentes principales

### Botones

- **Primario:** fondo azul jurídico, texto claro.
- **Secundario:** superficie clara, borde piedra.
- **Texto:** para acciones de baja prioridad.
- **Destructivo:** rojo sobrio y confirmación previa.

Los textos describirán la acción: **Guardar materia**, no solamente **Aceptar**.

### Campos

- etiqueta siempre visible;
- ayuda opcional debajo de la etiqueta;
- borde azul al recibir foco;
- error junto al campo;
- texto escrito preservado después de errores recuperables.

### Tarjeta de materia

Mostrará:

- nombre;
- descripción breve;
- cantidad de clases;
- cantidad de temas;
- acción **Abrir materia**.

Toda la tarjeta podrá abrirse, pero conservará un indicador de foco visible.

### Indicadores de estado

- Pendiente: ámbar y texto **Pendiente**.
- Aprobado: verde y texto **Aprobado**.
- En proceso: azul y texto **En proceso**.
- Error: rojo y explicación.

### Migas de navegación

En pantallas profundas:

```text
Materias / Derecho constitucional / Clase 4 / Amparo
```

Cada nivel anterior será navegable.

## Pantalla de Inicio

### Con datos

```text
Buenos días
Continúa tu preparación para el CENEVAL

┌───────────────────────────────┐
│ Siguiente paso                │
│ Revisa los temas de Clase 4   │
│                 [Continuar]   │
└───────────────────────────────┘

Materias recientes
┌────────────────┐ ┌────────────────┐
│ Constitucional │ │ Derecho penal  │
│ 4 clases       │ │ 2 clases       │
└────────────────┘ └────────────────┘
```

### Sin datos

```text
Tu preparación comienza aquí

Organiza tus clases por materia y conserva
cada transcripción en un solo lugar.

[Crear mi primera materia]
```

No se mostrarán gráficas vacías ni métricas con cero.

## Pantalla de Materias

```text
Mis materias                         [Nueva materia]
Organiza tus clases por área de Derecho.

[Buscar materias]

┌──────────────────────┐  ┌──────────────────────┐
│ Derecho              │  │ Derecho penal        │
│ constitucional       │  │                      │
│ 4 clases · 12 temas  │  │ 2 clases · 5 temas   │
│ [Abrir materia]      │  │ [Abrir materia]      │
└──────────────────────┘  └──────────────────────┘
```

En móvil, las tarjetas se mostrarán en una sola columna y **Nueva materia** permanecerá cerca del título.

## Formulario de nueva materia

Se presentará como página completa para que funcione igual en escritorio y móvil:

```text
Nueva materia

Nombre *
[ Derecho constitucional              ]

Descripción
[ Principios, derechos y amparo...     ]

[Guardar materia]  [Cancelar]
```

El foco inicial estará en el nombre. Al guardar correctamente abrirá el detalle de la materia.

## Estados

### Carga

Usará formas suaves que reproduzcan la estructura próxima a aparecer. No bloqueará toda la aplicación si solo carga una sección.

### Vacío

Incluirá:

- qué falta;
- para qué sirve crearlo;
- una acción concreta.

### Error

Usará un panel con título, explicación sencilla y **Intentar nuevamente**. No mostrará trazas técnicas.

### Éxito

Mostrará una confirmación breve, por ejemplo: **Materia guardada**, y continuará al siguiente paso.

## Accesibilidad

- Contraste mínimo WCAG AA.
- Foco visible en enlaces, botones y campos.
- Navegación completa por teclado.
- HTML semántico.
- Etiquetas asociadas con sus campos.
- Mensajes de error anunciables.
- Movimiento reducido cuando el sistema lo solicite.
- Ninguna acción dependerá solamente del color o de pasar el cursor.

## Alcance de la Entrega 1A

Este diseño se aplicará primero a:

- layout general;
- navegación de escritorio y móvil;
- Inicio con estado vacío y con datos;
- lista de materias;
- formulario de nueva materia;
- componentes de botón, campo, tarjeta y mensajes.

Las pantallas de clases, transcripciones y temas reutilizarán el mismo sistema en las siguientes entregas.

## Criterios de validación

La usuaria confirmó:

- personalidad seria, cálida y clara;
- paleta papel, azul tinta y verde;
- navegación lateral en escritorio e inferior en móvil;
- estructura propuesta para Inicio;
- tarjetas y formulario de Materias;
- legibilidad y jerarquía visual.

La Entrega 1A implementa este sistema visual.
