# CENEVAL Study App

Biblioteca de estudio para el examen CENEVAL de Derecho (titulación, México).
Las clases se preparan editorialmente a partir de transcripciones de audio y se
publican como paquetes completos: transcripción conservada, versión didáctica,
nueve materiales, mapa conceptual, guía, flashcards y examen.

> **¿Eres un agente de IA?** Lee [`AGENTS.md`](AGENTS.md) antes de tocar nada.
> Contiene el contexto, las reglas duras y las trampas conocidas.

## Estado

- **40 de 58 clases publicadas.** La siguiente es C41.
- La aplicación es **privada**: por ahora solo entra la administradora. El
  registro de estudiantes está pospuesto por decisión de producto.
- Funciona sobre Supabase real: autenticación, roles, políticas RLS, biblioteca
  por materias, recorrido en orden C01→C40, mapas, guías, flashcards, exámenes
  con respuestas protegidas, progreso individual, búsqueda y panel editorial
  con flujo `draft → published → withdrawn`.
- **No hay despliegue todavía.** Solo corre en `localhost`.
- No hay pruebas automatizadas de interfaz ni integración continua.

Para el estado detallado y el plan vigente, consulta
[docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md). Para los problemas abiertos y
su evidencia, [docs/auditoria-2026-08/](docs/auditoria-2026-08/README.md).

## Ejecutar localmente

Instala las dependencias:

```bash
npm install
```

Inicia el servidor:

```bash
npm run dev
```

Después abre [http://localhost:3000](http://localhost:3000).

En Windows, si PowerShell bloquea `npm.ps1`, utiliza:

```powershell
npm.cmd run dev
```

## Verificación

```bash
npm run lint
npm run build
```

## Contenido académico

```bash
npm run content:check
```

Valida los paquetes de `content/packages/` antes de importarlos. Los comandos
`content:import` **escribe en la base remota**; no lo ejecutes de paso y recuerda
que requiere las transcripciones originales. `security:rls` usa exclusivamente
Supabase local, crea un paquete sintético y verifica su limpieza al terminar.

## Stack

- Next.js 16 con App Router
- React 19 y TypeScript
- Tailwind CSS 4
- Supabase: autenticación, Postgres y políticas RLS
- Zod para validación de paquetes
- Vercel para despliegue futuro

## Variables de entorno

Copia `.env.example` como `.env.local` y completa las variables del proyecto.
`SUPABASE_SECRET_KEY` es privada y nunca debe llevar el prefijo `NEXT_PUBLIC_`.
