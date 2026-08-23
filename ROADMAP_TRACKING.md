# Roadmap y seguimiento — CENEVAL Study App

Última actualización: 22 de agosto de 2026  
Responsables: Fatima (aprobación editorial) y Codex (desarrollo y preparación académica)

> **Nota de conciliación (22 de agosto de 2026).** El registro detallado de
> este documento (secciones 2, 5 y 6) dejó de actualizarse sesión a sesión
> después del 12 de agosto de 2026, cuando el catálogo llevaba 49 de 58
> clases. Desde entonces la producción continuó hasta publicar C01–C57 (57 de
> 58 clases) y el despliegue en Vercel se conectó a Git. El estado
> continuamente verificado y actualizado vive en
> [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md); ante cualquier
> contradicción entre ese documento y este, `PROJECT_STATUS.md` es la fuente
> vigente. Ese documento absorbió el 22 de agosto de 2026 lo que antes eran
> `PLAN_ACCION_VENTA.md`, `D1_DERECHOS_AUDIOS.md` y `PLAN_VENTA_DECISIONES.md`
> (ya no existen): el plan para poder cobrar, con sus bloqueos y evidencias de
> cierre, está en su §3 a §5; las decisiones de producto, precio, proveedor y
> nombre comercial ya cerradas están en su §4. De ese plan, la Fase 0
> (decisiones) ya cerró, y la Fase 1 (marco legal) y la Fase 5 (producto
> vendible) ya están publicadas en producción.

## Cómo usar este documento

Este es el documento principal para saber qué se terminó, qué está en curso y
qué sigue. Debe actualizarse al cerrar cada sesión de trabajo.

Estados:

- [x] Terminado y verificado.
- [ ] Pendiente.
- 🚧 En curso.
- 👁️ Requiere revisión de Fatima.
- ⛔ Bloqueado.
- ➖ No aplica o se decidió posponer.

Una tarea no se marca como terminada solo porque existe código. También debe
cumplir sus pruebas y criterios de aceptación.

---

## 1. Objetivo de la entrega inicial

Publicar una biblioteca gratuita para estudiantes de Derecho que preparan el
CENEVAL, con:

- registro e inicio de sesión;
- clases completas y verificadas;
- fuentes jurídicas oficiales;
- mapas conceptuales;
- guías, resúmenes y conceptos clave;
- flashcards y progreso individual;
- exámenes originales tipo CENEVAL;
- respuestas protegidas hasta entregar el intento;
- panel exclusivo para la administradora;
- flujo de borrador, revisión, publicación y retiro.

La entrega inicial estará terminada cuando una estudiante pueda registrarse,
estudiar varias clases publicadas, resolver sus actividades y conservar su
progreso desde un sitio desplegado en producción.

---

## 2. Estado general

Decisión temporal vigente: la aplicación permanece privada para la única
administradora. El registro y acceso de estudiantes quedan pospuestos hasta una
aprobación posterior.

| Área | Estado | Avance estimado | Próximo resultado |
|---|---:|---:|---|
| Definición del producto | [x] | 100% | Mantener documentación actualizada |
| Interfaz base | [x] | 100% | Ajustes derivados de pruebas reales |
| Base de datos editorial | [x] | 100% | Revisar asesores antes de producción |
| Autenticación y roles | [x] | 100% | Prueba final de correos en producción |
| Seguridad RLS | 🚧 | 85% | Suite reproducible y revisión final |
| Importador editorial | [x] | 100% | Mejoras conforme aumenten los paquetes |
| Panel administrativo | 🚧 | 85% | Edición y retiro editorial completos |
| Experiencia de estudiante | 🚧 | 80% | Prueba móvil, accesibilidad y estados |
| Flashcards y exámenes | 🚧 | 85% | Historial y análisis de temas débiles |
| Contenido académico | 🚧 | 98% (57/58 clases publicadas, verificado 22-ago-2026) | Desbloquear C58 (ver `docs/C58_SOURCE_AUDIT.md`) y decidir alcance de bancos transversales |
| Pruebas automatizadas | [ ] | 10% | Pruebas de permisos y flujo completo |
| Despliegue | 🚧 | Vercel conectado a Git, deployment `READY` en producción a la par de `main` (verificado 22-ago-2026); Hobby sin cambio a Pro | Subir a un plan que permita uso comercial (tarea `I-1` del plan de venta) |
| Operación y mantenimiento | [ ] | 10% | Manuales, respaldos y actualización legal |

---

## 3. Trabajo ya terminado

### 3.1 Producto y documentación

- [x] Visión del producto definida.
- [x] Requisitos funcionales definidos.
- [x] Historias de usuario documentadas.
- [x] Navegación y pantallas documentadas.
- [x] Arquitectura documentada.
- [x] Diseño de base de datos documentado.
- [x] Decisiones técnicas registradas.
- [x] Modelo cambiado de organizador personal a biblioteca editorial.
- [x] Flujo administradora–estudiante definido.
- [x] Catálogo preliminar de las 70 transcripciones creado.

### 3.2 Aplicación

- [x] Proyecto Next.js con TypeScript.
- [x] Diseño adaptable para escritorio y móvil.
- [x] Inicio convertido en biblioteca.
- [x] Materias, clases, temas y búsqueda.
- [x] Lección organizada en aprender, mapa, guía, flashcards, examen y fuente.
- [x] Estados básicos de contenido vacío, carga y error.
- [x] Lint y compilación de producción funcionando.

### 3.3 Supabase y seguridad

