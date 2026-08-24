# Visión del producto

## Nombre

**Sube Legal** es el nombre comercial definitivo, decidido el 22 de agosto de
2026 (`docs/PROJECT_STATUS.md` §4, decisión D-9). Se descartó cualquier nombre
que incluyera "CENEVAL" o "EGEL" por ser marcas de un tercero. "CENEVAL Study
App" sigue siendo el nombre técnico interno del repositorio y del proyecto en
Vercel/Supabase, pero de cara a la usuaria la marca es Sube Legal.

## Resumen

Sube Legal será una aplicación de estudio enfocada inicialmente en personas egresadas de Derecho que desean prepararse para el examen CENEVAL como modalidad de titulación.

La aplicación ofrecerá una biblioteca de clases transformadas previamente en
material de estudio organizado, completo y personalizado.

## Modelo editorial aprobado

La administradora entrega las transcripciones al equipo editorial asistido por
Codex. Cada transcripción se convierte en un paquete completo, se importa como
borrador, se revisa y solo entonces se publica. Los estudiantes no necesitan
organizar ni generar el contenido.

```text
transcripción → preparación editorial → borrador → revisión → publicación
```

Los estudiantes crean una cuenta para consultar todo el contenido publicado y
conservar su progreso individual.

## Usuarios principales

La primera versión estará dirigida a:

- personas egresadas de Derecho;
- personas que buscan titularse mediante el CENEVAL;
- estudiantes que necesitan organizar clases y temas;
- personas que necesitan explicaciones claras desde cero;
- estudiantes que no saben qué estudiar ni qué repasar.

En fases posteriores podrá incluir:

- múltiples estudiantes;
- profesores;
- otras carreras;
- otros exámenes.

## Problema principal

Los estudiantes suelen enfrentar:

- audios, transcripciones y apuntes dispersos;
- dificultad para volver a encontrar un tema;
- falta de una guía clara;
- desconocimiento de los temas dominados;
- incertidumbre sobre qué repasar;
- explicaciones demasiado complejas;
- poca práctica con preguntas tipo examen;
- ausencia de seguimiento del progreso.

## Propuesta de valor

La administradora proporciona la transcripción y el proceso editorial la
convierte en un paquete completo de estudio antes de publicarlo.

Ese paquete podrá incluir:

- transcripción limpia;
- materia;
- clase;
- temas;
- conceptos;
- explicación breve;
- explicación completa;
- ejemplos sencillos;
- ejemplos tipo CENEVAL;
- resúmenes;
- tablas comparativas;
- errores comunes;
- palabras clave;
- reglas mnemotécnicas;
- flashcards;
- mini exámenes;
- retroalimentación;
- recomendaciones de repaso.

## Modelo de negocio (decidido, no implementado aún)

Decidido el 22 de agosto de 2026 (`docs/PROJECT_STATUS.md` §4, D-2 a D-6).
Fija el destino; no autoriza por sí solo a abrir cobro real, que sigue
esperando la Fase 6 de `docs/SUBSCRIPTION_ARCHITECTURE.md`.

- **Una sola suscripción**, $399 MXN/mes, con acceso a la biblioteca completa
  (57 clases, materiales, mapas conceptuales, flashcards y exámenes). No hay
  planes distintos por nivel ni por materia.
- **Progresión por niveles** como mecánica de experiencia de uso: la
  estudiante avanza de nivel al completar el examen del nivel actual. Es
  gamificación de estudio, no segmentación de precio.
- **Sin periodo de prueba gratuito.** En su lugar, una vista de muestra
  gratuita permanente (`/muestra`, una clase completa sin examen).
- Cancelación sin corte inmediato (se conserva el acceso hasta el fin del
  periodo pagado) y sin reembolso de la parte no usada. El progreso académico
  de la estudiante nunca se borra al cancelar.
- Proveedor de pagos: **Stripe**, cuenta contractual en México.

## Flujo principal

1. La administradora proporciona una transcripción a Codex.
2. La aplicación conserva el texto original.
3. La aplicación genera una versión limpia.
4. Se identifica o selecciona la materia.
5. Se detectan los temas.
6. Codex prepara la organización y el material completo.
7. La administradora revisa y aprueba la publicación.
8. El estudiante encuentra la clase lista, estudia y practica.
9. La aplicación guarda resultados.
10. Se detectan temas débiles.
11. La aplicación recomienda qué estudiar después.

## Principios del producto

- Explicar desde cero.
- No sacrificar claridad por brevedad.
- Conservar la fuente original.
- Permitir editar el contenido generado.
- Diferenciar contenido de la clase y explicación complementaria.
- No presentar la IA como una autoridad jurídica infalible.
- Ayudar a comprender, practicar y decidir qué estudiar.
- Diseñar para una experiencia sencilla antes de agregar automatización compleja.
- Proteger el contenido pagado sin estorbar el estudio: sin selección ni
  copiado de texto en las vistas de estudio, disuasión de captura de pantalla,
  sin exportación ni descarga masiva del catálogo (`docs/CONTENT_PROTECTION.md`).

## Alcance de la primera versión

La primera versión se enfocará en CENEVAL de Derecho y una sola usuaria.

Incluirá:

- materias;
- clases;
- temas;
- transcripciones conservadas y validadas en el archivo editorial privado;
- material de estudio;
- flashcards;
- mini exámenes;
- resultados;
- búsqueda;
- detección básica de temas débiles.

## Fuera del alcance inicial

El cobro real ya no está fuera del alcance del producto — está diseñado (ver
"Modelo de negocio" arriba) pero pendiente de implementar, y no se activa
hasta cerrar las Fases 1 a 3 de `docs/PROJECT_STATUS.md` §5. Sigue fuera del
alcance de esta primera versión operativa:

- carga directa de audio;
- transcripción automática;
- profesores;
- carga autónoma de contenido por estudiantes;
- aplicación móvil;
- otras carreras;
- grupos de estudio;
- colaboración en tiempo real.

## Resultado ideal

La estudiante puede abrir una clase editorial publicada, estudiar, responder
preguntas y recibir una recomendación clara sobre el siguiente tema a repasar,
sin cargar ni consultar la transcripción privada.

## Métricas iniciales de éxito

La primera versión será útil cuando el usuario pueda:

1. crear una materia;
2. guardar una clase;
3. conservar la trazabilidad mediante evidencia y localizadores;
4. consultar las fuentes públicas del material;
5. organizar sus temas;
6. estudiar una explicación;
7. practicar con flashcards;
8. completar un mini examen;
9. consultar sus errores;
10. identificar qué debe repasar.
