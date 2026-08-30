# Respaldo lógico de Supabase

Última actualización: 30 de agosto de 2026

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

Las sumas detectan corrupción accidental, pero no prueban autenticidad: una
persona que pueda reemplazar a la vez los SQL y el manifiesto puede recalcular
los SHA-256. Tampoco aportan confidencialidad. El directorio puede
contener cuentas, progreso, contenido y respuestas de examen. Está excluido de
Git y debe tratarse como información privada.

Este respaldo lógico **no incluye los archivos almacenados en Supabase
Storage**, aunque pueda incluir metadatos de la base. Tampoco sustituye una
copia de variables, configuración de Auth/Vercel, secretos, dominios ni otros
servicios de plataforma. Esos elementos requieren inventarios y respaldos
separados. Se excluyen además las tablas internas de Vector Buckets recomendadas
por Supabase (`storage.buckets_vectors` y `storage.vector_indexes`).

El conjunto actual tampoco conserva por sí solo el historial de
`supabase_migrations`. La guía oficial requiere exportarlo por separado si se
quiere trasladar ese historial. Las modificaciones propias dentro de los
esquemas administrados `auth` o `storage` también requieren un diff y revisión
separados. El repositorio conserva las migraciones de la aplicación, pero eso no
demuestra qué historial quedó aplicado en una exportación concreta. Antes del
primer respaldo real se debe decidir y probar uno de estos dos procedimientos:

- incluir historial y cambios administrados como artefactos adicionales con
  digest y orden de restauración explícitos; o
- reconstruirlos desde Git y conciliar el historial aplicado en el destino.

Hasta entonces, el conjunto de tres SQL es una exportación lógica verificable,
no un kit autosuficiente de recuperación operativa.

## 1. Comprobación local segura

Desde la raíz del repositorio:

```powershell
npm ci
npm run test:backup
```

La prueba crea SQL sintético en una ruta temporal con espacios, acepta el
conjunto íntegro y comprueba rechazos fail-closed por contenido alterado, JSON o
versión inválidos, archivo ausente o vacío, entrada duplicada y nombre fuera de
la allowlist. También comprueba estáticamente que el exportador use la CLI local
con argumentos separados, `--linked` y sin aceptar una URL de base. No lee
variables de entorno, no usa Supabase y elimina solo su propio directorio
temporal.

Hay además un ensayo dinámico separado para el motor local:

```powershell
npm run test:backup-restore:local
```

Requiere Supabase local activo en los puertos del proyecto y las herramientas
cliente de PostgreSQL 17 en `PATH`. El wrapper crea contenido 1.2 sintético; el
runner confirma loopback, exporta la base local con `pg_dump`, restaura en una
base temporal con nombre aleatorio y allowlist, compara esquema, RLS, conteos,
digests y el round-trip 1.2, y elimina su base y archivos en `finally`. Falla si
la fuente no es `postgres` local, si la base temporal ya existía o si no puede
probar su ownership.

Este ensayo demuestra el mecanismo PostgreSQL y la verificación semántica en
local. Usa un dump binario de la base local; **no** restaura los tres SQL de una
exportación remota, no contacta producción y no satisface por sí solo el ensayo
del respaldo real.

Para verificar una exportación que ya existe:

```powershell
npm run backup:verify -- -BackupDirectory "C:\ruta\al\respaldo"
```

Un resultado correcto confirma presencia, tamaño y SHA-256 de los tres SQL. No
demuestra quién creó el conjunto, de qué proyecto proviene ni que el contenido
pueda restaurarse. La procedencia se registra por separado y la restaurabilidad
se prueba aparte en un destino desechable. `createdAtUtc`, `source` y
`cliVersion` son metadatos descriptivos; el verificador actual no los usa como
prueba de confianza.

## 2. Generación autorizada

Requisitos:

1. autorización expresa de la responsable de producción;
2. Node.js y dependencias instaladas con `npm ci`;
3. Docker Desktop activo, requerido por `supabase db dump`;
4. sesión autenticada de la CLI y proyecto correcto enlazado previamente con
   `npm exec supabase -- link` por una persona autorizada;
