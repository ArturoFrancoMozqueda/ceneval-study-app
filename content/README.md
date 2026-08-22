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

3. Importar como borrador únicamente cuando el paquete 1.2 pase el gate:

   ```powershell
   npm run content:import -- content/packages/nombre.json
   ```

4. Abrir la ruta indicada por el importador.
5. Revisar cada tema.
6. La administradora confirma y se cambia el estado a `published`.

## Contrato editorial

El contrato publicable vigente es `packageVersion: "1.2"`. Además de declarar
su lugar en el plan y sus audios de origen, registra evidencias estables para
materiales, mapa, recorrido, flashcards y cada parte de los reactivos. Una
evidencia apunta a un fragmento localizable de la transcripción privada o a una
fuente oficial con localizador y fechas de consulta y verificación.

```json
{
  "packageVersion": "1.2",
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

Los 54 paquetes C01–C54 usan el contrato 1.2 y pasan el gate local de evidencia
por dinámica. Ese resultado no equivale a importación, revisión ni publicación
remotas: esas operaciones requieren autorización y el flujo editorial. Las
versiones retiradas 1.0 viven en `content/archive/withdrawn/` y no son
importables.

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
- tres o cuatro opciones y una respuesta correcta por pregunta;
- explicación general y de cada opción.

Si cualquier parte o evidencia falta, el validador detiene el flujo. El
importador acepta exclusivamente paquetes 1.2 validados y delega toda la
escritura a una sola RPC transaccional; 1.0 y 1.1 fallan antes de cualquier
llamada remota. La importación real requiere aplicar primero la migración en un
proyecto de ensayo autorizado.

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