- [x] Proyecto definitivo de Supabase creado.
- [x] Tablas originales de materias, clases, transcripciones y temas.
- [x] Migración editorial aplicada.
- [x] Perfiles con roles `admin` y `student`.
- [x] Cuenta inicial promovida a administradora.
- [x] Registro, confirmación, inicio de sesión y recuperación de contraseña.
- [x] Modo privado: registro desactivado y acceso limitado al rol `admin`.
- [x] Estados `draft`, `review` y `published`.
- [x] Tablas para materiales, referencias, mapas, flashcards y exámenes.
- [x] Tablas para revisiones, intentos, respuestas y progreso.
- [x] RLS para contenido publicado y progreso privado.
- [x] Claves correctas de exámenes separadas de las opciones visibles.
- [x] Prueba manual: estudiante sin acceso a borradores.
- [x] Prueba manual: estudiante sin acceso al progreso de otra persona.
- [x] Prueba manual: estudiante sin permiso de publicación.

### 3.4 Flujo editorial

- [x] Esquema validado de paquete de clase.
- [x] Validador `content:check`.
- [x] Importador `content:import`.
- [x] Importación obligatoria como borrador.
- [x] Conservación de la transcripción original.
- [x] Marcado de contenido de clase, complementario o mixto.
- [x] Vista previa administrativa.
- [x] Control de publicación.

### 3.5 Primera clase piloto

- [x] Audio 19 leído y clasificado.
- [x] Transcripción original conservada.
- [x] Derecho vigente contrastado con fuentes oficiales.
- [x] Paquete académico validado.
- [x] Nueve secciones educativas.
- [x] Mapa conceptual.
- [x] Tres referencias jurídicas oficiales.
- [x] Doce flashcards.
- [x] Diez preguntas con explicación de cada opción.
- [x] Importación en Supabase como clase 3.
- [x] Verificación de conteos y estado `draft`.
- [x] Revisión visual y académica de Fatima.
- [x] Correcciones derivadas de la revisión (sin cambios solicitados).
- [x] Cambio de estado a `review`.
- [x] Aprobación explícita para publicar.
- [x] Publicación de la primera clase.

---

## 4. Roadmap restante por fases

## Fase A — Cerrar la clase piloto

Objetivo: validar el formato definitivo antes de procesar las otras
transcripciones.

- [x] Fatima revisa `/administrar/clases/3`.
- [ ] Revisar claridad, profundidad y tono.
- [ ] Revisar navegación entre secciones.
- [ ] Revisar mapa conceptual.
- [ ] Probar las 12 flashcards.
- [ ] Resolver el examen completo.
- [ ] Comprobar que las respuestas no aparecen antes de entregar.
- [ ] Revisar la transcripción original.
- [ ] Aplicar correcciones editoriales.
- [ ] Probar la clase en teléfono.
- [ ] Probar la clase en computadora.
- [x] Cambiar a estado `review`.
- [x] Obtener confirmación explícita de publicación.
- [x] Exigir confirmación explícita en la interfaz antes de publicar.
- [x] Publicar.
- [x] Verificar que una cuenta estudiante pueda encontrarla.
- [x] Probar el recorrido Descubre → Comprende → Aplica → Recuerda → Comprueba.
- [ ] Observar si una estudiante inicia una actividad significativa en menos de un minuto.
- [ ] Registrar claridad, interés, duración, abandono y sensación de avance.
- [ ] Confirmar que la experiencia se perciba dinámica sin resultar infantil.

Criterio de salida:

- la clase satisface el formato académico;
- no contiene afirmaciones jurídicas sin respaldo;
- la experiencia móvil y de escritorio es legible;
- la administradora aprueba el modelo para las siguientes clases.

---

## Fase B — Completar seguridad y pruebas de permisos

Objetivo: convertir las pruebas manuales en una verificación repetible.

- [x] Crear script o pruebas automáticas de RLS.
- [x] Probar acceso anónimo.
- [ ] Probar cuenta estudiante no verificada.
- [x] Probar estudiante verificado.
- [x] Probar administradora.
- [x] Probar borradores, revisión, publicación y retiro.
- [x] Probar aislamiento de revisiones de flashcards.
- [x] Probar aislamiento de intentos y respuestas.
- [x] Probar que `exam_answer_keys` no sea consultable por estudiantes.
- [ ] Probar que publicar requiera rol `admin`.
- [x] Probar actualización y borrado con RLS.
- [x] Revisar funciones privilegiadas y permisos `EXECUTE`.
- [x] Ejecutar asesores de seguridad y rendimiento de Supabase.
- [x] Corregir advertencias aplicables.
- [x] Documentar los resultados.

Criterio de salida:

- todas las pruebas de permisos pasan;
- dos estudiantes no pueden compartir datos;
- ninguna clave secreta aparece en el navegador;
- las respuestas correctas permanecen protegidas.

---

## Fase C — Terminar herramientas editoriales

Objetivo: operar la biblioteca sin editar manualmente la base de datos.

- [x] Editar título y descripción de una clase.
- [ ] Editar materiales de estudio.
- [ ] Editar referencias.
- [ ] Editar mapas conceptuales.
- [ ] Editar flashcards.
- [ ] Editar preguntas, opciones y explicaciones.
- [ ] Cambiar orden de temas y materiales.
- [ ] Mostrar errores de validación por sección.
- [ ] Comparar una versión nueva con la anterior.
- [ ] Conservar historial de versiones.
- [ ] Restaurar una versión anterior.
- [x] Retirar una clase publicada sin borrarla.
- [x] Volver a publicar una clase retirada.
- [ ] Añadir notas internas de revisión.
- [ ] Registrar quién publicó y cuándo.
- [ ] Añadir lista de contenido incompleto.
- [ ] Añadir filtros por materia y estado.

Criterio de salida:

- una clase puede corregirse, versionarse, revisar, publicar y retirar desde el
  panel;
- ninguna edición destruye la transcripción original o una versión anterior.

---

## Fase D — Mejorar la experiencia del estudiante

Objetivo: ofrecer sesiones breves, interactivas y accesibles para estudiar.

