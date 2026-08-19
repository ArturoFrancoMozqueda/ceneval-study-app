# Estado actual y siguientes pasos — CENEVAL Study App

Última actualización: 12 de agosto de 2026  
Responsables: Fatima (administradora y validación) y Codex (desarrollo y contenido)

## 1. Resumen ejecutivo

La aplicación ya tiene un núcleo funcional: autenticación privada, biblioteca por
materias, clases completas, mapas conceptuales, guías, tarjetas, exámenes,
progreso, panel administrativo y persistencia en Supabase.

La base remota fue auditada el 12 de agosto de 2026 y contiene:

| Elemento | Estado real |
| --- | ---: |
| Clases académicas previstas | 58 |
| Clases publicadas | 40 |
| Clases restantes | 18 |
| Avance de clases | 69 % |
| Versiones retiradas conservadas | 2 |
| Materias con clases publicadas | 15 |
| Temas publicados | 40 |
| Materiales publicados | 360 |
| Mapas conceptuales visuales | 40 |
| Flashcards publicadas | 480 |
| Preguntas de examen publicadas | 400 |

La siguiente clase académica es **C41 — Juicio ejecutivo mercantil oral**,
construida con el Audio 54 y la primera parte del Audio 55.

## 2. Aclaración sobre las 40 clases

Las 40 clases sí están publicadas en Supabase, pero no aparecen juntas en la
pantalla de una materia. Están distribuidas entre 15 materias.

La pantalla mostrada por la administradora corresponde únicamente a Derecho
Administrativo. En esa materia existen tres clases publicadas y dos versiones
retiradas. El panel administrativo muestra también las retiradas para conservar
su historial; una estudiante no debería verlas como contenido vigente.

También hay tres numeraciones diferentes que no deben confundirse:

- **Audio 01–70:** orden de las transcripciones originales.
- **C01–C58:** orden académico del plan consolidado.
- **ID de Supabase:** identificador técnico. Por ejemplo, C40 tiene el ID 49.

El ID 49 no significa que existan 49 clases vigentes. Hay saltos porque se
hicieron pruebas y se conservaron versiones retiradas.

## 3. Problema de navegación detectado

La aplicación todavía no ofrece una pantalla que reúna todas las sesiones en
orden. Actualmente:

- `/materias` agrupa el contenido por materia;
- cada materia ordena sus clases por fecha de publicación descendente;
- `/estudiar` enseña solamente los 12 temas creados más recientemente;
- no existe un botón estable de “clase anterior” y “clase siguiente”;
- no se muestra de forma visible el código C01–C58 ni el audio de origen.

Por eso no es posible recorrer cómodamente las clases desde la primera hasta la
última, aunque los registros estén publicados.

## 4. Decisión de producto

Se incorporará una sección llamada **Sesiones** con dos órdenes disponibles:

1. **Orden recomendado:** C01, C02, C03… C58. Este será el orden predeterminado
   para estudiar porque respeta la secuencia pedagógica consolidada.
2. **Orden de audios:** Audio 01, Audio 02… Audio 70. Servirá para localizar qué
   clase recibió cada transcripción, incluso cuando un audio se dividió entre
   dos clases, varios audios se unieron o un audio se destinó a un banco.

Cada tarjeta deberá mostrar código de clase, título, materia, audio o fragmento
de origen, estado y progreso. Solo las clases publicadas formarán parte del
recorrido normal; las retiradas quedarán únicamente en administración.

## 5. Estado técnico actual

### Funciona y está verificado

- Next.js 16.2.11, React 19.2.4 y TypeScript.
- Aplicación local en `http://localhost:3000`.
- Supabase remoto enlazado y con datos persistentes.
- Inicio de sesión y recuperación de contraseña.
- Modo privado limitado a la administradora.
- Roles y políticas RLS.
- Flujo editorial `draft → published → withdrawn`.
- Importador y validador de paquetes académicos.
- Conservación de la transcripción original y versión didáctica.
- Nueve materiales por tema.
- Mapa conceptual visual integrado en cada clase.
- Guía de preguntas y respuestas.
- Flashcards y registro de revisiones.
- Examen con respuestas protegidas hasta entregar el intento.
- Progreso individual.
- Búsqueda de contenido publicado.
- Edición básica y retiro desde el panel administrativo.
- Suite RLS de 20 comprobaciones aprobada en la última auditoría registrada.
- `npm run lint` y `npm run build` aprobados después de la clase C40.

### Parcial o pendiente

- Vista cronológica de todas las sesiones.
- Navegación anterior/siguiente entre clases.
- Filtrado completo de contenido retirado en todas las pantallas de estudio.
- Presentación clara del avance total del plan.
- Historial y análisis profundo de temas débiles.
- Exámenes acumulativos de los 16 módulos.
- Tres bancos transversales de práctica.
- Pruebas automatizadas de interfaz y recorridos completos.
- Auditoría final de accesibilidad y uso móvil.
- Despliegue formal en Vercel: no existe una vinculación local `.vercel`
  comprobable en esta auditoría.
