# Auditoría de producto y experiencia vendible — 29 de agosto de 2026

## Dictamen

Sube Legal no necesita convertirse en un clon de Duolingo ni rehacerse desde
cero. Ya tiene una base pedagógica más apropiada para personas adultas que
preparan el EGEL de Derecho: lecciones breves, recuperación activa, casos,
repaso espaciado, práctica adaptativa, fuentes verificables y progreso que
distingue actividad de desempeño.

El artículo de Oyelabs se tomó como inventario de producto, no como evidencia
pedagógica. Sus ideas aplicables son onboarding simple, contenido estructurado,
variedad de práctica, personalización y progreso visible. No aplican por ahora
reconocimiento de voz, comunidad, anuncios, puntos, rachas, insignias ni tablas
competitivas.

## Hallazgos prioritarios

1. **La promesa de niveles no coincidía con la interfaz.** Marketing decía que
   completar un examen permitía avanzar, pero `/sesiones` solo mostraba una
   cuadrícula plana y su porcentaje medía lectura. La nueva dirección es una
   ruta curricular C01–C57: el primer examen pendiente determina la sesión
   recomendada, un examen terminado acredita la sesión y el resto de la
   biblioteca sigue disponible.
2. **La práctica adaptativa estaba escondida.** El motor de recuperación es una
   de las mejores diferencias del producto, pero no figuraba en la navegación
   principal. Ahora se presenta como trabajo primario bajo **Practicar**.
3. **El inicio recomendaba el último tema tocado aunque ya estuviera leído.**
   La recomendación ahora reanuda una lección incompleta; después dirige a la
   primera sesión cuyo examen sigue pendiente.
4. **La exploración competía con la recomendación.** La elección manual de los
   57 temas permanece disponible, pero se muestra con divulgación progresiva
   para conservar una acción principal clara.
5. **La búsqueda solo revisaba títulos.** Se amplió a títulos y descripciones,
   con contexto de materia, código curricular y clase, y con un estado inicial
   que enseña cómo buscar.
6. **Había detalles que reducían confianza.** La lección tenía tres pasos pero
   anunciaba “1/5”, “2/5” y “3/5”. También faltaba orientar el foco al cambiar
   el panel y dos acciones textuales no alcanzaban el estándar táctil interno
   de 44 px.

## Experiencia objetivo

```text
Inicio
  → reanudar una lección incompleta
  → o continuar la primera sesión sin examen terminado
  → practicar lo que necesita refuerzo
  → consultar progreso y evidencia

Mi ruta
  → sesión actual destacada
  → lectura consultada (recorrido)
  → examen terminado (acreditación)
  → ruta completa siempre explorable

Practicar
  → recomendación adaptativa principal
  → intentar antes de mirar
  → contrastar la clave
  → ajustar el siguiente repaso
  → elección manual secundaria
```

## Lo que falta para validar la experiencia

- Piloto invitado con personas que realmente preparen el EGEL de Derecho.
- Métricas consentidas de activación, tiempo a primera práctica, retorno D1/D7,
  sesiones significativas por semana y mejora entre intentos.
- Pruebas manuales a 320, 375, 768 y 1280 px; teclado completo, NVDA, zoom al
  200 %, alto contraste y movimiento reducido.
- Unificar en una segunda etapa el resumen legacy de flashcards/quick checks
  con el motor de recuperación adaptativa para evitar conteos contradictorios.
- Hacer transaccional la calificación adaptativa y dividir el paquete de tema
  por modo para no cargar material que la pantalla actual no usa.

## Bloqueos comerciales que esta reestructuración no resuelve

La app todavía no puede cobrar. Siguen abiertos los gates de
`docs/PROJECT_STATUS.md`: Vercel apto para uso comercial, Supabase con respaldo
gestionado, dominio y correo transaccional, entorno de ensayo, prueba
multiusuario, confirmación fiscal, operación y las etapas de entitlements y
Stripe. Esta auditoría no autoriza abrir registro ni pagos.