- [x] Organizar cada tema en cinco etapas de aprendizaje.
- [x] Añadir sesiones de 5, 10 y 15 minutos.
- [x] Añadir accesos para entender, practicar casos y repasar errores.
- [x] Dividir las explicaciones en bloques navegables.
- [x] Añadir comprobaciones rápidas sin calificación.
- [x] Presentar exámenes una pregunta a la vez.
- [x] Guardar posición y duración elegida.
- [ ] Revisar inicio con contenido real.
- [ ] Mostrar clases recientes publicadas.
- [ ] Mostrar “continuar estudiando”.
- [ ] Mostrar avance por materia.
- [ ] Mejorar filtros y búsqueda.
- [ ] Marcar visualmente la sección actual.
- [ ] Añadir navegación anterior/siguiente.
- [ ] Guardar posición de lectura.
- [ ] Añadir estados de carga tipo esqueleto.
- [ ] Añadir recuperación ante errores de red.
- [ ] Revisar contenido vacío.
- [ ] Revisar tamaños táctiles.
- [ ] Revisar contraste de colores.
- [ ] Revisar navegación por teclado.
- [ ] Revisar lectores de pantalla.
- [ ] Evitar desplazamiento horizontal en móvil.
- [ ] Añadir aviso de contenido educativo, no asesoría jurídica.

Criterio de salida:

- una estudiante nueva encuentra una materia y termina una clase sin ayuda;
- todas las funciones esenciales operan con teclado y pantalla táctil;
- el flujo funciona con conexiones lentas y errores recuperables.

---

## Fase E — Completar aprendizaje y progreso

Objetivo: convertir actividad en información útil para estudiar mejor.

- [ ] Guardar calificación de cada flashcard.
- [ ] Implementar repetición de tarjetas difíciles.
- [ ] Mostrar tarjetas pendientes.
- [ ] Mostrar historial de exámenes.
- [ ] Permitir repetir examen sin borrar intentos.
- [ ] Calcular avance por tema.
- [ ] Calcular avance por clase.
- [ ] Calcular avance por materia.
- [ ] Definir umbrales: débil, en proceso y dominado.
- [ ] Detectar conceptos con errores recurrentes.
- [ ] Recomendar qué estudiar después.
- [ ] Explicar por qué se recomienda un tema.
- [ ] Añadir resumen de progreso al inicio.
- [x] Usar estados Por comenzar, En práctica y Dominado.
- [x] Mostrar una continuación concreta en Inicio.
- [x] Registrar respuestas rápidas y conceptos que necesitan repaso.
- [ ] Consolidar en una sola sesión los errores de exámenes, tarjetas y preguntas rápidas.
- [ ] Probar cálculos con varios intentos.
- [ ] Probar persistencia después de cerrar sesión.

Criterio de salida:

- el progreso se basa únicamente en actividad real de la persona;
- los cálculos son reproducibles y están probados;
- las recomendaciones muestran una razón comprensible.

---

## Fase F — Producción sistemática de contenido

Objetivo: convertir las transcripciones útiles en una biblioteca coherente.

### Preparación global del inventario

- [x] Leer y clasificar editorialmente las 70 transcripciones.
- [x] Detectar cambios de materia y continuidades entre archivos.
- [x] Consolidar 16 módulos, 58 clases y 3 bancos transversales.
- [x] Separar revisiones de examen, fragmentos integrables y material archivado.
- [x] Definir el orden de producción en `content/curriculum-plan.md`.

### Proceso obligatorio por clase

- [ ] Lectura completa.
- [ ] Numerar los fragmentos y crear una matriz de cobertura.
- [ ] Asignar cada explicación académica a un tema y material de estudio.
- [ ] Justificar expresamente cualquier fragmento clasificado como ruido.
- [ ] Detección de temas y continuaciones.
- [ ] Conservación del original.
- [ ] Limpieza editorial de una copia.
- [ ] Detección de afirmaciones dudosas o desactualizadas.
- [ ] Investigación en fuentes oficiales vigentes.
- [ ] Distinción entre clase y complemento.
- [ ] Explicación desde cero.
- [ ] Fundamento jurídico.
- [ ] Ejemplos sencillo y tipo CENEVAL.
- [ ] Resumen y guía.
- [ ] Conceptos y errores comunes.
- [ ] Mapa conceptual.
- [ ] Guía de estudio intensiva por tema.
- [ ] Entre 10 y 15 flashcards por tema.
- [ ] Diez reactivos originales por tema.
- [ ] Examen final acumulativo del módulo.
- [ ] Explicación de cada opción.
- [ ] Validación automática.
- [ ] Importación como borrador.
- [ ] Revisión administrativa.
- [ ] Aprobación antes de publicar.

### Orden definitivo de producción

El detalle de clases, fuentes y dependencias está en
`content/curriculum-plan.md`.

1. Consolidar el piloto administrativo y producir teoría procesal,
   constitucional y CNDH.
2. Producir electoral, amparo, fiscal y justicia administrativa.
3. Producir proceso penal, mecanismos alternativos, arbitraje y consumo.
4. Producir mercantil, propiedad intelectual y Derecho notarial.
5. Producir laboral, civil, familiar y sucesorio.
6. Cerrar orientación, bancos transversales y exámenes acumulativos.

Criterio de salida:

- todos los audios útiles se convirtieron en contenido revisado;
- los fragmentos se integraron con su clase correspondiente;
- no se publicó ruido, información desactualizada o duplicada.

---

## Fase G — Pruebas completas de la aplicación

Objetivo: comprobar el recorrido completo antes del despliegue.

