# Glosario de abreviaturas

**Fecha:** 27 de agosto de 2026

La ruta autenticada `/glosario` permite buscar por sigla, nombre completo o
categoría las abreviaturas jurídicas, institucionales, fiscales y del examen
que aparecen en el catálogo publicado.

## Criterios editoriales

- Una entrada se incorpora cuando la abreviatura aparece en un paquete vigente
  de `content/packages/` o en la interfaz de estudio.
- El significado desarrolla únicamente el nombre completo. No resume la figura
  jurídica, no interpreta una norma y no afirma su vigencia.
- El nombre se contrasta con el título o denominación oficial usado por las
  fuentes primarias del paquete. Las siglas ambiguas solo se agregan cuando el
  contexto del catálogo permite un significado único.
- Las entradas se ordenan alfabéticamente en `lib/glossary.ts` y usan una de las
  categorías cerradas del mismo archivo.
- Cuando un paquete nuevo introduce una sigla, la revisión editorial debe
  decidir si se agrega al catálogo y ejecutar `npm run test:glossary`.

## Decisiones técnicas y de accesibilidad

El catálogo es estático y no contiene transcripciones, respuestas de examen ni
datos de usuario. La búsqueda ocurre localmente en el navegador y no envía el
texto escrito a Supabase ni a otro servicio. React renderiza todas las cadenas
como texto; no se usa HTML inyectado.

La interfaz conserva una etiqueta visible para la búsqueda, anuncia el número
de resultados con `aria-live`, usa listas de definición (`dl`, `dt`, `dd`) y
marca cada sigla con el elemento semántico `abbr`. Todos los controles son
nativos, accesibles mediante teclado y respetan los indicadores de foco y los
tamaños mínimos del diseño existente.
