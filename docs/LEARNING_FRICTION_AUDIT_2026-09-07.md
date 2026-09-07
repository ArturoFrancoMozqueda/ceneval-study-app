# Aprender con menos fricción — 7 de septiembre de 2026

Revisión del inicio, ruta curricular, lección, práctica adaptativa y examen,
desde `bbba44d`. Objetivo: facilitar decidir qué hacer, recuperar conocimientos,
comparar el razonamiento y volver a estudiar con una acción clara.

La evidencia combina revisión de código, contratos existentes y un recorrido de
solo lectura con una cuenta de estudiante autorizada. No es una observación de
la estudiante usando la app ni una medición de mejora de retención. No se modifica el
corpus jurídico, las claves, el algoritmo de intervalos ni el acceso por invitación.

## Hallazgos y entregas

| Prioridad | Fricción comprobada | Efecto esperado | Corrección / estado |
| --- | --- | --- | --- |
| Alta | Entrar a un tema abría práctica; la vista breve requería otro clic y la comprobación precedía a la explicación. | Hace difícil encontrar el material necesario para aprender antes de recuperar. | PR #31: lectura por defecto, vista breve visible y explicación antes de la comprobación. |
| Alta | Inicio: el enlace para continuar una lección omitía `modo=leccion`, aunque prometía retomar lo pausado (`home-dashboard.tsx`). | Obliga a reconstruir dónde se estaba y cambiar de modo. | Entrega 1: enlace al modo y paso guardados. |
| Alta | Inicio: solo contaban lectura y exámenes como actividad; practicar podía devolver a la bienvenida. El plan se calculaba después de esa salida. | Oculta el trabajo realizado y la ronda que falta terminar. | Entrega 1: consulta el plan antes de decidir la bienvenida y prioriza la ronda activa. |
| Alta | El borrador desaparece de la pantalla al revelar la clave (`adaptive-practice.tsx`). | Exige recordar lo escrito a la vez que se compara; favorece juzgar por familiaridad. | Entrega 2: respuesta original visible junto a los criterios, sin editarla tras revelar. |
| Alta | Las tarjetas del corpus adaptativo no construyen `contextHref`, aunque la interfaz ya ofrece apoyo cuando existe. Una ronda pendiente puede pertenecer a otro tema que el abierto. | Quien no comprende no tiene acceso directo a la lección de esa pregunta. | Entrega 2: enlace al tema real de cada reactivo, en otra pestaña para conservar el borrador. |
| Media | Cambiar de ronda o repetirla tiene rutas asíncronas sin recuperación completa de excepciones. | Un fallo puede dejar la pantalla preparando indefinidamente. | Entrega 2: estados de error recuperables y bloqueo mientras se procesa; no presentar una carga fallida como ronda terminada. |
| Media | Tres tarjetas de modos, descripción, aviso y otra introducción preceden a la actividad (`topic-detail.tsx`). | Especialmente en móvil, desplaza la primera pregunta lejos del inicio. | Entrega 2: navegación compacta y textos de orientación más breves. |
| Media | Tras el examen, el cierre invita principalmente a repetir las mismas preguntas (`exam-player.tsx`). | Puede favorecer recuerdo de opciones sin corregir el razonamiento. | Entrega 2: acceso a lección y práctica desde el resultado; repetición disponible. |
| Media | Las comprobaciones de lección revelan solución y feedback, pero no registran ni interpretan el razonamiento. | No hay evidencia suficiente para atribuir comprensión. | Pendiente: observar uso antes de añadir una evaluación o captura adicional. |
| Media | El borrador y el detalle interno de la lección no sobreviven a recarga. | Interrupciones pueden obligar a repetir trabajo. | Pendiente: diseñar persistencia privada con caducidad; la política actual prohíbe persistir respuestas libres. No prometer reanudación exacta de cada interacción. |

## Análisis de carga cognitiva

### Tarea y desglose

Una egresada de Derecho conecta hechos, norma, razonamiento y conclusión: cuatro
elementos relacionados como mínimo, además de excepciones según el tema. La carga
intrínseca puede ser alta; no equivale a un defecto de interfaz ni permite asignar
una capacidad universal de memoria de trabajo.

La carga ajena al aprendizaje es innecesariamente alta en los cambios de modo y
la comparación con un borrador oculto: reconstrucción de contexto, información
transitoria y atención dividida. Los encabezados repetidos añaden lectura operativa.

El esfuerzo productivo se mantiene: intentar sin clave, explicar por qué, contrastar
puntos necesarios y volver a recuperar después de un intervalo. No se elimina la
confianza previa ni se muestran respuestas del examen antes de entregar.

### Modificaciones y experiencia previa

La prioridad de inicio es: ronda activa → lección incompleta → repaso recomendado
→ primera sesión curricular pendiente → centro de práctica. Es una decisión de
producto revisable, no un algoritmo científicamente validado. La biblioteca continúa
permitiendo elegir otros temas.
Cuando coinciden una ronda activa y una lección incompleta, el inicio también
ofrece «Volver a mi lección» para no ocultar la lectura pausada.