- [ ] Pruebas unitarias de validadores y cálculos.
- [ ] Pruebas de acciones de servidor.
- [ ] Pruebas de componentes críticos.
- [ ] Prueba E2E de registro.
- [ ] Prueba E2E de confirmación de correo.
- [ ] Prueba E2E de recuperación de contraseña.
- [ ] Prueba E2E de publicación administrativa.
- [ ] Prueba E2E de biblioteca estudiante.
- [ ] Prueba E2E de flashcards.
- [ ] Prueba E2E de examen.
- [ ] Prueba E2E de progreso.
- [ ] Prueba de búsqueda.
- [ ] Prueba de retiro de clase.
- [ ] Prueba con dos estudiantes.
- [ ] Prueba en Chrome/Edge.
- [ ] Prueba móvil.
- [ ] Lint.
- [ ] TypeScript.
- [ ] Compilación de producción.
- [ ] Auditoría de dependencias.

Criterio de salida:

- los flujos centrales están automatizados y pasan;
- no existen fallos críticos conocidos;
- lint, tipos y compilación terminan correctamente.

---

## Fase H — Despliegue

Objetivo: publicar una versión segura y utilizable.

- [ ] Crear o vincular proyecto de Vercel.
- [ ] Configurar variables de entorno.
- [ ] Confirmar que solo variables públicas llegan al navegador.
- [ ] Configurar URLs de redirección de Supabase Auth.
- [ ] Configurar dominio o subdominio.
- [ ] Configurar correo de confirmación y recuperación.
- [ ] Crear despliegue de prueba.
- [ ] Ejecutar pruebas de humo.
- [ ] Verificar acceso administradora.
- [ ] Verificar registro estudiante.
- [ ] Verificar persistencia.
- [ ] Revisar logs.
- [ ] Revisar rendimiento.
- [ ] Aprobar despliegue.
- [ ] Desplegar versión de producción.

Criterio de salida:

- la aplicación tiene una URL estable;
- registro, biblioteca, actividades y panel funcionan en producción;
- no se exponen secretos.

---

## Fase I — Operación y mantenimiento

Objetivo: mantener contenido, seguridad y legislación al día.

- [ ] Manual de importación.
- [ ] Manual de revisión y publicación.
- [ ] Manual de retiro y corrección urgente.
- [ ] Lista de comprobación legal por clase.
- [ ] Calendario de revisión de fuentes.
- [ ] Registro de fecha de consulta.
- [ ] Alertas o revisión periódica de reformas.
- [ ] Procedimiento de respaldo.
- [ ] Procedimiento de restauración.
- [ ] Política de privacidad.
- [ ] Términos de uso.
- [ ] Aviso de contenido educativo.
- [ ] Canal para reportar errores.
- [ ] Métricas básicas de errores y uso.
- [ ] Plan de respuesta a incidentes.

Criterio de salida:

- existe un procedimiento escrito para contenido, respaldos, actualizaciones e
  incidentes;
- una reforma jurídica puede localizarse y corregirse sin perder historial.

---

## 5. Tracking de las 70 transcripciones

Estados editoriales:

- `inventario`: clasificada de forma preliminar;
- `lectura`: lectura completa en curso;
- `paquete`: contenido preparado;
- `draft`: importada y oculta;
- `review`: revisada y esperando aprobación;
- `published`: visible para estudiantes;
- `integrar`: fragmento que se unirá con otro audio;
- `archivada`: no tiene contenido suficiente para una clase.