5. espacio local suficiente en un volumen cifrado, con acceso limitado a la
   responsable del respaldo y a las cuentas administradoras necesarias.

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

El resultado queda en `backups/supabase/AAAAmmddTHHMMSSZ/`. El script no cifra
los archivos ni cambia sus ACL: antes de ejecutarlo, confirma que el volumen
esté cifrado y revisa con `Get-Acl .` que otras cuentas no tengan acceso
innecesario. Tras la primera ejecución revisa también `Get-Acl
backups\supabase`. Si una fase falla, se conserva un directorio `.partial` para
diagnóstico y nunca se presenta como respaldo terminado. No adjuntes esos
archivos a incidencias ni los subas al repositorio.

Después de generarlo:

1. ejecuta `backup:verify` sobre el directorio final;
2. copia el directorio a una ubicación independiente y cifrada;
3. ejecuta `backup:verify` sobre esa segunda copia;
4. registra en un inventario restringido fecha, responsable, alias o referencia
   inequívoca del proyecto origen, ruta lógica, digest del `manifest.json` y
   resultado; nunca credenciales ni contenido SQL;
5. aplica como regla provisional conservar las cuatro copias semanales más
   recientes y una copia mensual durante doce meses. Documenta cada eliminación
   y usa borrado criptográfico o el ciclo de vida del almacenamiento cifrado;
   borrar un archivo de un SSD no garantiza por sí solo su destrucción.

Frecuencia inicial recomendada: semanal y antes/después de cada publicación o
migración relevante. Debe revisarse cuando el proyecto entre en producción
formal.

La responsable primaria es Fatima, titular de producción; puede delegar una
ejecución únicamente a una persona suplente designada con acceso propio. Quien
ejecute registra fecha, resultado de ambas verificaciones, ubicación lógica de
la copia externa y siguiente fecha programada en el inventario restringido. Si
la semana termina sin respaldo aprobado, se registra como incidente operativo y
se detienen migraciones o publicaciones de contenido hasta recuperar el ciclo.

## 3. Restauración manual y separada

La restauración remota es destructiva para el destino y **no está
automatizada**. No debe ejecutarse sobre producción. Primero crea un proyecto
Supabase nuevo y vacío, verifica que no contenga información que deba
conservarse y obtiene una autorización específica para la prueba.

Para evitar secretos en argumentos o historial, configura fuera del repositorio:

- un archivo PostgreSQL service (`PGSERVICEFILE`) con un alias como
  `ceneval-restore`, host, puerto, `dbname=postgres`, usuario específico del
  proyecto y `sslmode=require`;
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

El alias no es un secreto, pero el archivo de servicio sí revela infraestructura
y debe permanecer restringido; la contraseña queda fuera de los argumentos y
del repositorio. No uses `--echo-all`, no pegues la cadena de conexión en la
terminal y elimina `PGSERVICEFILE` y `PGPASSFILE` del proceso al terminar. Antes
de confirmar, coteja host, usuario, `dbname=postgres` y referencia del destino
contra el Dashboard. Luego valida, como mínimo:

1. que `psql` terminó con código cero y sin errores ignorados;
2. conteos por tabla y una muestra de relaciones críticas;
3. historial de migraciones, extensiones y publicaciones de Realtime que el
   proyecto necesite;
4. bloqueo de `exam_answer_keys`, RLS y privilegios anon/authenticated;
5. login administrativo y un recorrido de lectura y guardado en la aplicación;
6. eliminación autorizada del proyecto de ensayo y revocación o eliminación de
   sus credenciales temporales una vez terminado.

Solo una restauración completa y validada permite considerar recuperable el
respaldo. La prueba sintética de integridad no satisface este requisito y no debe
registrarse como restauración de producción.

## Fuentes oficiales

- [Backup and restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Database backups](https://supabase.com/docs/guides/platform/backups)
