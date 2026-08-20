# Documentación del proyecto

Este directorio contiene la fuente principal de contexto para el desarrollo de CENEVAL Study App.

El punto de entrada del repositorio es [`AGENTS.md`](../AGENTS.md), en la raíz.

## Orden de lectura

0. `PROJECT_STATUS.md` — estado vigente del código integrado y bloqueos reales.
1. `auditoria-2026-08/README.md` — corte histórico del 19 de agosto y tabla de
   conciliación con el estado posterior.
2. `01-product-vision.md`
3. `02-functional-requirements.md`
4. `03-user-stories.md`
5. `DEVELOPMENT_WORKFLOW.md`
6. `TEACHING_STYLE.md`
7. `05-system-architecture.md`
8. `06-database-design.md`
9. `08-visual-design.md`
10. `CODING_STANDARDS.md`
11. `DECISIONS.md`

`archivo/` guarda documentos históricos que **ya no describen el producto**.
No los uses como referencia.

## Documentos

| Archivo | Propósito | Estado |
|---|---|---|
| `01-product-vision.md` | Define usuarios, problema, propuesta de valor y alcance | Borrador validado |
| `02-functional-requirements.md` | Define las funciones que debe ofrecer la aplicación | Borrador validado |
| `03-user-stories.md` | Convierte funciones en necesidades y criterios verificables | Aprobado |
| `04-navigation-and-screens.md` | Define navegación, páginas y flujos | Aprobado |
| `05-system-architecture.md` | Describe la arquitectura técnica acordada | Aprobado |
| `06-database-design.md` | Define entidades, relaciones y reglas de datos | Aprobado |
| `08-visual-design.md` | Define personalidad, colores, tipografía y componentes | Aprobado |
| `SECURITY_TESTING.md` | Distingue cobertura local, suite remota y última ejecución comprobada | Activo |
| `SUPABASE_BACKUP.md` | Procedimiento seguro de exportación, verificación y restauración de ensayo | Activo; ejecución real pendiente |
| `auditoria-2026-08/` | Corte histórico con conciliación vigente en su README | Histórico y referencial |
| `archivo/` | Documentos históricos que ya no aplican | Archivado |
| `DEVELOPMENT_WORKFLOW.md` | Establece cómo trabajar en el repositorio | Activo |
| `TEACHING_STYLE.md` | Indica cómo enseñar al usuario | Activo |
| `CODING_STANDARDS.md` | Reglas para escribir y revisar código | Activo |
| `PROJECT_STATUS.md` | Registra el punto exacto del proyecto | Activo |
| `DECISIONS.md` | Historial de decisiones importantes | Activo |

## Regla de sincronización

Cuando el código cambie el comportamiento del producto, deben revisarse:

- requisitos funcionales;
- historias de usuario;
- arquitectura;
- modelo de datos;
- estado del proyecto;
- decisiones;
- las trampas conocidas de `AGENTS.md`, si corriges alguna.

## Nomenclatura

- `FR-###`: requisito funcional.
- `US-###`: historia de usuario.
- `ADR-###`: decisión de arquitectura o producto.
- V1: primera versión utilizable.
- Futuro: funcionalidad fuera del alcance inmediato.
