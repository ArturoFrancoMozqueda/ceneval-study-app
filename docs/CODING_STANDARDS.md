# Estándares de código

## TypeScript

- Mantener modo estricto.
- Evitar `any`.
- Definir tipos para entradas y salidas.
- Validar datos externos en tiempo de ejecución.
- No confiar únicamente en tipos estáticos.

## Next.js

- Usar App Router.
- Preferir Server Components cuando no se necesite interacción del navegador.
- Usar Client Components solo cuando exista estado, eventos o APIs del navegador.
- Mantener secretos y llamadas privadas del lado servidor.
- No realizar llamadas directas a proveedores de IA desde el navegador.

## Componentes

- Componentes pequeños y con una responsabilidad clara.
- Nombres descriptivos.
- Evitar componentes gigantes.
- Separar presentación, lógica y acceso a datos.
- Reutilizar únicamente cuando exista una necesidad real.

## Datos

- Centralizar consultas.
- Manejar errores.
- No interpolar entradas inseguras.
- Usar migraciones.
- No modificar producción manualmente.
- Conservar integridad referencial.

## Formularios

- Etiquetas visibles.
- Mensajes de error claros.
- Validación del lado cliente para experiencia.
- Validación del lado servidor para seguridad.
- Desactivar acciones duplicadas durante el envío.

## Accesibilidad

- HTML semántico.
- Navegación por teclado.
- Foco visible.
- Contraste suficiente.
- No depender solo del color.
- Botones con nombres comprensibles.

## Estilo

- Seguir el formateador y linter configurados.
- Evitar comentarios que repiten el código.
- Comentar decisiones no obvias.
- No usar abreviaturas ambiguas.
- Mantener funciones cortas.

## Errores

- Mostrar mensajes útiles al usuario.
- Registrar detalles técnicos del lado servidor.
- No exponer secretos, trazas o datos sensibles.
- Diseñar estados de carga, vacío y error.

## Pruebas

Priorizar:

- reglas de negocio;
- validaciones;
- cálculos;
- persistencia crítica;
- flujos centrales;
- regresiones.

## IA

- Prompts versionados.
- Salidas estructuradas.
- Validación de esquema.
- Referencia a fuentes.
- Manejo de respuestas incompletas.
- Control de longitud y costo.
- Registro de fallos.
- Posibilidad de revisión humana.