| Audio | Estado actual | Paquete | Revisión | Publicación |
|---:|---|---|---|---|
| 01 | published — clase 10, primera clase del curso | [x] | [x] | [x] |
| 02 | published — clase 10, primera clase del curso | [x] | [x] | [x] |
| 03 | parcial — mecanismos publicados en clase 38 y panorama notarial en clase 41; bloques registrales y de propiedad intelectual reservados | [x] | [x] | [x] |
| 04 | published — clase 11, derecho sustantivo y adjetivo | [x] | [x] | [x] |
| 05 | published — clases 11, 12 y 15; contenido distribuido por tema | [x] | [x] | [x] |
| 06 | published — clase 15, controversia constitucional y protección de competencias | [x] | [x] | [x] |
| 07 | published — clase 16, acción de inconstitucionalidad y control abstracto | [x] | [x] | [x] |
| 08 | clasificada — diagnóstico sin reactivos | ➖ | ➖ | ➖ |
| 09 | integrar — banco de práctica | [ ] | [ ] | [ ] |
| 10 | published — clase 17, juicio político y responsabilidad de altos servidores públicos | [x] | [x] | [x] |
| 11 | published — clase 19, derechos político-electorales, JDC y JRC | [x] | [x] | [x] |
| 12 | published — distribuido entre clase 19 electoral y clase 20 de amparo directo | [x] | [x] | [x] |
| 13 | published — clase 21, amparo indirecto: procedencia, interés y acto reclamado | [x] | [x] | [x] |
| 14 | published — clase 12, jurisdicción y competencia | [x] | [x] | [x] |
| 15 | published — clase 12, competencia e incidentes | [x] | [x] | [x] |
| 16 | published — clase 22, audiencia constitucional, sentencia y revisión en amparo indirecto | [x] | [x] | [x] |
| 17 | integrar — banco de práctica interdisciplinario | [ ] | [ ] | [ ] |
| 18 | published — clase 13, Poder Judicial local e instancias | [x] | [x] | [x] |
| 19 | published — clase 23 consolidada; piloto clase 3 retirado sin borrar historial | [x] | [x] | [x] |
| 20 | published — clase 24 consolidada; versión clase 8 retirada sin borrar historial | [x] | [x] | [x] |
| 21 | integrar — banco de práctica interdisciplinario II | [ ] | [ ] | [ ] |
| 22 | published — contenido distribuido entre clases 18, 23, 24 y 25 | [x] | [x] | [x] |
| 23 | published — clase 25, CNDH y protección no jurisdiccional | [x] | [x] | [x] |
| 24 | integrar — conservar solo aclaración jurídica verificada | [ ] | [ ] | [ ] |
| 25 | integrar — banco de práctica interdisciplinario III | [ ] | [ ] | [ ] |
| 26 | published — clase 26, ISR, ingresos, retenciones y deducciones | [x] | [x] | [x] |
| 27 | published — clase 27, IVA e IEPS | [x] | [x] | [x] |
| 28 | published — visita domiciliaria integrada en clase 29 | [x] | [x] | [x] |
| 29 | published — cierre de visita en clase 29 y recurso de revocación en clase 30 | [x] | [x] | [x] |
| 30 | published — nulidad, lesividad e instrucción en clase 31; sentencia y recursos reservados para C23 | [x] | [x] | [x] |
| 31 | published — sentencia, recursos y cumplimiento en clase 32 | [x] | [x] | [x] |
| 32 | integrar — banco de práctica interdisciplinario IV con 33 | [ ] | [ ] | [ ] |
| 33 | integrar — continuación del examen del Audio 32 | [ ] | [ ] | [ ] |
| 34 | published — derechos de la víctima y asesoría jurídica victimal en clase 33 | [x] | [x] | [x] |
| 35 | published — investigación inicial en clase 34 y cierre de investigación complementaria en clase 35 | [x] | [x] | [x] |
| 36 | published — investigación complementaria y etapa intermedia en clase 35 | [x] | [x] | [x] |
| 37 | published — acuerdos reparatorios en clase 36 y suspensión condicional en clase 37 | [x] | [x] | [x] |
| 38 | published — suspensión condicional del proceso en clase 37 | [x] | [x] | [x] |
| 39 | integrar — banco de práctica interdisciplinario V | [ ] | [ ] | [ ] |
| 40 | published — mecanismos alternativos en clase 38 y arbitraje mercantil en clase 39 | [x] | [x] | [x] |
| 41 | published — procedimiento conciliatorio ante PROFECO en clase 40 | [x] | [x] | [x] |
| 42 | integrar — banco de práctica interdisciplinario VI | [ ] | [ ] | [ ] |
| 43 | published — protocolo, apéndice, índice y sello notarial en clase 41 | [x] | [x] | [x] |
| 44 | integrar — banco de práctica interdisciplinario VII | [ ] | [ ] | [ ] |
| 45 | published — actuaciones notariales completadas con fuentes oficiales en clase 42 | [x] | [x] | [x] |
| 46 | published — poderes notariales en clase 43; régimen matrimonial reservado para C53 | [x] | [x] | [x] |
| 47 | published — sociedades mercantiles y asambleas en clase 44 | [x] | [x] | [x] |
| 48 | integrar — banco de práctica interdisciplinario VIII | [ ] | [ ] | [ ] |
| 49 | integrar — banco de práctica interdisciplinario IX | [ ] | [ ] | [ ] |
| 50 | published — marcas en clase 45; patentes y modelos de utilidad en clase 46 | [x] | [x] | [x] |
| 51 | published — diseños industriales y denominaciones de origen en clase 47; derechos de autor en clase 48 | [x] | [x] | [x] |
| 52 | integrar — banco de práctica interdisciplinario X | [ ] | [ ] | [ ] |
| 53 | published — juicio ejecutivo mercantil escrito en clase 49 | [x] | [x] | [x] |
| 54 | lectura — juicio ejecutivo mercantil oral y audiencias | [ ] | [ ] | [ ] |
| 55 | lectura — dividir complemento de embargo y juicio oral; revisar 56 | [ ] | [ ] | [ ] |
| 56 | parcial — estructura de sentencia publicada en clase 14; juicio ordinario mercantil reservado para C43 | [x] | [x] | [x] |
| 57 | published — clase 14, principios, clases y efectos de las resoluciones | [x] | [x] | [x] |
| 58 | lectura — relación individual de trabajo y prestaciones mínimas | [ ] | [ ] | [ ] |
| 59 | lectura — dividir prestaciones, competencia y conciliación laboral | [ ] | [ ] | [ ] |
| 60 | lectura — conciliación y fase escrita laboral; revisar continuidad con 61 | [ ] | [ ] | [ ] |
| 61 | lectura — sindicatos, contrato colectivo y huelga | [ ] | [ ] | [ ] |
| 62 | lectura — jurisdicción voluntaria, consignación e información ad perpetuam | [ ] | [ ] | [ ] |
| 63 | lectura — dividir divorcio voluntario e inicio de sucesiones | [ ] | [ ] | [ ] |
| 64 | lectura — primera y segunda secciones del juicio sucesorio | [ ] | [ ] | [ ] |
| 65 | integrar — banco transversal de comprensión con contenido original | [ ] | [ ] | [ ] |
| 66 | archivar — fragmento deteriorado sobre acción reivindicatoria | ➖ | ➖ | ➖ |
| 67 | parcial — obligaciones fiscales publicadas en clase 28; divorcio incausado reservado para C53 | [x] | [x] | [x] |
| 68 | lectura — alimentos, custodia y medidas provisionales | [ ] | [ ] | [ ] |
| 69 | lectura — dividir arrendamiento especial y práctica de comprensión | [ ] | [ ] | [ ] |
| 70 | integrar — banco de comprensión y lenguaje con contenido original | [ ] | [ ] | [ ] |

---

## 6. Registro de entregas

