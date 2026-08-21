# Archivo editorial de transcripciones

Última actualización: 21 de agosto de 2026

## Decisión de arquitectura

Las transcripciones originales son evidencia editorial privada. No son el
producto que consume la estudiante ni una dependencia del entorno de ejecución.
La arquitectura objetivo presenta a la estudiante solamente materiales de
estudio aprobados: explicaciones, mapas, flashcards, reactivos, referencias
oficiales y metadatos de vigencia.

El importador actual todavía conserva una copia de la transcripción dentro del
modelo editorial de Supabase. Retirar esa copia requiere una migración separada
del esquema, del importador y de las vistas administrativas; hasta hacerla, no
se debe afirmar que Supabase contiene únicamente las dinámicas publicadas.

Los originales permiten auditar una transformación, corregir un material y
reconstruirlo. Por ello deben conservarse, pero:

- no se agregan a Git;
- no se despliegan en Vercel;
- no se cargan a Supabase mediante el verificador de archivo;
- no se copian al ejecutar el verificador;
- se mantienen en un archivo privado con al menos una segunda copia protegida.

Una suma SHA-256 demuestra que una copia conserva exactamente los mismos bytes.
No demuestra que el contenido jurídico sea correcto, no cifra el archivo y no
sustituye la revisión jurídica y editorial.

## Contrato del archivo

La carpeta contiene exactamente 70 archivos, desde `AUDIO 01.txt` hasta
`AUDIO 70.txt`. El manifiesto privado usa CSV UTF-8 con estas columnas y este
orden:

```csv
Name,Length,SHA256
AUDIO 01.txt,12345,0123456789ABCDEF...
```

`Length` es el tamaño en bytes, no el número de caracteres. `SHA256` contiene
64 dígitos hexadecimales. El manifiesto real contiene huellas del material
privado y vive junto al archivo editorial, fuera del repositorio. Este documento
y las pruebas sintéticas son el contrato versionado en Git.

## Verificación de solo lectura

Con dependencias instaladas, desde la raíz del repositorio:

```powershell
npx tsx scripts/verify-transcript-archive.ts `
  "C:\ruta\transcripciones-originales" `
  --manifest "C:\ruta\transcripciones-originales\manifest.sha256.csv"
```

También se puede evitar que la ruta quede escrita en el comando:

```powershell
$env:CENEVAL_TRANSCRIPTS_DIR = "C:\ruta\transcripciones-originales"
npx tsx scripts/verify-transcript-archive.ts `
  --manifest "$env:CENEVAL_TRANSCRIPTS_DIR\manifest.sha256.csv"
Remove-Item Env:CENEVAL_TRANSCRIPTS_DIR
```

Resultado esperado:

```text
Archivo íntegro: 70 transcripciones coinciden en tamaño y SHA-256.
```

El proceso termina con código 1 si falta un audio, aparece un audio fuera del
rango, hay nombres duplicados o cambia el tamaño o hash. Otros archivos de la
carpeta, incluido el propio manifiesto, se ignoran.

## Generación de un reporte

Sin `--manifest`, el script calcula el inventario y escribe el CSV en la salida
estándar. No crea archivos:

```powershell
npx tsx scripts/verify-transcript-archive.ts "C:\ruta\transcripciones-originales"
```

Para crear un manifiesto hay que autorizar explícitamente el destino con
`--output`:

```powershell
npx tsx scripts/verify-transcript-archive.ts `
  "C:\ruta\transcripciones-originales" `
  --output "C:\ruta-privada\manifest.sha256.csv"
```

Por seguridad, `--output` falla si el archivo ya existe. El script nunca copia,
mueve, renombra ni modifica las transcripciones.

## Prueba reproducible sin originales

La prueba usa 70 archivos sintéticos dentro del directorio temporal del sistema,
comprueba el formato CSV, altera un archivo y verifica que el cambio sea
detectado:

```powershell
npx tsx --test tests/transcript-archive.test.ts
```

No lee la memoria USB, el archivo editorial real, variables de Supabase ni la
red. Las carpetas temporales que crea la prueba se eliminan al terminar.

## Operación recomendada

1. Verificar el archivo principal contra su manifiesto privado.
2. Copiar el archivo mediante el procedimiento de respaldo autorizado.
3. Ejecutar el mismo verificador sobre la segunda copia y el mismo manifiesto.
4. Registrar fecha, responsable y resultado sin adjuntar transcripciones ni
   hashes a incidencias públicas.
5. Repetir la comprobación periódicamente y antes de una regeneración editorial.

El flujo queda separado de forma deliberada:

```text
transcripción privada → proceso editorial y revisión → materiales aprobados → app
```