- Dominio, monitoreo, respaldos y manual de operación.
- Acceso público de estudiantes, expresamente pospuesto por ahora.

## 6. Contenido académico terminado

Están publicadas C01–C40:

- C01–C05: orientación, fundamentos y teoría procesal.
- C06–C09: constitucional y responsabilidad pública.
- C10–C13: electoral y amparo.
- C14–C16: administrativo y CNDH.
- C17–C23: fiscal y justicia administrativa.
- C24–C28: proceso penal.
- C29–C31: mecanismos alternativos, arbitraje y consumo.
- C32–C34: notarial y registral.
- C35: sociedades mercantiles.
- C36–C39: propiedad intelectual.
- C40: juicio ejecutivo mercantil escrito.

Cada clase publicada contiene, como estándar, una transcripción conservada, una
versión depurada, nueve materiales, un mapa visual, una guía, doce flashcards,
diez reactivos originales y fuentes verificables.

## 7. Clases restantes, en orden de producción

| Orden | Clase pendiente | Fuente principal | Resultado requerido |
| --- | --- | --- | --- |
| 1 | C41 Juicio ejecutivo mercantil oral | Audio 54 + primera parte de 55 | Paquete completo, validado y publicado |
| 2 | C42 Juicio oral mercantil | Segunda parte de 55 | Completar cierre con Código de Comercio vigente |
| 3 | C43 Juicio ordinario mercantil escrito | Primera parte de 56 | Confirmar procedencia actual frente a oralidad |
| 4 | C44 Relación individual de trabajo y prestaciones | Audio 58 + primera parte de 59 | Actualizar salarios y reglas vigentes |
| 5 | C45 Terminación laboral | Primera parte de 59 | Separar finiquito e indemnización |
| 6 | C46 Competencia y conciliación prejudicial laboral | Segunda parte de 59 + inicio de 60 | Verificar excepciones a conciliación |
| 7 | C47 Juicio ordinario laboral | Segunda parte de 60 | Completar demanda, réplica y audiencias |
| 8 | C48 Sindicatos, contrato colectivo y huelga | Audio 61 | Contrastar con LFT vigente |
| 9 | C49 Jurisdicción voluntaria | Audio 62 | Consignación e información ad perpetuam |
| 10 | C50 Arrendamiento inmobiliario especial oral | Primera parte de 69 | Condicionar al régimen territorial aplicable |
| 11 | C51 Regímenes patrimoniales del matrimonio | Segunda parte de 46 | Definir legislación local aplicable |
| 12 | C52 Divorcio voluntario y convenio familiar | Primera parte de 63 | Integrar convenio y control judicial |
| 13 | C53 Divorcio sin expresión de causa | Segunda parte de 67 | Distinguir código nacional y régimen local |
| 14 | C54 Medidas familiares provisionales | Audio 68 | Alimentos, custodia y convivencia |
| 15 | C55 Apertura de sucesión | Segunda parte de 63 | Testamentaria e intestamentaria |
| 16 | C56 Herederos y albacea | Cierre de 63 + inicio de 64 | Primera sección sucesoria |
| 17 | C57 Inventario, avalúo y oposición | Audio 64 | Segunda sección sucesoria |
| 18 | C58 Administración, partición y adjudicación | Sin fuente suficiente | Crear con legislación oficial y revisión reforzada |

## 8. Plan específico para terminar el proyecto

### Prioridad 0 — Hacer visible el orden de estudio

1. Crear una migración para agregar a cada clase `curriculum_code`,
   `curriculum_order` y la relación con sus audios de origen.
2. Cargar la correspondencia completa C01–C58 y Audio 01–70.
3. Agregar la consulta de todas las clases publicadas ordenadas por
   `curriculum_order`.
4. Crear `/sesiones` con las vistas “Orden recomendado” y “Orden de audios”.
5. Mostrar en cada tarjeta el código, número de sesión, materia y audio fuente.
6. Añadir botones “Anterior” y “Siguiente” dentro de cada clase.
7. Ocultar versiones `withdrawn` fuera del panel administrativo.
8. Probar que C01 abre primero, C40 aparece en su posición y C41 se incorpora
   automáticamente cuando se publique.

**Criterio de terminado:** la administradora puede comenzar en C01 y avanzar
una por una sin entrar manualmente a cada materia; también puede localizar una
transcripción por su número de audio.

### Prioridad 1 — Completar C41–C58

Para cada clase, sin acumular borradores:

1. leer las fuentes de audio y marcar sus cortes;
2. separar contenido útil, errores y material que debe excluirse;
3. consultar legislación y fuentes oficiales vigentes;
4. redactar primero guía y mapa visual;
5. completar los nueve materiales;
6. crear de 10 a 15 flashcards y diez reactivos de tres opciones;
7. ejecutar `content:check`;
8. ejecutar lint y build;
9. importar como borrador;
10. verificar en Supabase todos los conteos;
11. publicar inmediatamente si todo pasa;
12. comprobar que aparezca en `/sesiones` y actualizar el roadmap.

