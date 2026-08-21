# Paquetes editoriales

Esta carpeta recibe las clases que Codex prepara a partir de las
transcripciones de la administradora.

El inventario completo de módulos, clases, fuentes y bancos de práctica se
encuentra en [`curriculum-plan.md`](./curriculum-plan.md).

## Flujo

Las transcripciones originales viven en un archivo editorial privado, fuera de
Git y del entorno publicado. Configura `CENEVAL_TRANSCRIPTS_DIR` en
`.env.local` con la carpeta que contiene `AUDIO 01.txt` a `AUDIO 70.txt`. Los
paquetes históricos pueden conservar sus rutas antiguas: el cargador usa el
nombre del archivo dentro de la raíz configurada.

El procedimiento de respaldo y verificación está en
[`docs/TRANSCRIPT_ARCHIVE.md`](../docs/TRANSCRIPT_ARCHIVE.md).

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

## Contrato 1.1

Los paquetes nuevos deben usar `packageVersion: "1.1"` y declarar su lugar en
el plan y sus audios de origen. El código y el orden deben coincidir; el
validador rechaza códigos fuera de C01–C58, audios fuera de 01–70 y audios
repetidos dentro de la misma clase.

```json
{
  "packageVersion": "1.1",
  "curriculum": {
    "code": "C41",
    "order": 41,
    "audioSources": [
      { "audioNumber": 54, "fragment": "completo" },
      { "audioNumber": 55, "fragment": "primera parte" }
    ]
  }
}
```

El orden de `audioSources` se conserva en la vista de sesiones. El importador
comprueba que el código o el orden no pertenezcan a otra clase antes de crear
ningún registro; los índices únicos de PostgreSQL protegen también contra dos
importaciones simultáneas.

Los 40 paquetes vigentes C01–C40 ya usan el contrato 1.1. Las versiones
retiradas con contrato 1.0 viven fuera de `content/packages/`, en
`content/archive/withdrawn/`, y se conservan solo para trazabilidad: no deben
importarse ni convertirse silenciosamente en clases nuevas.

Cada paquete contiene:

- materia y clase;
- código y orden curricular;
- uno o más audios de origen, con descripción del fragmento;
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
