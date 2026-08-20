# Respaldo lógico de Supabase

Última actualización: 20 de agosto de 2026

> **Estado actual:** existe un procedimiento reproducible y una prueba local
> de integridad. **No se generó ni se comprobó un respaldo real de producción**
> durante su implementación porque no había credenciales ni autorización para
> conectarse. La tarea operativa sigue pendiente hasta completar los pasos de
> generación, copia externa y restauración de ensayo.

## Qué protege este procedimiento

La CLI de Supabase genera tres archivos SQL siguiendo el procedimiento oficial:

- `roles.sql`: roles del clúster que la CLI permite exportar;
- `schema.sql`: esquema de la base;
- `data.sql`: datos mediante sentencias `COPY`;
- `manifest.json`: versión de CLI, fecha UTC, tamaños y sumas SHA-256.

Las sumas comprueban integridad, no confidencialidad. El directorio puede
contener cuentas, progreso, contenido y respuestas de examen. Está excluido de
Git y debe tratarse como información privada.

Este respaldo lógico **no incluye los archivos almacenados en Supabase
Storage**, aunque pueda incluir metadatos de la base. Tampoco sustituye una
copia de variables, configuración de Auth/Vercel, secretos, dominios ni otros
servicios de plataforma. Esos elementos requieren inventarios y respaldos
separados. Se excluyen además las tablas internas de Vector Buckets recomendadas
por Supabase (`storage.buckets_vectors` y `storage.vector_indexes`).

## 1. Comprobación local segura

Desde la raíz del repositorio:

```powershell
npm ci
npm run test:backup
```

La prueba crea SQL sintético en el directorio temporal del sistema, acepta el
conjunto íntegro, altera una copia y comprueba que el verificador la rechace.
No lee variables de entorno, no usa Supabase y elimina solo su propio directorio
temporal.

Para verificar una exportación que ya existe:

```powershell
npm run backup:verify -- -BackupDirectory "C:\ruta\al\respaldo"
```

Un resultado correcto confirma presencia, tamaño y SHA-256 de los tres SQL. No
demuestra que el contenido pueda restaurarse: esa prueba se hace aparte en un
proyecto desechable.

## 2. Generación autorizada

Requisitos:

1. autorización expresa de la responsable de producción;
2. Node.js y dependencias instaladas con `npm ci`;
3. Docker Desktop activo, requerido por `supabase db dump`;
4. sesión autenticada de la CLI y proyecto correcto enlazado previamente con
   `npm exec supabase -- link` por una persona autorizada;
5. espacio local cifrado suficiente.

Revisa el proyecto enlazado en el Dashboard antes de continuar. El script solo
comprueba que exista el enlace local y deliberadamente no imprime su
identificador.

El único comando que inicia la lectura remota es:

```powershell
npm run backup:supabase -- -ConfirmProduction
```

Sin `-ConfirmProduction` el script se detiene antes de invocar la CLI. Usa
`--linked`; no acepta una URL, contraseña o clave como argumento y no activa
registros de depuración. La CLI está fijada a una versión exacta en
`package-lock.json`.

El resultado queda en `backups/supabase/AAAAmmddTHHMMSSZ/`. Si una fase falla,
se conserva un directorio `.partial` para diagnóstico y nunca se presenta como
respaldo terminado. No adjuntes esos archivos a incidencias ni los subas al
repositorio.

Después de generarlo:

1. ejecuta `backup:verify` sobre el directorio final;
2. copia el directorio cifrado a una ubicación independiente del equipo;
3. ejecuta `backup:verify` sobre esa segunda copia;
4. registra fecha, responsable, ubicación lógica y resultado, pero nunca
   credenciales ni contenido SQL;
5. conserva al menos la última copia mensual y las cuatro semanales más
   recientes, sujeto a la política de privacidad que adopte el proyecto.

Frecuencia inicial recomendada: semanal y antes/después de cada publicación o
migración relevante. Debe revisarse cuando el proyecto entre en producción
formal.

## 3. Restauración manual y separada

La restauración es destructiva para el destino y **no está automatizada**. No
debe ejecutarse sobre producción. Primero crea un proyecto Supabase nuevo y
vacío, verifica que no contenga información que deba conservarse y obtiene una
autorización específica para la prueba.

Para evitar secretos en argumentos o historial, configura fuera del repositorio:

- un archivo PostgreSQL service (`PGSERVICEFILE`) con un alias como
  `ceneval-restore`, host, puerto, base, usuario y `sslmode=require`;
- un archivo de contraseñas (`PGPASSFILE`) con permisos restringidos a la
  cuenta local.

Tras inspeccionar los SQL y confirmar por segunda vez que el alias apunta al
proyecto de ensayo, una persona autorizada puede usar el orden recomendado por
Supabase:

```powershell
$env:PGSERVICEFILE = "C:\ruta-privada\pg_service.conf"
$env:PGPASSFILE = "C:\ruta-privada\pgpass.conf"
psql "service=ceneval-restore" --single-transaction --variable ON_ERROR_STOP=1 --file roles.sql --file schema.sql --command "SET session_replication_role = replica" --file data.sql
```

El alias no es un secreto; la contraseña permanece fuera de los argumentos y
del repositorio. No uses `--echo-all`, no pegues la cadena de conexión en la
terminal y limpia las variables al terminar. Luego valida conteos, acceso,
políticas RLS y recorridos de la aplicación en ese proyecto de ensayo. Solo una
restauración completa y validada permite considerar recuperable el respaldo.

## Fuentes oficiales

- [Backup and restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Database backups](https://supabase.com/docs/guides/platform/backups)
