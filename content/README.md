# Paquetes editoriales

Esta carpeta recibe las clases que Codex prepara a partir de las
transcripciones de la administradora.

El inventario completo de módulos, clases, fuentes y bancos de práctica se
encuentra en [`curriculum-plan.md`](./curriculum-plan.md).

## Flujo

1. Guardar el paquete JSON en `content/packages`.
2. Validar:

   ```powershell
   npm run content:check -- content/packages/nombre.json
   ```

3. Importar como borrador:

   ```powershell
   npm run content:import -- content/packages/nombre.json
   ```

4. Abrir la ruta indicada por el importador.
5. Revisar cada tema.
6. La administradora confirma y se cambia el estado a `published`.

## Contrato 1.0

Cada paquete contiene:

- materia y clase;
- transcripción original y limpia;
- uno o más temas;
- los nueve tipos de material requeridos por tema;
- mapa conceptual con al menos tres nodos;
- referencias oficiales HTTPS;
- entre 10 y 15 flashcards;
- un examen de exactamente 10 preguntas;
- cuatro opciones y una respuesta correcta por pregunta;
- explicación general y de cada opción.

Si cualquier parte falta, el validador detiene la importación. Si una escritura
falla, el importador elimina la clase parcial mediante su relación en cascada.

## Regla de cobertura total

La transcripción es la fuente principal de la clase, no un texto que deba
reducirse a un resumen. Cada paquete debe:

- conservar íntegra la transcripción original;
- organizar todo concepto, explicación, ejemplo, distinción, procedimiento,
  advertencia y estrategia de examen explicados por el docente;
- incluir una guía de estudio intensiva por tema;
- incluir un mapa conceptual legible y creativo por tema;
- usar preguntas, casos y flashcards para practicar, nunca para sustituir la
  teoría;
- incluir un examen de diez reactivos por tema;
- cerrar con un examen final acumulativo cuando el módulo tenga varios temas;
- registrar cualquier fragmento no académico que se excluya de la copia
  didáctica; nunca omitir contenido académico silenciosamente.

Antes de publicar, la administradora comparará el paquete contra la
transcripción completa. La clase no estará terminada mientras exista una
explicación académica sin destino dentro de los temas.