**Criterio de terminado:** 58 de 58 clases publicadas y accesibles en orden.

### Prioridad 2 — Práctica acumulativa

1. Crear B01, diagnóstico y estrategia de examen.
2. Crear B02, banco interdisciplinario con los audios de revisión.
3. Crear B03, comprensión lectora y lenguaje con textos originales.
4. Crear un examen acumulativo original para cada uno de los 16 módulos.
5. Etiquetar cada error por materia y competencia.
6. Mostrar recomendaciones basadas en respuestas reales.

**Criterio de terminado:** los tres bancos y 16 exámenes modulares pueden
resolverse sin revelar previamente las respuestas y conservan historial.

### Prioridad 3 — Calidad del producto

1. Agregar pruebas automáticas para inicio de sesión, sesiones, clase, mapa,
   guía, flashcards, examen y progreso.
2. Repetir la suite RLS y los asesores de seguridad.
3. Confirmar que borradores y retiradas no sean visibles fuera de administración.
4. Probar recuperación de contraseña con correo real.
5. Revisar accesibilidad: teclado, foco, contraste, etiquetas y lectores.
6. Probar resoluciones de teléfono, tableta y computadora.
7. Corregir estados de carga, error y listas vacías.
8. Medir tiempos de carga de las páginas con 58 clases.

**Criterio de terminado:** flujos centrales aprobados automáticamente, sin
errores críticos de accesibilidad, permisos o navegación.

### Prioridad 4 — Despliegue y operación

1. Crear o vincular el proyecto de Vercel.
2. Configurar variables de producción sin exponer la clave secreta.
3. Configurar URLs de redirección de Supabase Auth para producción.
4. Desplegar una vista previa y recorrer el flujo completo.
5. Promover el despliegue aprobado a producción.
6. Definir dominio propio si se desea.
7. Activar registros y monitoreo de errores.
8. Documentar respaldo, restauración y actualización legal.
9. Crear manual breve para administrar, publicar y retirar clases.
10. Decidir después si se habilitará registro de estudiantes.

**Criterio de terminado:** existe una URL estable de producción, el flujo
privado funciona fuera de localhost y la administradora puede operar la app con
un manual.

## 9. Próximas diez tareas ejecutables

| # | Tarea | Evidencia para cerrarla |
| ---: | --- | --- |
| 1 | Implementar metadatos de orden y fuentes de audio | Migración aplicada y 40 clases rellenadas |
| 2 | Crear la página `/sesiones` | C01–C40 visibles en orden recomendado |
| 3 | Agregar la vista por número de audio | Audio 01–70 localizables con su destino |
| 4 | Incorporar navegación anterior/siguiente | Recorrido continuo C01 → C40 |
| 5 | Corregir `/estudiar` | No se limita arbitrariamente a 12 temas recientes |
| 6 | Crear y publicar C41 | Conteos, lint y build aprobados |
| 7 | Crear y publicar C42 | Conteos, lint y build aprobados |
| 8 | Crear y publicar C43 | Módulo procesal mercantil completo |
| 9 | Crear y publicar C44 | Inicio del módulo laboral |
| 10 | Ejecutar prueba de regresión | Sesiones, contenido, RLS y progreso aprobados |

## 10. Riesgos y controles

| Riesgo | Control requerido |
| --- | --- |
| Confundir ID técnico con número de clase | Mostrar siempre código Cxx y ocultar el ID como dato principal |
| Perder el orden entre materias | Usar `curriculum_order`, no fecha de publicación |
| Mostrar contenido retirado | Filtrar `publication_status = published` en vistas de estudio |
| Cambios legislativos | Registrar fecha de consulta y revisar antes de publicar |
| Audio incompleto o erróneo | Conservar original y completar solo con fuentes oficiales |
| Crecer contenido sin pruebas | Validar, compilar y verificar cada clase antes de avanzar |
| Exponer secretos | Mantener la clave secreta solo en servidor y variables protegidas |
| Depender únicamente de localhost | Completar despliegue y prueba en producción |

## 11. Definición final de terminado

El proyecto se considerará terminado cuando:

- existan 58 clases publicadas y navegables en orden;
- estén disponibles los tres bancos y 16 exámenes acumulativos;
- mapas, guías, flashcards, exámenes y progreso funcionen en todas las clases;
- borradores, respuestas y progreso estén protegidos por permisos verificados;
- los flujos centrales tengan pruebas automáticas;
- la experiencia sea accesible en teléfono y computadora;
- exista una URL estable de producción;
- haya un manual de administración, respaldo y mantenimiento;
- Fatima apruebe el recorrido completo desde C01 hasta el cierre del plan.

## 12. Siguiente acción inmediata

Antes de producir C41, implementar la vista **Sesiones** y el orden académico y
por audios. Esto resolverá el problema actual de encontrar las 40 clases y hará
que todas las siguientes aparezcan automáticamente en el lugar correcto.
