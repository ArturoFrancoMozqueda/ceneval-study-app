# Flujo de desarrollo

## Antes de trabajar

1. Leer `AGENTS.md`.
2. Leer `PROJECT_STATUS.md`.
3. Revisar cambios locales.
4. Identificar el documento o historia relacionada.
5. Confirmar el objetivo de la sesión.

## Para una función

1. Seleccionar una historia de usuario.
2. Revisar criterios de aceptación.
3. Definir el cambio mínimo.
4. Identificar datos y pantallas afectadas.
5. Implementar.
6. Validar manualmente.
7. Ejecutar lint, tipos y pruebas.
8. Revisar accesibilidad básica.
9. Actualizar documentación.
10. Actualizar estado.

## Comandos esperados

Los comandos exactos deberán confirmarse con `package.json`, pero normalmente:

```bash
npm run dev
npm run lint
npm run build
```

No inventar scripts que no existan.

## Git

Antes de un commit:

- revisar `git status`;
- revisar `git diff`;
- confirmar que no hay secretos;
- incluir solo archivos relacionados;
- usar un mensaje descriptivo.

Ejemplos:

```text
docs: add initial user stories
feat: add subject creation form
fix: preserve transcript original text
```

## Revisión

Una revisión debe comprobar:

- cumplimiento de la historia;
- manejo de entradas vacías;
- errores;
- estados de carga;
- comportamiento al recargar;
- navegación;
- accesibilidad;
- seguridad;
- consistencia visual;
- documentación.

## Problemas

Cuando exista un error:

1. Copiar el mensaje exacto.
2. Identificar el comando o acción que lo produjo.
3. Explicar la causa probable en lenguaje sencillo.
4. Probar la corrección más pequeña.
5. Confirmar el resultado antes de continuar.
