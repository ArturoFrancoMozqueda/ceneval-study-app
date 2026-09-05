# Respuesta a incidentes

Este procedimiento aplica al servicio actual por invitación y será el punto de
partida si se habilitan cobros. No sustituye obligaciones legales ni
autoriza publicar datos personales, secretos o contenido académico privado.

## Responsabilidades y tiempos

La responsable operativa designada en el registro privado del servicio actúa
como coordinadora. Si no está disponible, la persona suplente designada toma el
control; nunca se improvisan accesos compartiendo contraseñas.

| Severidad | Ejemplos | Acuse | Primera decisión |
| --- | --- | --- | --- |
| SEV-1 | Fuga de datos, acceso cruzado, cobros incorrectos, pérdida de información o servicio inutilizable | 15 min | 30 min |
| SEV-2 | Función principal degradada, errores repetidos o login afectado sin evidencia de fuga | 30 min | 2 h |
| SEV-3 | Defecto acotado con alternativa segura | 1 día hábil | 2 días hábiles |

Los tiempos empiezan cuando la responsable conoce la señal. Mientras no exista
monitoreo continuo, deben registrarse como limitación y no como un SLA ofrecido.

## Procedimiento

1. Abre un registro privado con hora UTC, persona responsable, síntoma,
   deployment y commit. No copies cookies, tokens, correos, respuestas de
   examen ni payloads completos.
2. Clasifica la severidad y conserva evidencia mínima sanitizada. Ante posible
   exposición, revoca sesiones o credenciales comprometidas desde sus paneles;
   no edites secretos dentro de Git.
3. Contén el impacto. Pausa nuevas invitaciones, revoca las sesiones afectadas,
   conserva cerrado el registro público y, si el
   despliegue es la causa, sigue el rollback de
   `docs/DEPLOYMENT_RUNBOOK.md`. Un rollback de Vercel no revierte la base.
4. Verifica integridad antes de recuperar. Para datos, usa únicamente un
   respaldo previamente verificado y un proyecto de ensayo autorizado. Nunca
   pruebes una restauración sobre producción.
5. Recupera y ejecuta health, login, recorrido afectado y revisión de logs.
   Registra resultados sanitizados y quién autorizó volver a operar.
6. Comunica el cierre provisional y abre seguimiento. En cinco días hábiles
   documenta causa, alcance, línea de tiempo, acciones correctivas, responsable
   y fecha objetivo sin culpar a personas.

## Comunicación

La responsable registra y confirma el incidente. Debe mantenerse una lista
privada de destinatarias invitadas y usar el canal de soporte definido para las
usuarias afectadas.

Si hay usuarias afectadas, el primer aviso debe indicar: qué función está
afectada, desde cuándo, qué deben hacer, cuándo habrá otra actualización y un
canal de contacto. No afirmes que no hubo acceso a datos hasta terminar la
investigación. Los avisos de posible violación de datos o impacto fiscal deben
ser revisados por asesoría competente y enviados dentro del plazo aplicable.

## Cierre verificable

El incidente se cierra solo con servicio verificado, alcance documentado,
comunicación completada y acciones con responsable/fecha. Las credenciales
rotadas no se reutilizan. El registro conserva referencias a evidencias, no los
secretos ni los datos personales originales.