| Fecha | Entrega | Resultado | Verificación |
|---|---|---|---|
| 2026-07-23 | Documentación inicial | Producto y arquitectura definidos | Aprobación de Fatima |
| 2026-07-23 | Interfaz base | Biblioteca y pantallas académicas | Lint, build y revisión visual |
| 2026-07-23 | Persistencia | Datos académicos en Supabase | Consultas y prueba transaccional |
| 2026-07-23 | Plataforma editorial | Auth, roles, RLS, publicación y progreso | Lint, build y pruebas manuales |
| 2026-07-23 | Inventario | Clasificación preliminar de 70 audios | Catálogo creado |
| 2026-07-23 | Clase piloto Audio 19 | Paquete completo importado como clase 3 | 9 materiales, 3 fuentes, 1 mapa, 12 tarjetas y 10 preguntas |
| 2026-07-23 | Seguridad editorial de publicación | Confirmación obligatoria antes de hacer visible una clase | Validador de contenido, lint, TypeScript y build |
| 2026-07-23 | Publicación de la clase piloto Audio 19 | Clase 3 aprobada y publicada | Estado `published`, fecha de publicación y paquete completo verificados |
| 2026-07-29 | Suite inicial de seguridad RLS | Verificación reproducible con datos temporales y limpieza automática | 12 de 12 comprobaciones aprobadas |
| 2026-07-29 | Auditoría de funciones privilegiadas | Funciones `security definer`, `search_path` y permisos `EXECUTE` revisados | Sin exposiciones indebidas ni cambios de esquema necesarios |
| 2026-07-29 | Ampliación de seguridad RLS | Aislamiento de respuestas y operaciones de progreso incorporados | 16 de 16 comprobaciones aprobadas |
| 2026-07-29 | Asesores de Supabase | Permisos inseguros de `rls_auto_enable()` corregidos | `anon` y `authenticated` sin `EXECUTE`; asesores repetidos |
| 2026-07-29 | Retiro editorial | Estado `withdrawn`, confirmación y conservación del historial | 20 de 20 pruebas RLS, lint, tipos, build y asesores |
| 2026-07-29 | Edición básica de clases | Título y descripción editables desde el panel administrativo | Autorización de servidor, validación, lint, tipos y build |
| 2026-08-10 | Segunda clase de Derecho Administrativo | Audio 20 clasificado e importado como clase 8 en borrador | 9 materiales, mapa visual, guía de preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-10 | Mapas conceptuales visibles | El mapa nativo se muestra directamente en todas las clases, sin depender de una imagen fija ni de un panel cerrado | Compilación de producción aprobada |
| 2026-08-11 | Primera clase cronológica | Audios 01–02 clasificados e importados como clase 10 en borrador | 9 materiales, mapa visual, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, lint y build |
| 2026-08-11 | Publicación de la primera clase cronológica | Clase 10 aprobada por Fatima y publicada | Estado `published`, fecha de publicación y paquete completo verificados |
| 2026-08-11 | Distribución editorial del Audio 03 | Fragmentos asignados a mecanismos alternativos, función notarial, registros y propiedad intelectual; no genera clase aislada | Clasificación alineada con el plan académico maestro |
| 2026-08-11 | Segunda clase cronológica | Audios 04–05 convertidos en la clase 11 y publicados | 9 materiales, mapa visual, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Tercera clase del plan académico | Cierre del Audio 05 y Audios 14–15 convertidos en la clase 12 y publicados | Fuentes constitucionales vigentes, 9 materiales, mapa visual, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Cuarta clase del plan académico | Audio 18 convertido en la clase 13 y publicado | Organización local sin falsas reglas nacionales, 9 materiales, mapa visual, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Quinta clase del plan académico | Secciones pertinentes de los Audios 56–57 convertidas en la clase 14 y publicadas | CNPCF, Ley de Amparo y criterios de la SCJN contrastados; 9 materiales, mapa visual de 19 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Sexta clase del plan académico | Audio 06 y fundamento del Audio 05 convertidos en la clase 15 y publicados | Integración de la SCJN y votación actualizadas al texto constitucional de 2026; 9 materiales, mapa visual de 19 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Séptima clase del plan académico | Audio 07 convertido en la clase 16 y publicado | Control abstracto, legitimación y efectos corregidos al texto vigente; 9 materiales, mapa visual de 20 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Octava clase del plan académico | Audio 10 convertido en la clase 17 y publicado | Juicio político separado correctamente de declaración de procedencia; 9 materiales, mapa visual de 20 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Novena clase del plan académico | Fragmento legislativo del Audio 22 convertido en la clase 18 y publicado | Procedimiento bicameral y reforma constitucional actualizados; 9 materiales, mapa visual de 22 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Décima clase del plan académico | Audio 11 y cierre electoral del Audio 12 convertidos en la clase 19 y publicados | JDC, JRC, legitimación y competencia corregidos al texto vigente; 9 materiales, mapa visual de 23 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Undécima clase del plan académico | Fragmento de amparo del Audio 12 convertido en la clase 20 y publicado | Procedencia, presentación electrónica, suspensión y revisión excepcional actualizadas; 9 materiales, mapa visual de 21 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Duodécima clase del plan académico | Audio 13 convertido en la clase 21 y publicado | Procedencia limitada al artículo 107, legitimación, particular equivalente, acto futuro y suspensión corregidos; 9 materiales, mapa visual de 24 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Decimotercera clase del plan académico | Audio 16 convertido en la clase 22 y publicado | Audiencia, sentencia, revisión y estructura de la SCJN actualizadas al régimen de 2026; 9 materiales, mapa visual de 26 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Decimocuarta clase del plan académico | Audios 19 y 22 consolidados en la clase 23; piloto clase 3 retirado sin eliminarse | APF centralizada y desconcentrada actualizada a la LOAPF de mayo de 2026; 9 materiales, mapa visual de 20 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos, lint y build |
| 2026-08-11 | Decimoquinta clase del plan académico | Audio 20 y bloque administrativo del Audio 22 consolidados en la clase 24; versión clase 8 retirada | Régimen paraestatal actualizado y generalizaciones laborales y fiscales corregidas; 9 materiales, mapa visual de 19 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, lint y build |
| 2026-08-11 | Decimosexta clase del plan académico | Fragmento del Audio 22 y Audio 23 convertidos en la clase 25 y publicados | Competencia, queja, conciliación, recomendación, no responsabilidad y límites corregidos con fuentes oficiales; 9 materiales, mapa visual de 24 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, lint y build |
| 2026-08-11 | Decimoséptima clase del plan académico | Audio 26 convertido en la clase 26 y publicado | Reglas de ISR verificadas; umbrales, RFC sin actividad, deducciones, CFDI y retenciones corregidos; 9 materiales, mapa visual de 24 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, lint y build |
| 2026-08-11 | Decimoctava clase del plan académico | Audio 27 convertido en la clase 27 y publicado | Traslado, acreditamiento, saldo a favor y retención de IVA corregidos; IEPS actualizado a tasas y cuotas de 2026; 9 materiales, mapa visual de 24 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, lint y build |
| 2026-08-11 | Decimonovena clase del plan académico | Primera parte del Audio 67 convertida en la clase 28 y publicada; bloque familiar reservado para C53 | Obligaciones por régimen, RFC, e.firma, Buzón, CFDI y declaraciones contrastados con CFF, LISR y SAT; 9 materiales, mapa visual de 25 nodos, guía de preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, lint y build |
| 2026-08-11 | Vigésima clase del plan académico | Audio 28 y bloque inicial del Audio 29 convertidos en la clase 29 y publicados | Orden, visita, actas, plazos y determinación corregidos conforme a Constitución y CFF vigentes; 9 materiales, mapa visual de 30 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, lint y build |
| 2026-08-11 | Vigesimoprimera clase del plan académico | Segundo bloque del Audio 29 convertido en la clase 30 y publicado | Procedencia, optatividad, Buzón, agravios, prueba, confirmación ficta y efectos actualizados conforme al CFF; 9 materiales, mapa visual de 32 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, lint y build |
| 2026-08-11 | Vigesimosegunda clase del plan académico | Audio 30 convertido en la clase 31 y publicado | Nulidad, lesividad, modalidad, demanda, contestación, prueba, alegatos y cierre actualizados a la reforma LFPCA del 09-06-2026; 9 materiales, mapa visual de 34 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, lint y build |
| 2026-08-11 | Vigesimotercera clase del plan académico | Audio 31 convertido en la clase 32 y publicado | Sentencia, sobreseimiento, efectos de nulidad, reclamación, revisión, amparo directo y queja de cumplimiento actualizados a la reforma LFPCA del 09-06-2026; 9 materiales, mapa visual de 33 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, lint y build |
| 2026-08-11 | Vigesimocuarta clase del plan académico | Audio 34 convertido en la clase 33 y publicado | Clasificación victimal, derechos constitucionales, atención urgente, protección, asesoría y reparación integral depurados de prácticas riesgosas; 9 materiales, mapa visual de 32 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, lint y build |
| 2026-08-11 | Vigesimoquinta clase del plan académico | Audio 35 convertido en la clase 34 y publicado | Investigación inicial, detención, imputación, declaración y vinculación corregidas; 9 materiales, mapa visual de 34 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, validador, lint y build aprobados |
| 2026-08-11 | Vigesimosexta clase del plan académico | Cierre del Audio 35 y Audio 36 convertidos en la clase 35 y publicados | Investigación complementaria, acusación, descubrimiento, audiencia intermedia, acuerdos, exclusión y apertura corregidos; 9 materiales, mapa visual de 32 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, validador, lint y build aprobados |
| 2026-08-11 | Vigesimoséptima clase del plan académico | Primer bloque del Audio 37 convertido en la clase 36 y publicado; suspensión condicional reservada para C28 | Procedencia, exclusiones, oportunidad, principios, aprobación, cumplimiento e incumplimiento corregidos; 9 materiales, mapa visual de 32 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, validador, lint y build aprobados |
| 2026-08-11 | Vigesimoctava clase del plan académico | Cierre del Audio 37 y Audio 38 convertidos en la clase 37 y publicados | Procedencia, media aritmética, oposición fundada, plan, condiciones, supervisión, revocación y sobreseimiento corregidos; 9 materiales, mapa visual de 31 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, validador, lint y build aprobados |
| 2026-08-11 | Vigesimonovena clase del plan académico | Panorama del Audio 03 y primer bloque del Audio 40 convertidos en la clase 38 y publicados | Negociación, mediación, conciliación, confidencialidad, justicia restaurativa y distinción frente a soluciones penales corregidas; 9 materiales, mapa visual de 33 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, validador, lint y build aprobados |
| 2026-08-11 | Trigésima clase del plan académico | Segundo bloque del Audio 40 convertido en la clase 39 y publicado | Convenio arbitral, separabilidad, competencia, procedimiento, laudo, nulidad y ejecución corregidos; 9 materiales, mapa visual de 33 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, validador, lint y build aprobados |
| 2026-08-11 | Trigésima primera clase del plan académico | Audio 41 convertido en la clase 40 y publicado | Competencia, reclamación, representación, audiencia, inasistencias, convenio, dictamen y arbitraje de consumo corregidos; 9 materiales, mapa visual de 33 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, validador, lint y build aprobados |
| 2026-08-11 | Trigésima segunda clase del plan académico | Audio 43 y panorama notarial del Audio 03 convertidos en la clase 41 y publicados | Fe pública, matricidad, protocolo ordinario y digital, apéndice, índice, sello y archivo corregidos por jurisdicción; 9 materiales, mapa visual de 33 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, validador, lint y build aprobados |
| 2026-08-11 | Trigésima tercera clase del plan académico | Audio 45 convertido en la clase 42 y publicado | Ratificación, notificación, requerimiento e interpelación diferenciados; efectos probatorios, falta de coerción, artículo 2080 CCF y protesto corregidos; 9 materiales, mapa visual de 33 nodos, guía de preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, 4 fuentes oficiales, validador, lint y build aprobados |
| 2026-08-11 | Trigésima cuarta clase del plan académico | Primera parte del Audio 46 convertida en la clase 43 y publicada; capitulaciones reservadas para C53 | Dominio, administración, pleitos y facultades especiales separados; forma, registro, uso interestatal, revocación y vigencia corregidos; 9 materiales, mapa visual de 33 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, 3 fuentes oficiales, validador, lint y build aprobados |
| 2026-08-11 | Trigésima quinta clase del plan académico | Audio 47 convertido en la clase 44 y publicado | Constitución, estatutos, RPC, administración, informe anual, asambleas ordinarias y extraordinarias, fusión, transformación, disolución y liquidación corregidos conforme a la LGSM; 9 materiales, mapa visual de 33 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, 3 fuentes oficiales, validador, lint y build aprobados |
| 2026-08-11 | Trigésima sexta clase del plan académico | Primera parte del Audio 50 convertida en la clase 45 y publicada | Concepto, signos tradicionales y no tradicionales, búsqueda, registro, vigencia, uso, declaración, renovación, licencia, transmisión y gravamen actualizados a la reforma LFPPI del 03-04-2026; 9 materiales, mapa visual de 33 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, 3 fuentes oficiales, validador, lint y build aprobados |
| 2026-08-12 | Trigésima séptima clase del plan académico | Segunda parte del Audio 50 convertida en la clase 46 y publicada; Audio 51 reservado íntegramente para C38–C39 | Novedad, estado de la técnica, actividad inventiva, aplicación industrial, reivindicaciones, alcance, vigencia, anualidades y diferencias entre patente y modelo de utilidad actualizados a la reforma LFPPI del 03-04-2026; 9 materiales, mapa visual de 36 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, 3 fuentes oficiales, validador, lint y build aprobados |
| 2026-08-12 | Trigésima octava clase del plan académico | Primer bloque del Audio 51 convertido en la clase 47 y publicado; derechos de autor reservados para C39 | Dibujos y modelos industriales, novedad, límites técnicos, vigencia y renovación; denominación de origen, indicación geográfica, declaración, autorización y uso legal actualizados a la reforma LFPPI del 03-04-2026; 9 materiales, mapa visual de 37 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, 4 fuentes oficiales, validador, lint y build aprobados |
| 2026-08-12 | Trigésima novena clase del plan académico | Segundo bloque del Audio 51 convertido en la clase 48 y publicado; Audio 51 completado | Fijación, autoría, obras protegidas, derechos morales perpetuos, explotación patrimonial, vida más cien años, transmisión escrita, registro, ISBN e ISSN actualizados a la reforma LFDA del 14-05-2026; 9 materiales, mapa visual de 38 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, 4 fuentes oficiales, validador, lint y build aprobados |
| 2026-08-12 | Cuadragésima clase del plan académico | Audio 53 convertido en la clase 49 y publicado; el procedimiento faltante se completó con legislación vigente | Título ejecutivo, vía escrita, requerimiento, embargo, emplazamiento, excepciones, prueba, sentencia, remate, prescripción y control de usura corregidos; 9 materiales, mapa visual de 37 nodos, guía de 12 preguntas y respuestas, 12 tarjetas, 10 reactivos de tres opciones, 4 fuentes oficiales, validador, conteos, lint y build aprobados |