El apoyo debe ser opcional para quien ya conoce el tema: acceso directo a lección,
práctica y examen, sin obligar a recorrer nueve materiales reformulados. Se conserva
la jerarquía editorial ya implementada en agosto. Para principiantes, los ejemplos
y la explicación siguen accesibles; para avanzadas, no se impone repetirlos.

## Bucle formativo: justificar una respuesta jurídica

**Objetivo:** recuperar y justificar la solución, detectar qué falta y practicarlo.
**Situación actual:** confianza previa → clave → autoevaluación → agenda.
**Diseño:** conservar la respuesta original al contrastar y conectar cada dificultad
con la lección correspondiente antes del siguiente intento.

### Dentro de cada pregunta

1. Respuesta mental, en papel o borrador opcional; confianza antes de revelar.
2. Comparación con puntos requeridos, errores comunes y evidencia existente.
3. Identificar qué faltó en el razonamiento; autoevaluarse sin corregir retroactivamente
   el borrador. No hay calificación automática del texto.
4. Consultar apoyo cuando sea necesario y continuar la ronda.

### Entre preguntas y sesiones

Se conserva `spacing-v1`: error reinserta el reactivo y programa otro repaso;
respuesta parcial retrocede etapa; respuesta correcta con dudas no avanza como una
respuesta segura. No se diagnostica una idea errónea con una sola autoevaluación.

| Evidencia | Interpretación posible | Respuesta |
| --- | --- | --- |
| No recuerda | Falta de recuperación en este intento | Comparar, consultar lección y repetir según agenda existente. |
| Respuesta parcial | Puede faltar regla, excepción o conexión con hechos | Localizar el punto ausente en la clave; revisar su explicación. |
| Correcta con dudas | Recuperación aún frágil | Conservar el refuerzo programado. |
| Segura pero incorrecta | Posible confusión; no diagnóstico definitivo | Revisar errores comunes y razonamiento antes de repetir. |

### Información para revisión y validación

El progreso por materia y el historial ya existen; no se agrega otro panel sin
evidencia de necesidad. Lectura completada, autoevaluación y resultado de examen
deben seguir distinguiéndose: ninguno demuestra por sí solo retención o transferencia.

Validación propuesta con estudiantes invitadas, sin telemetría nueva:

1. Observar tres tareas: retomar una lección, terminar una ronda y corregir un error.
   Registrar cambios de pantalla innecesarios y peticiones de ayuda.
2. Comprobar que pueden explicar qué faltó en su respuesta al comparar con la clave.
3. Revisar una recuperación diferida a los siete días y un caso diferente que exija
   la misma regla. No usar solo velocidad, satisfacción o repetir las mismas opciones.
4. Si no mejora la comprensión, revisar ejemplos y calidad de distractores por tema,
   mediante el proceso editorial; no añadir más botones, puntos o lecturas por defecto.

Fundamento consultado el 7 de septiembre de 2026: [IES, Organizing Instruction and
Study to Improve Student Learning](https://ies.ed.gov/ncee/wwc/practiceguide/1),
sobre recuperación, espaciado, ejemplos y juicio del propio aprendizaje. Su evidencia
orienta estas decisiones; no prueba todavía sus efectos en esta app.

## Verificación técnica

Las dos entregas aprobaron `npm run test:local`, `npm run lint` y `npm run build`.
El recorrido de Chromium con Supabase local pasó para
[continuidad, junto con la entrada de lectura](https://github.com/ArturoFrancoMozqueda/ceneval-study-app/actions/runs/34146211490)
y para [la combinación completa](https://github.com/ArturoFrancoMozqueda/ceneval-study-app/actions/runs/34146216329).
Incluye acceso invitado y aceptación sintética, permisos editoriales, navegación de
biblioteca, lectura visible antes de comprobaciones, reanudación desde el inicio,
comparación de borrador, apoyo en otra pestaña, ronda completa, examen e historial.
La comparación también se comprueba a 360 px sin desbordamiento horizontal; el
segundo run conserva capturas de contenido exclusivamente sintético durante siete días.

Cambios entregados en [PR #31](https://github.com/ArturoFrancoMozqueda/ceneval-study-app/pull/31)
(lectura, preparado anteriormente), [PR #33](https://github.com/ArturoFrancoMozqueda/ceneval-study-app/pull/33)
(continuidad) y [PR #34](https://github.com/ArturoFrancoMozqueda/ceneval-study-app/pull/34)
(comparación y apoyo). El recorrido con la cuenta autorizada fue de solo lectura:
no se entregaron respuestas ni se modificó su avance para probar los cambios.

La prueba integral detectó un bloqueo anterior del entorno local: en Supabase CLI
2.115.0, `auth.email.enable_signup` se traduce a `ExternalEmailEnabled`, por lo que
desactivarlo impide incluso entrar con cuentas invitadas. Se conserva
`auth.enable_signup = false` y se habilita el proveedor de correo. El fixture
comprueba antes del navegador que la cuenta sintética puede entrar y que un intento
de registro devuelve `signup_disabled`. No se cambia Supabase remoto.
[Mapeo oficial del CLI](https://github.com/supabase/cli/blob/v2.115.0/apps/cli-go/pkg/config/auth.go).
