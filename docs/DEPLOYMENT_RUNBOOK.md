# Publicación manual privada en Vercel

Última actualización: 21 de agosto de 2026

> **Alcance actual:** este procedimiento publica únicamente la aplicación
> privada de la administradora. No habilita estudiantes, registro público,
> pagos ni un lanzamiento comercial. Vercel no está conectado a Git y el plan
> actual es Hobby; cada publicación y cada revisión de logs son manuales.

No se ejecutó una publicación al escribir este runbook. Los comandos de Vercel
requieren autorización, sesión de la cuenta correcta y un proyecto enlazado.

## Regla de parada

Ante cualquier dato faltante, resultado ambiguo o gate rojo, **detén la
publicación**. No cambies secretos, no apliques migraciones y no uses otro
proyecto para “hacer que pase”. Producción recibe un build prebuilt identificado
y generado desde el mismo commit que pasó Preview. Preview y Production se
construyen por separado porque las variables `NEXT_PUBLIC_*` quedan congeladas
durante el build y pueden diferir entre entornos.

En el estado verificado el 21 de agosto de 2026 (hora de México), CENEVAL remoto
conserva once migraciones y el código local espera dieciséis. Esa diferencia
bloquea la promoción hasta que
las migraciones pasen primero por un proyecto de ensayo autorizado y se apruebe
su aplicación. Este runbook no aplica ni revierte base de datos.

## Registro obligatorio

Antes de empezar, crea un registro privado fuera de Git. No incluyas tokens,
contraseñas, claves Supabase, contenido de logs ni datos personales.

| Campo | Valor |
| --- | --- |
| Fecha/hora UTC y responsable | pendiente |
| Motivo o ticket | pendiente |
| Commit completo | pendiente |
| Rama y URL de CI verde | pendiente |
| Versión exacta de Vercel CLI | pendiente |
| Proyecto y equipo Vercel confirmados | pendiente |
| Estado de migraciones y respaldo | pendiente |
| Deployment de producción anterior | pendiente |
| Preview ID y URL | pendiente |
| SHA-256 del manifiesto del build Production | pendiente |
| Deployment publicado y URL de producción | pendiente |
| Resultado preflight/E2E/readiness/logs | pendiente |
| Decisión final o rollback | pendiente |

El deployment anterior es obligatorio: sin un objetivo conocido y `READY` no
hay rollback seguro.

## 1. Preflight local fail-closed

1. Abre PowerShell en la raíz del repositorio y confirma identidad del código:

   ```powershell
   git status --short
   git branch --show-current
   git rev-parse HEAD
   ```

   Resultado esperado: árbol limpio, rama autorizada y SHA completo idéntico al
   registro. Si hay cambios sin commit, detente.

2. Confirma en GitHub que el workflow **Calidad** terminó verde para ese mismo
   SHA. Un resultado verde de otro commit no sirve.

3. Ejecuta los gates sin red de producción:

   ```powershell
   npm.cmd ci --ignore-scripts
   npm.cmd run test:local
   npm.cmd run lint
   npm.cmd run build
   ```

4. Con Supabase local activo, ejecuta:

   ```powershell
   npm.cmd run security:rls
   npm.cmd run test:e2e:local
   npm.cmd run test:backup-restore:local
   ```

   Los tres comandos deben confirmar loopback y cleanup sin residuos. Nunca
   sustituyas sus variables por URLs remotas.

5. Verifica los gates externos en su evidencia autorizada:

   - respaldo real verificado y restaurado en ensayo, si se cambiará esquema o
     contenido;
   - migraciones del destino compatibles con el commit;
   - `PRIVATE_ACCESS_ONLY=true`;
   - administradora y redirecciones Auth operativas;
   - variables de Preview y Production configuradas en Vercel, sin copiar
     valores a archivos o al registro.

   `OPS_READINESS_TOKEN` es server-only, aleatorio y de al menos 32 caracteres.
   Nunca usa prefijo `NEXT_PUBLIC_`. Se almacena por separado en Preview y
   Production y se rota después de una exposición o cambio de responsable.

## 2. Identificar proyecto, CLI y rollback

1. En el Dashboard confirma visualmente equipo, proyecto CENEVAL y dominio. No
   uses el proyecto Kova.
2. Revisa el deployment que actualmente recibe producción; confirma estado
   `READY`, fecha y commit, y cópialo al registro como rollback.
3. Usa una versión exacta y aprobada de Vercel CLI. Registra el resultado de
   `vercel --version`; no uses `@latest` durante una publicación.
4. Ejecuta `vercel link` solo si una persona autorizada necesita enlazar el
   workspace. Después abre `.vercel/project.json` localmente y coteja sus IDs
   con el Dashboard. Ese archivo no prueba por sí solo que el proyecto sea el
   correcto y no se agrega a Git.

Los ejemplos siguientes usan `vercel`. Si la CLI no está instalada con la
versión registrada, detente; no descargues una versión distinta de paso. La
sesión debe obtenerse con el login de la CLI o un token en el entorno seguro.
Nunca pegues `--token` en el comando ni captures el entorno en logs.

## 3. Construir y desplegar preview

1. Trae configuración de Preview y construye un artefacto prebuilt:

   ```powershell
   vercel pull --yes --environment=preview
   npm.cmd run ops:preflight:preview
   vercel build
   vercel deploy --prebuilt
   ```

