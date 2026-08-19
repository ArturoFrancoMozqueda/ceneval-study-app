# CENEVAL Study App

Aplicación web para organizar materias, clases y transcripciones durante la preparación del CENEVAL de Derecho.

## Estado

Las entregas 1A, 1B y 1C de la interfaz están implementadas:

- layout adaptable;
- navegación de escritorio y móvil;
- pantalla de Inicio;
- lista de Materias;
- formulario para crear una materia;
- detalle de materia y lista de clases;
- formulario para crear una clase;
- detalle de clase;
- captura y consulta de la transcripción original;
- revisión, aprobación y rechazo de temas;
- creación manual y detalle básico de temas;
- datos temporales durante la sesión;
- estados vacíos y pantallas informativas.

El proyecto de Supabase y el esquema académico inicial ya están configurados.
La interfaz todavía usa datos temporales mientras se completa la conexión
privada del servidor.

Consulta [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) para conocer el estado
auditado, las clases terminadas y las tareas específicas para finalizar el
proyecto.

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

## Stack

- Next.js con App Router
- TypeScript
- Tailwind CSS
- Supabase en la fase de persistencia
- Vercel para despliegue futuro

## Variables de entorno

Copia `.env.example` como `.env.local` y completa las variables del proyecto.
`SUPABASE_SECRET_KEY` es privada y nunca debe llevar el prefijo `NEXT_PUBLIC_`.
