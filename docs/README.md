# Documentación del proyecto

Este directorio contiene la fuente principal de contexto para el desarrollo de CENEVAL Study App.

## Orden de lectura

0. `auditoria-2026-08/README.md` — auditoría del 19 de agosto de 2026. Léela
   antes que nada: corrige varias afirmaciones de los documentos siguientes.
1. `PROJECT_STATUS.md`
2. `01-product-vision.md`
3. `02-functional-requirements.md`
4. `03-user-stories.md`
5. `DEVELOPMENT_WORKFLOW.md`
6. `TEACHING_STYLE.md`
7. `05-system-architecture.md`
8. `06-database-design.md`
9. `07-roadmap.md`
10. `08-visual-design.md`
11. `CODING_STANDARDS.md`
12. `DECISIONS.md`

## Documentos

| Archivo | Propósito | Estado |
|---|---|---|
| `01-product-vision.md` | Define usuarios, problema, propuesta de valor y alcance | Borrador validado |
| `02-functional-requirements.md` | Define las funciones que debe ofrecer la aplicación | Borrador validado |
| `03-user-stories.md` | Convierte funciones en necesidades y criterios verificables | Aprobado |
| `04-navigation-and-screens.md` | Define navegación, páginas y flujos | Aprobado |
| `05-system-architecture.md` | Describe la arquitectura técnica acordada | Aprobado |
| `06-database-design.md` | Define entidades, relaciones y reglas de datos | Aprobado |
| `07-roadmap.md` | Organiza las entregas y el orden de implementación | Aprobado |
| `08-visual-design.md` | Define personalidad, colores, tipografía y componentes | Aprobado |
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
- roadmap;
- estado del proyecto;
- decisiones.

## Nomenclatura

- `FR-###`: requisito funcional.
- `US-###`: historia de usuario.
- `ADR-###`: decisión de arquitectura o producto.
- V1: primera versión utilizable.
- Futuro: funcionalidad fuera del alcance inmediato.