---

## 7. Riesgos y decisiones pendientes

| Riesgo o decisión | Estado | Acción |
|---|---|---|
| Las clases contienen afirmaciones jurídicas desactualizadas | Activo | Contrastar cada clase con fuentes oficiales y fecha de consulta |
| Algunas transcripciones mezclan varias materias | Activo | Dividir por tema o integrar fragmentos relacionados |
| El ruido y errores de transcripción pueden alterar conceptos | Activo | Conservar original y marcar pasajes dudosos |
| Setenta audios producen un volumen grande de revisión | Activo | Trabajar por lotes y aprobar primero un formato piloto |
| Falta prueba automática integral de RLS | Pendiente | Completar Fase B antes de producción |
| Protección contra contraseñas filtradas requiere plan Pro | Pospuesto | Activarla si el proyecto cambia a un plan compatible |
| Falta versionado editorial completo | Pendiente | Completar Fase C |
| Falta despliegue público | Resuelto el despliegue técnico: Vercel conectado a Git, deployment `READY` a la par de `main` (verificado 22-ago-2026); Fase 5 (landing, precios, muestra) ya publicada, pendiente Fase 2 para apertura comercial | Ver `docs/PROJECT_STATUS.md` §5 |
| Automatización con OpenAI | Pospuesta | Evaluar después de consolidar el flujo editorial manual |
| Tutor y calendario | Pospuestos | Evaluar después del lanzamiento inicial |
| Pagos | Producto, precio y proveedor ya decididos (`docs/PROJECT_STATUS.md` §4: $399 MXN/mes vía Stripe, *Sube Legal*); no implementado | No activar checkout ni webhook sin cerrar las Fases 2 y 3 de `docs/PROJECT_STATUS.md` §5 |

---

## 8. Próximas cinco acciones

1. Probar la clase piloto en teléfono y computadora con la sesión privada.
2. Añadir edición de materiales de estudio desde el panel.
3. Probar el acceso de una cuenta no verificada si se reactiva el registro.
4. Preparar Audio 20 cuando esté disponible su transcripción.
5. Incorporar recursos visuales y guías de preguntas y respuestas a cada nueva clase.

---

## 9. Regla de actualización

Al terminar cada sesión:

1. actualizar la fecha;
2. marcar las tareas realmente verificadas;
3. actualizar el estado de cada audio trabajado;
4. registrar la entrega y su evidencia;
5. anotar errores, bloqueos o decisiones;
6. definir las siguientes cinco acciones.

No se publicará ninguna clase solamente por estar importada. Toda clase debe
pasar por `draft`, validación estructural, lint, build y verificación de conteos
en la base. Por autorización permanente de la administradora del 2026-08-12,
cada clase nueva del plan se publicará en la app inmediatamente después de
superar esas comprobaciones, antes de comenzar la siguiente, sin acumular
paquetes pendientes de publicación.