2. Copia del resultado el Preview ID y su URL al registro. Ejecuta:

   ```powershell
   vercel inspect <PREVIEW_ID_O_URL>
   ```

   Exige `READY` y confirma proyecto, entorno Preview, framework y commit. Si el
   commit no coincide con el SHA registrado, descarta ese preview.

3. Comprueba por HTTPS:

   - `GET /api/health/live` responde éxito sin revelar configuración;
   - `GET /api/health/ready` sin autorización responde 404 genérico;
   - con `Authorization: Bearer <OPS_READINESS_TOKEN>` responde éxito;
   - la raíz redirige a `/iniciar-sesion`;
   - una cuenta student permanece rechazada por ADR-014;
   - la administradora entra y abre `/administrar` y el detalle editorial de
     una clase sin hacer cambios.

   Envía el token solo en el header desde una terminal confiable. No lo pongas
   en URL, captura, historial compartido o registro.

4. Revisa Build Logs y Runtime Logs del preview en el Dashboard. En Hobby no
   hay drains: la ausencia de un panel externo no equivale a “sin errores”.
   Bloquean Production los errores de build/runtime, 5xx, readiness roja, login
   fallido, proyecto incorrecto o cualquier secreto visible.

## 4. Construir y publicar Production

El preview aprobado demuestra el flujo con configuración Preview; no demuestra
que sus variables públicas sean correctas para Production. Vuelve a confirmar
el mismo commit y, con aprobación de la responsable, carga la configuración de
Production, ejecuta su preflight y crea un build nuevo:

```powershell
git rev-parse HEAD
vercel pull --yes --environment=production
npm.cmd run ops:preflight:production
vercel build --prod
```

El preflight debe leer la configuración descargada de Production sin imprimir
valores y exige `PRIVATE_ACCESS_ONLY=true`, URLs HTTPS, claves distintas,
administradora y readiness token válido. Si no puede demostrarlo, detente.

Antes de publicar, crea un manifiesto local estable del directorio prebuilt y
registra únicamente su SHA-256; `.vercel/` y el manifiesto no van a Git:

```powershell
$BuildRoot = (Resolve-Path -LiteralPath ".vercel/output").Path
$BuildEntries = Get-ChildItem -LiteralPath $BuildRoot -File -Recurse |
  Sort-Object FullName |
  ForEach-Object {
    [ordered]@{
      path = $_.FullName.Substring($BuildRoot.Length).TrimStart("\")
      bytes = $_.Length
      sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    }
  }
$BuildEntries | ConvertTo-Json -Depth 3 -Compress |
  Set-Content -LiteralPath ".vercel/production-build-manifest.local.json" -Encoding utf8NoBOM
Get-FileHash -LiteralPath ".vercel/production-build-manifest.local.json" -Algorithm SHA256
```

Publica exclusivamente esa salida prebuilt y luego inspecciónala:

```powershell
vercel deploy --prebuilt --prod
vercel inspect <DEPLOYMENT_PRODUCTION_ID_O_URL>
```

Registra digest, deployment, URL, hora, commit y resultado `READY`. No uses
`vercel --prod` sin `--prebuilt`: permitiría a Vercel construir otra salida no
identificada.

## 5. Postdeploy y observación Hobby

Repite inmediatamente liveness, readiness autenticada, login y panel editorial
en la URL de producción. Luego observa durante al menos diez minutos:

```powershell
vercel logs <URL_PRODUCCION> --level error --since 1h
```

Revisa también Runtime Logs en el Dashboard, acotados al deployment publicado.
No uses `--follow` sin un límite operativo. Registra cantidad de errores y una
descripción sanitizada; no copies payloads, correos, cookies, headers o tokens.

El resultado es:

- **APROBADO:** health y recorrido pasan, deployment `READY` y no aparecen
  errores nuevos atribuibles al release durante la ventana;
- **DEVUELTO:** hay señales ambiguas que requieren investigación sin impacto;
- **ROLLBACK:** readiness falla, aparecen 5xx repetidos, login/panel dejan de
  funcionar, se detecta fuga de datos o el deployment/proyecto no corresponde.

Hobby no ofrece por este procedimiento alertas continuas ni retención externa.
Después de la ventana, la responsable debe seguir consultando el Dashboard
manualmente hasta que se apruebe monitoreo adicional.

## 6. Rollback de aplicación

1. Confirma que el deployment anterior registrado sigue `READY` y que es
   compatible con el esquema actual.
2. Registra motivo, hora y evidencia sanitizada.
3. Reapunta producción al deployment conocido:

   ```powershell
   vercel rollback <DEPLOYMENT_ANTERIOR>
   vercel inspect <DEPLOYMENT_ANTERIOR>
   ```

4. Repite liveness, readiness, login, panel y revisión de logs. Registra el
   deployment que quedó activo.

El rollback de Vercel **no revierte migraciones, Auth, contenido ni secretos**.
Nunca ejecutes SQL inverso automáticamente. Si el deployment anterior no es
compatible con la base actual, mantén el acceso privado, detén cambios y usa el
procedimiento de recuperación autorizado de Supabase.

## Cierre

La publicación solo se cierra cuando el registro contiene SHA de Git, CI,
preview, digest del build Production, producción anterior/nueva, resultados de
health/E2E/logs y decisión final. Si hubo rollback, conserva ambos deployment
IDs y abre una incidencia sin datos privados.
