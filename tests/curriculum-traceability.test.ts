import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  classPackageFileSchema,
  importableClassPackageSchema,
} from "../lib/content/package-schema";
import {
  assertClassPackageRoundTrip,
  countClassPackage,
} from "../lib/content/package-roundtrip";

const traceablePackages = [
  {
    code: "C01",
    fileName: "audio-01-02-orientacion-egel-derecho.json",
    artifacts: 139,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [],
  },
  {
    code: "C02",
    fileName: "audio-04-05-derecho-sustantivo-adjetivo.json",
    artifacts: 130,
    evidence: 17,
    forbiddenClaims: [
      /código federal de procedimientos civiles/i,
      /\bCFPC\b/i,
      /(?:método|proceso|procedimiento)(?:\s+\w+){0,3}\s+(?:de\s+)?siete pasos/i,
      /\b(?:sucesi(?:ón|ones)|sucesorio|testamentario|intestado|herederos?)\b/i,
    ],
    requiredClaims: [],
  },
  {
    code: "C03",
    fileName: "audio-05-14-15-jurisdiccion-competencia.json",
    artifacts: 133,
    evidence: 12,
    forbiddenClaims: [
      /no pueden interpretar la constitución/i,
      /ejecutoria\s+34098/i,
      /\b(?:todos?|cualquier)\s+(?:los\s+)?incidentes?\s+suspenden?/i,
    ],
    requiredClaims: [],
  },
  {
    code: "C04",
    fileName: "audio-18-poder-judicial-local.json",
    artifacts: 133,
    evidence: 12,
    forbiddenClaims: [
      /michoacán/i,
      /ley orgánica del poder judicial del estado de michoacán/i,
      /\b100\s+UMA\b/i,
      /\b(?:toda|cualquier)\s+sentencia\s+(?:es|será)\s+apelable\b/i,
    ],
    requiredClaims: [],
  },
  {
    code: "C05",
    fileName: "audio-56-57-resoluciones-judiciales.json",
    artifacts: 137,
    evidence: 14,
    forbiddenClaims: [/ejecutoria\s+22318/i, /\b1000710\b/],
    requiredClaims: [
      /procesos civiles y familiares/i,
      /aplicación gradual/i,
      /esta clasificación es propia del código nacional: en otras materias debe consultarse la legislación correspondiente/i,
      /no es una fórmula obligatoria universal/i,
    ],
  },
  {
    code: "C06",
    fileName: "audio-05-06-controversia-constitucional.json",
    artifacts: 137,
    evidence: 18,
    forbiddenClaims: [/última reforma DOF 03-04-2025/i],
    requiredClaims: [
      /nueve (?:integrantes|ministras y ministros)/i,
      /(?:al menos|cuando menos|mayoría de) seis votos/i,
      /última reforma DOF 14-11-2025/i,
    ],
  },
  {
    code: "C07",
    fileName: "audio-07-accion-inconstitucionalidad.json",
    artifacts: 138,
    evidence: 10,
    forbiddenClaims: [/última reforma DOF 03-04-2025/i],
    requiredClaims: [
      /treinta días naturales/i,
      /(?:al menos|cuando menos|mayoría de) seis votos/i,
      /nueve integrantes/i,
      /treinta y tres por ciento de la Cámara de Diputados puede impugnar leyes federales/i,
      /mismo porcentaje del Senado, leyes federales o tratados/i,
      /no suspende la norma/i,
    ],
  },
  {
    code: "C08",
    fileName: "audio-10-juicio-politico.json",
    artifacts: 138,
    evidence: 15,
    forbiddenClaims: [
      /cualquier persona (?:puede|podrá) (?:presentar|formular) (?:una )?denuncia/i,
      /artículos 5 a 45/i,
      /presidente.*sujeto.*juicio político ordinario/i,
      /Consejo de la Judicatura Federal/i,
    ],
    requiredClaims: [
      /cualquier ciudadano/i,
      /destitución.*inhabilitación/i,
      /Ley General de Responsabilidades Administrativas: régimen distinto para faltas administrativas/i,
      /declaración de procedencia es autónoma/i,
      /Tribunal de Disciplina Judicial/i,
      /órgano de administración judicial/i,
      /última reforma DOF 01-04-2024/i,
    ],
  },
  {
    code: "C09",
    fileName: "audio-22-procedimiento-legislativo-federal.json",
    artifacts: 140,
    evidence: 13,
    forbiddenClaims: [
      /energía (?:e hidrocarburos )?(?:debe|deberá|tiene que) iniciar en (?:la Cámara de )?Diputados/i,
      /(?:toda|cualquier) iniciativa (?:debe|deberá) (?:dictaminarse|votarse|aprobarse) en treinta días/i,
    ],
    requiredClaims: [
      /máximo de treinta días naturales en cada Cámara; (?:es una regla especial, )?no (?:es )?un plazo general/i,
      /no aplica a reformas constitucionales/i,
      /empréstitos, contribuciones o impuestos y reclutamiento de tropas/i,
      /fecha prevista en transitorios o conforme a la regla supletoria aplicable/i,
      /veto significa dejar el asunto para otro periodo.*Corrección: es devolución con observaciones/i,
    ],
  },
  {
    code: "C10",
    fileName: "audio-11-12-derechos-electorales.json",
    artifacts: 141,
    evidence: 18,
    forbiddenClaims: [
      /Ley General de los Medios de Impugnación en Materia Electoral/i,
      /per saltum (?:siempre|automáticamente) (?:procede|está disponible)/i,
    ],
    requiredClaims: [
      /plazo general de cuatro días/i,
      /per saltum es excepcional/i,
      /dentro del plazo (?:que regía para|del) medio previo/i,
      /recurso de reconsideración.*supuestos extraordinarios/i,
      /organismos públicos locales electorales.*autonomía/i,
      /No\. La competencia entre Sala Superior y salas regionales depende/i,
      /última reforma DOF 14-11-2025/i,
    ],
  },
  {
    code: "C11",
    fileName: "audio-12-amparo-directo.json",
    artifacts: 139,
    evidence: 21,
    forbiddenClaims: [
      /Tribunal Unitario/i,
      /(?:siempre|únicamente) (?:se )?presenta (?:directamente )?ante (?:el )?Tribunal Colegiado/i,
    ],
    requiredClaims: [
      /plazo general es de quince días, pero no es universal/i,
      /treinta días para norma autoaplicativa o extradición/i,
      /hasta ocho años contra sentencia penal definitiva con prisión/i,
      /amparo adhesivo.*quince días.*notificación del acuerdo de admisión/i,
      /revisión ante la Suprema Corte solo procede.*interés excepcional/i,
      /contar solo tres excepciones.*artículo 17 vigente contiene cuatro fracciones/i,
    ],
  },
  {
    code: "C12",
    fileName: "audio-13-amparo-indirecto-procedencia.json",
    artifacts: 142,
    evidence: 16,
    forbiddenClaims: [],
    requiredClaims: [
      /nueve grupos: normas generales autoaplicativas/i,
      /beneficio cierto y no meramente hipotético o eventual/i,
      /imposible reparación.*derecho sustantivo/i,
      /tribunal colegiado de apelación, no tribunal unitario/i,
      /Esto no convierte WhatsApp en vía general/i,
      /El amparo puede promoverse antes o después de una detención/i,
      /plazos diferenciados/i,
    ],
  },
  {
    code: "C13",
    fileName: "audio-16-amparo-indirecto-audiencia-sentencia-revision.json",
    artifacts: 144,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [
      /fallo debe dictarse en un plazo máximo de noventa días naturales/i,
      /sobreseer no declara constitucional el acto/i,
      /revisión.*dentro de diez días.*por conducto del órgano que dictó la resolución/i,
      /nueve integrantes y funcionamiento en Pleno, con posibilidad de dos secciones/i,
      /antiguas cifras de cinco integrantes en Primera Sala y once en Pleno/i,
    ],
  },
  {
    code: "C14",
    fileName: "audio-19-22-poder-ejecutivo-apf-centralizada.json",
    artifacts: 138,
    evidence: 12,
    forbiddenClaims: [/última reforma DOF 16-07-2025/i],
    requiredClaims: [
      /última reforma DOF 07-05-2026/i,
      /Secretarías de Estado y la Consejería Jurídica son dependencias centralizadas/i,
      /órganos administrativos desconcentrados jerárquicamente subordinados/i,
      /No existe una vía única por el solo hecho de que el acto sea federal/i,
    ],
  },
  {
    code: "C15",
    fileName: "audio-20-organismos-descentralizados.json",
    artifacts: 137,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [
      /creada por ley o decreto, con personalidad jurídica y patrimonio propios/i,
      /coordinación sectorial no equivale a subordinación jerárquica/i,
      /autonomía interna equivale a autonomía constitucional/i,
      /No generalices el régimen laboral, fiscal ni la vía de defensa/i,
      /última reforma DOF 07-05-2026/i,
      /última reforma DOF 16-07-2025/i,
    ],
  },
  {
    code: "C16",
    fileName: "audio-22-23-cndh.json",
    artifacts: 142,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [
      /regla general es un año.*excepciones razonadas para infracciones graves/i,
      /recomendación.*pública y no imperativa: por sí misma no repara, no anula actos ni sanciona directamente/i,
      /negativa debe fundarse, motivarse y hacerse pública/i,
      /no conoce actos y resoluciones electorales, resoluciones jurisdiccionales/i,
      /queja no suspende los plazos de otros medios de defensa/i,
      /artículo 105, fracción II, inciso g\)/i,
    ],
  },
  {
    code: "C17",
    fileName: "audio-26-isr-ingresos-retenciones-deducciones.json",
    artifacts: 142,
    evidence: 15,
    forbiddenClaims: [
      /(?:umbral|límite) (?:general|universal) de (?:400|500)[,.]?000 pesos/i,
      /tasa fija (?:general )?de 30%/i,
    ],
    requiredClaims: [
      /persona moral paga servicios profesionales a una persona física de este régimen, debe retener 10%/i,
      /CFDI es necesario en muchos casos, pero no suficiente/i,
      /500,000 pesos.*función informativa distinta.*no crea la regla general/i,
      /última reforma DOF 09-04-2026/i,
    ],
  },
  {
    code: "C18",
    fileName: "audio-27-iva-ieps.json",
    artifacts: 142,
    evidence: 10,
    forbiddenClaims: [
      /tasa general (?:del )?IVA (?:es|de) 14%/i,
      /IEPS significa impuesto especial sobre productos y servicios/i,
    ],
    requiredClaims: [
      /tasa general es 16%; también existen actos a tasa 0%, exentos y no objeto/i,
      /acreditarlo contra IVA de meses siguientes.*solicitar devolución/i,
      /estímulos fronterizos no crean una tasa general de 14%/i,
      /tasas porcentuales y cuotas/i,
      /cuotas actualizadas DOF 22-12-2025/i,
    ],
  },
  {
    code: "C19",
    fileName: "audio-67-obligaciones-fiscales-regimen.json",
    artifacts: 143,
    evidence: 18,
    forbiddenClaims: [],
    requiredClaims: [
      /no se afirma que toda persona inscrita tenga exactamente la misma obligación/i,
      /salarios que excedan 400,000 pesos/i,
      /No uses 500,000 pesos como umbral salarial vigente/i,
      /primera modificación (?:del )?9 de julio de 2026/i,
    ],
  },
  {
    code: "C20",
    fileName: "audio-28-29-visita-domiciliaria.json",
    artifacts: 148,
    evidence: 15,
    forbiddenClaims: [],
    requiredClaims: [
      /artículo 42, fracción III.*practicar visitas.*revisión de gabinete de la fracción II/i,
      /revisión electrónica de la fracción IX.*visitas de verificación de la fracción V/i,
      /aseguramiento tampoco es una consecuencia ordinaria de cualquier visita/i,
      /doce meses.*excepciones y suspensiones/i,
      /seis meses desde el acta final, sujeto a suspensiones/i,
      /acuerdo conclusivo.*PRODECON/i,
      /recurso de revocación.*optativo antes de acudir al tribunal/i,
    ],
  },
  {
    code: "C21",
    fileName: "audio-29-recurso-revocacion-fiscal.json",
    artifacts: 150,
    evidence: 18,
    forbiddenClaims: [],
    requiredClaims: [
      /optativa la revocación antes del juicio contencioso administrativo federal/i,
      /silencio confirma fictamente el acto/i,
      /interposición tampoco suspende automáticamente el cobro/i,
      /cuantía superior a doscientas UMA elevadas al año/i,
      /última reforma DOF 09-04-2026/i,
    ],
  },
  {
    code: "C22",
    fileName: "audio-30-juicio-contencioso-instruccion.json",
    artifacts: 152,
    evidence: 14,
    forbiddenClaims: [],
    requiredClaims: [
      /reforma integral DOF 09-06-2026/i,
      /tracto sucesivo.*cinco años desde el último efecto.*retrotrae sus efectos a los cinco años anteriores/i,
      /autoridad es demandante, presenta siempre en línea/i,
      /vía sumaria tampoco es una modalidad de libre elección/i,
      /con o sin alegatos, la instrucción queda cerrada automáticamente/i,
    ],
  },
  {
    code: "C23",
    fileName: "audio-31-sentencia-recursos-cumplimiento.json",
    artifacts: 151,
    evidence: 16,
    forbiddenClaims: [],
    requiredClaims: [
      /cuatro meses en ordinario y uno en sumario/i,
      /quince días; por omisión puede promoverse mientras el derecho no prescriba/i,
      /diez días; cinco para cautelares/i,
      /recurso de revisión del artículo 63 es de procedencia tasada/i,
      /Amparo directo, previo agotamiento de recursos ordinarios procedentes/i,
    ],
  },
  {
    code: "C24",
    fileName: "audio-34-derechos-victima-asesoria.json",
    artifacts: 150,
    evidence: 19,
    forbiddenClaims: [],
    requiredClaims: [
      /calidad victimal no depende de que se conozca, detenga o condene/i,
      /asesor no es defensor del imputado ni sustituye al Ministerio Público/i,
      /inscripción.*no equivale por sí sola a conceder automáticamente una compensación/i,
      /asesoría federal y las locales actúan dentro de sus competencias/i,
      /Constitución vigente al 02-06-2026/i,
      /Código Nacional de Procedimientos Penales vigente al 28-11-2025/i,
    ],
  },
  {
    code: "C25",
    fileName: "audio-35-investigacion-detencion-vinculacion.json",
    artifacts: 152,
    evidence: 19,
    forbiddenClaims: [],
    requiredClaims: [
      /retención ministerial no puede exceder 48 horas.*duplicarla hasta 96 horas en delincuencia organizada/i,
      /72 horas desde la puesta a disposición o comparecencia.*144 horas/i,
      /controla la detención solo cuando corresponde por flagrancia o caso urgente/i,
      /Vinculación no significa prisión automática/i,
      /Constitución vigente al 02-06-2026/i,
      /CNPP vigente al 28-11-2025/i,
      /Ley Nacional sobre el Uso de la Fuerza vigente al 24-01-2024/i,
    ],
  },
  {
    code: "C26",
    fileName: "audio-35-36-investigacion-complementaria-intermedia.json",
    artifacts: 150,
    evidence: 21,
    forbiddenClaims: [],
    requiredClaims: [
      /investigación complementaria inicia con la formulación de imputación/i,
      /máximo es de dos meses.*seis meses/i,
      /artículo 324 otorga únicamente al Ministerio Público quince días/i,
      /reapertura del artículo 333 tampoco reinicia libremente la investigación/i,
      /no puede integrar el tribunal de enjuiciamiento/i,
      /Constitución vigente al 02-06-2026/i,
      /CNPP vigente al 28-11-2025/i,
    ],
  },
  {
    code: "C27",
    fileName: "audio-37-acuerdos-reparatorios.json",
    artifacts: 150,
    evidence: 15,
    forbiddenClaims: [],
    requiredClaims: [
      /mismos delitos dolosos.*violencia familiar o equivalentes.*incumplió previamente un acuerdo/i,
      /DOF el 20-08-2025.*no es una exclusión vigente/i,
      /hasta treinta días, a petición de las partes/i,
      /si es diferido y no se fija plazo, se entiende un año/i,
      /puede acudir al juez dentro de cinco días/i,
      /cumplimiento parcial de contenido pecuniario debe ser tomado en cuenta/i,
      /junta restaurativa, específicamente, el artículo 29/i,
      /CNPP vigente al 28-11-2025/i,
    ],
  },
  {
    code: "C28",
    fileName: "audio-37-38-suspension-condicional.json",
    artifacts: 149,
    evidence: 20,
    forbiddenClaims: [],
    requiredClaims: [
      /media aritmética de la pena de prisión no exceda cinco años/i,
      /dos años desde el cumplimiento o cinco desde el incumplimiento/i,
      /DOF el 20-08-2025.*No debe aplicarse como exclusión vigente/i,
      /periodo de seis meses a tres años/i,
      /No hay revocación, reaprehensión ni prisión automáticas/i,
      /plazo hasta dos años más, una sola vez/i,
      /condiciones y su plazo se interrumpen.*se reanudan al recuperar la libertad/i,
      /suspensión condicional interrumpe la prescripción de la acción penal/i,
      /CNPP vigente al 28-11-2025/i,
    ],
  },
  {
    code: "C29",
    fileName: "audio-03-40-negociacion-mediacion-conciliacion-restaurativa.json",
    artifacts: 151,
    evidence: 15,
    forbiddenClaims: [],
    requiredClaims: [
      /Constitución no contiene por sí sola una lista completa de técnicas o principios/i,
      /negociación.*por sí mismas, con o sin intermediarios/i,
      /En materia penal puede proponer soluciones/i,
      /justicia restaurativa no es exclusiva de materia penal/i,
      /comunidad no es obligatoria en todos los casos/i,
      /confidencialidad.*No es absoluta/i,
      /mecanismo con resultado/i,
      /LGMASC: nueva ley DOF 26-01-2024, sin reformas/i,
      /LNMASCMP vigente al 01-04-2024/i,
    ],
  },
  {
    code: "C30",
    fileName: "audio-40-arbitraje-mercantil.json",
    artifacts: 151,
    evidence: 16,
    forbiddenClaims: [],
    requiredClaims: [
      /artículos 1424, 1425 y 1461 a 1463 también operan cuando el lugar del arbitraje está fuera de México/i,
      /no existe una formalidad única/i,
      /primer escrito sobre la sustancia del asunto/i,
      /regla supletoria es un árbitro.*no reserva el cargo a corredores públicos/i,
      /corrección, interpretación o laudo adicional/i,
      /La nulidad judicial es tasada/i,
      /irrecurribilidad específica no autoriza a afirmar que toda decisión vinculada con un arbitraje carece de medio de impugnación/i,
      /no declara secreto automático para todo arbitraje mercantil/i,
      /última reforma legal DOF 14-11-2025/i,
      /Acuerdo DOF 18-02-2026.*no constituye una reforma del régimen arbitral/i,
    ],
  },
  {
    code: "C31",
    fileName: "audio-41-procedimiento-conciliatorio-profeco.json",
    artifacts: 151,
    evidence: 15,
    forbiddenClaims: [],
    requiredClaims: [
      /carta poder firmada ante dos testigos/i,
      /medida de apremio y se cita a segunda audiencia.*diez días/i,
      /Solo si tampoco asiste a la segunda.*presume cierto/i,
      /archivo provisional durante diez días naturales.*solo si no justifica.*desistido/i,
      /convenio aprobado.*fuerza de cosa juzgada.*trae aparejada ejecución/i,
      /no convierte el convenio en pagaré/i,
      /título ejecutivo no negociable.*cierta, exigible y líquida/i,
      /Concilianet.*proveedores adheridos/i,
      /última reforma DOF 12-12-2025/i,
      /Acuerdo DOF 23-12-2025.*no se trata de una reforma sustantiva/i,
    ],
  },
  {
    code: "C32",
    fileName: "audio-03-43-funcion-notarial-protocolo.json",
    artifacts: 151,
    evidence: 13,
    forbiddenClaims: [],
    requiredClaims: [
      /exclusivamente el modelo de Ciudad de México/i,
      /protocolo ordinario, el Libro de Registro de Cotejos.*protocolo digital/i,
      /no existe una lista idéntica.*para todo asunto/i,
      /índice electrónico.*control y localización/i,
      /firma electrónica notarial.*firma autógrafa y al sello/i,
      /sello reportado perdido reaparece, no recupera vigencia/i,
      /transmisión con gravamen no existe una respuesta automática/i,
      /última reforma GOCDMX 04-08-2021/i,
    ],
  },
  {
    code: "C33",
    fileName: "audio-45-actuaciones-notariales.json",
    artifacts: 151,
    evidence: 13,
    forbiddenClaims: [],
    requiredClaims: [
      /La distinción depende de la legislación local/i,
      /no garantiza.*automáticamente acción ejecutiva/i,
      /no demuestra que la relación contractual haya quedado modificada/i,
      /treinta días después de la interpelación judicial o extrajudicial ante notario o dos testigos/i,
      /No es correcto afirmar automáticamente nulidad absoluta/i,
      /protestar conserva indefinidamente un pagaré o reinicia automáticamente la prescripción/i,
      /última reforma GOCDMX 04-08-2021/i,
      /última reforma DOF 14-11-2025/i,
      /última reforma DOF 26-03-2024/i,
    ],
  },
  {
    code: "C34",
    fileName: "audio-46-poderes-notariales.json",
    artifacts: 151,
    evidence: 15,
    forbiddenClaims: [],
    requiredClaims: [
      /separar ese vínculo interno de la representación/i,
      /No confiere por sí mismo administración o dominio/i,
      /no significa que el documento otorgue automáticamente las otras dos categorías/i,
      /No existe inscripción universal para todo poder/i,
      /tampoco fija una duración general automática de tres o cinco años/i,
      /mandato se dio para tratar con una persona determinada.*notificarle la revocación/i,
      /entrada en vigor es gradual.*1 de abril de 2027/i,
      /última reforma DOF 14-11-2025/i,
    ],
  },
  {
    code: "C35",
    fileName: "audio-47-sociedades-mercantiles.json",
    artifacts: 151,
    evidence: 14,
    forbiddenClaims: [],
    requiredClaims: [
      /La autorización del nombre no crea la sociedad/i,
      /La SAS es excepción.*procedimiento electrónico especial/i,
      /Antes de la inscripción.*responder ilimitada y solidariamente/i,
      /asamblea general de accionistas es el órgano supremo de la sociedad anónima/i,
      /videoconferencia no significa por sí solo celebrar fuera del domicilio social/i,
      /dentro de los cuatro meses siguientes al cierre/i,
      /actas ordinarias se asientan en el libro.*actas extraordinarias se protocolizan.*RPC/i,
      /disolución anticipada.*no borra obligaciones/i,
      /última reforma DOF 20-10-2023/i,
      /acuerdo DOF 26-12-2025/i,
    ],
  },
  {
    code: "C36",
    fileName: "audio-50-marcas.json",
    artifacts: 151,
    evidence: 17,
    forbiddenClaims: [],
    requiredClaims: [
      /No garantiza registro: la autoridad examina impedimentos/i,
      /El derecho exclusivo nace con el registro/i,
      /diez años desde la fecha de otorgamiento/i,
      /tres meses posteriores a que se cumpla el tercer año/i,
      /protección continúa solo respecto de aquellos declarados/i,
      /sin presentar toda licencia como una inscripción universalmente constitutiva/i,
      /transmisión y gravamen se inscriben ante el IMPI para producir efectos en perjuicio de terceras personas/i,
      /decreto DOF 03-04-2026/i,
      /Reglamento publicado el 28-04-2026/i,
    ],
  },
  {
    code: "C37",
    fileName: "audio-50-patentes-modelos-utilidad.json",
    artifacts: 154,
    evidence: 13,
    forbiddenClaims: [],
    requiredClaims: [
      /conocimientos técnicos accesibles al público en México o en el extranjero/i,
      /patente requiere simultáneamente novedad, actividad inventiva y aplicación industrial/i,
      /reclamados exclusivamente como tales, no se consideran invenciones/i,
      /reivindicaciones.*determinan el alcance concedido/i,
      /veinte años improrrogables contados desde la fecha de presentación/i,
      /modelo de utilidad.*mejoras funcionales/i,
      /no enumera.*actividad inventiva como requisito autónomo/i,
      /quince años improrrogables desde la fecha de presentación/i,
      /no garantiza concesión ni libertad de operación/i,
      /periodo de doce meses.*no debe asumirse que todos los países/i,
      /ultima reforma DOF 03-04-2026/i,
    ],
  },
  {
    code: "C38",
    fileName: "audio-51-disenos-denominaciones-origen.json",
    artifacts: 155,
    evidence: 14,
    forbiddenClaims: [],
    requiredClaims: [
      /apariencia ornamental y ventaja funcional no son lo mismo/i,
      /vigencia inicial es de cinco años desde la fecha de presentación/i,
      /hasta un máximo de veinticinco/i,
      /denominación de origen exige una relación exclusiva o esencial más intensa/i,
      /bienes nacionales.*no se apropia del nombre como marca individual/i,
      /No existe una renovación decenal de la declaración/i,
      /denominación de origen acredita la NOM y para indicación geográfica las reglas de uso/i,
      /autorizacion dura diez años desde su solicitud/i,
      /‘tipo’, ‘género’, ‘manera’ o ‘imitación’/i,
      /reforma DOF 03-04-2026/i,
      /Reglamento DOF 28-04-2026/i,
    ],
  },
  {
    code: "C39",
    fileName: "audio-51-derechos-autor.json",
    artifacts: 156,
    evidence: 16,
    forbiddenClaims: [],
    requiredClaims: [
      /persona física que crea una obra literaria o artística/i,
      /protección comienza cuando la obra se fija en un soporte material/i,
      /no depende.*registro/i,
      /derechos morales.*inalienables, imprescriptibles, irrenunciables e inembargables/i,
      /vida del autor y cien años después de su muerte/i,
      /transmisión debe ser onerosa y temporal/i,
      /contratos y licencias deben constar por escrito o serán nulos/i,
      /registro no autoriza explotar la obra primigenia/i,
      /ISBN.*identifica una edición; ISSN identifica publicaciones periódicas/i,
      /última reforma DOF 14-05-2026/i,
    ],
  },
  {
    code: "C40",
    fileName: "audio-53-juicio-ejecutivo-mercantil-escrito.json",
    artifacts: 155,
    evidence: 24,
    forbiddenClaims: [],
    requiredClaims: [
      /documento trae aparejada ejecución/i,
      /acción cambiaria prescribe.*tres años desde el vencimiento/i,
      /umbral corregido del artículo 1339 es 924,300\.58 pesos/i,
      /no tienen un tope universal de dos o tres por ciento mensual/i,
      /requerimiento de pago; si no se paga, embargo.*y emplazamiento/i,
      /remisi[oó]n expresa del articulo 1393/i,
      /ocho días para hacer pago llano o contestar/i,
      /vista al actor por tres días/i,
      /sentencia.*dentro de ocho días/i,
      /última reforma DOF 14-11-2025 y montos corregidos el 18-02-2026/i,
    ],
  },
  {
    code: "C41",
    fileName: "audio-54-55-juicio-ejecutivo-mercantil-oral.json",
    artifacts: 150,
    evidence: 16,
    forbiddenClaims: [],
    requiredClaims: [
      /documento.*artículo 1391/i,
      /924,300\.58 pesos.*límite inferior/i,
      /consulta ambos límites del año aplicable/i,
      /contestación (?:es )?en ocho días/i,
      /no hay reconvención/i,
      /recursos ordinarios.*excluidos/i,
      /aval.*no es sinónimo de depositario/i,
    ],
  },
  {
    code: "C42",
    fileName: "audio-55-juicio-oral-mercantil.json",
    artifacts: 153,
    evidence: 15,
    forbiddenClaims: [],
    requiredClaims: [
      /controversias mercantiles que no tengan procedimiento especial/i,
      /cuantía.*determinada o determinable/i,
      /no existe una apelación ordinaria/i,
      /contestar en nueve días/i,
      /audiencia preliminar.*depura/i,
      /regularización, aclaración o adición/i,
      /no se utilizó el Audio 56/i,
    ],
  },
  {
    code: "C43",
    fileName: "audio-56-juicio-ordinario-mercantil-escrito.json",
    artifacts: 148,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [
      /no es hoy la vía general/i,
      /cuantía indeterminada.*supuesto ordinario más claro/i,
      /elección de la parte demandada cuando opone quita o pago/i,
      /contestar en quince días/i,
      /primeros diez para ofrecimiento y los treinta siguientes para desahogo/i,
      /alegatos por tres días comunes/i,
      /plazo de quince días para la sentencia definitiva/i,
      /línea 201.*pertenece a C05/i,
    ],
  },
  {
    code: "C44",
    fileName: "audio-58-59-relacion-individual-trabajo.json",
    artifacts: 154,
    evidence: 16,
    forbiddenClaims: [],
    requiredClaims: [
      /trabajo personal subordinado.*mediante.*salario/i,
      /falta.*escrito.*no priva.*derechos/i,
      /durante 2026 permanece en 48 horas/i,
      /40 en 2030/i,
      /doce días laborables/i,
      /prima vacacional mínima.*veinticinco por ciento/i,
      /aguinaldo mínimo.*quince días/i,
      /antes del veinte de diciembre/i,
      /tope de tres meses de salario.*promedio.*últimos tres años/i,
      /No se utilizó el Audio 59/i,
      /última reforma DOF 14-05-2026/i,
    ],
  },
  {
    code: "C45",
    fileName: "audio-59-terminacion-laboral.json",
    artifacts: 148,
    evidence: 9,
    forbiddenClaims: [],
    requiredClaims: [
      /finiquito.*no es una fórmula única/i,
      /no toda terminación genera acumulativamente tres meses, veinte días por año/i,
      /prima de antigüedad.*supuestos de procedencia/i,
      /prescripción tampoco es un plazo único/i,
      /no se fingieron subrangos/i,
      /última reforma DOF 14-05-2026/i,
    ],
  },
  {
    code: "C46",
    fileName: "audio-59-60-competencia-conciliacion-laboral.json",
    artifacts: 150,
    evidence: 16,
    forbiddenClaims: [],
    requiredClaims: [
      /lo no federal corresponde a autoridades locales dentro del Apartado A/i,
      /no se generaliza a personas servidoras públicas del Apartado B/i,
      /no puede exceder cuarenta y cinco días naturales/i,
      /artículo 685 Ter exceptúa/i,
      /Centro.*no dicta sentencia/i,
      /línea 3 del Audio 59 se excluyó por completo/i,
      /última reforma DOF 14-05-2026/i,
    ],
  },
  {
    code: "C47",
    fileName: "audio-60-juicio-ordinario-laboral.json",
    artifacts: 148,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [
      /no existe la regla del audio de “más de tres salarios”/i,
      /tribunal laboral federal no debe llamarse automáticamente juzgado de distrito/i,
      /contesta por escrito en quince días/i,
      /actora tiene ocho días/i,
      /demandada cuenta con cinco días/i,
      /carga probatoria no recae siempre en el patrón/i,
      /excepcionalmente puede emitirse dentro de cinco días/i,
      /última reforma DOF 14-05-2026/i,
    ],
  },
  {
    code: "C48",
    fileName: "audio-61-sindicatos-contrato-colectivo-huelga.json",
    artifacts: 150,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [
      /veinte trabajadores.*tres patrones/i,
      /revisión general.*ciclo de dos años/i,
      /salarios en efectivo por cuota diaria.*cada año/i,
      /huelga es suspensión temporal/i,
      /objeto.*mayoría.*artículo 920/i,
      /excluyeron.*líneas físicas gigantes 29 y 33/i,
      /no se fingieron sublíneas/i,
      /última reforma DOF 14-05-2026/i,
    ],
  },
  {
    code: "C49",
    fileName:
      "audio-62-jurisdiccion-voluntaria-consignacion-informacion-ad-perpetuam.json",
    artifacts: 150,
    evidence: 10,
    forbiddenClaims: [],
    requiredClaims: [
      /Michoacán y competencia territorial/i,
      /depositar una cantidad elegida unilateralmente no garantiza liberación/i,
      /cinco testigos sólo donde el código lo ordena/i,
      /no universalices.*certificado negativo/i,
      /cualquier bien sin dueño aparente.*regularizarse por esta vía/i,
      /CNPCF no se mezcló con el régimen local/i,
    ],
  },
  {
    code: "C50",
    fileName: "audio-69-arrendamiento-inmobiliario-especial-oral.json",
    artifacts: 151,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [
      /no se afirma vigencia actual en Michoacán sin declaratoria/i,
      /quince días desde el emplazamiento para contestar/i,
      /no hay una audiencia preliminar separada/i,
      /no equivale a desocupación o lanzamiento automático/i,
      /líneas 33 en adelante.*quedaron totalmente fuera/i,
      /última reforma DOF 15-01-2026/i,
    ],
  },
  {
    code: "C51",
    fileName: "audio-46-regimenes-patrimoniales-capitulaciones-matrimoniales.json",
    artifacts: 153,
    evidence: 10,
    forbiddenClaims: [],
    requiredClaims: [
      /línea 113 es extensa.*únicamente.*afirmación sobre formalidad/i,
      /no toda capitulación requiere escritura pública/i,
      /artículo 171 condiciona la escritura/i,
      /artículo 194 impide afirmar.*siempre debe constar en escritura/i,
      /separación absoluta o parcial/i,
      /última reforma POE 24-10-2024/i,
    ],
  },
  {
    code: "C52",
    fileName: "audio-63-divorcio-voluntario-convenio-familiar.json",
    artifacts: 150,
    evidence: 10,
    forbiddenClaims: [],
    requiredClaims: [
      /contenido sucesorio de la línea 57 en adelante quedó fuera/i,
      /impago.*no produce por sí mismo pérdida automática/i,
      /patria potestad es distinta de la custodia/i,
      /no se renuncia por convenio/i,
      /salida internacional.*consentimiento o determinación judicial fundada/i,
      /última reforma publicada 24-10-2024/i,
    ],
  },
  {
    code: "C53",
    fileName: "audio-67-divorcio-sin-expresion-causa-bilateral.json",
    artifacts: 154,
    evidence: 16,
    forbiddenClaims: [],
    requiredClaims: [
      /Cobertura editorial del fragmento 169–265/i,
      /Código Nacional no opera automáticamente en Michoacán/i,
      /artículo 663 es una vía oral familiar general/i,
      /pérdida o suspensión requiere una causa legal, valoración de hechos y resolución judicial/i,
      /última reforma publicada 24-10-2024/i,
    ],
  },
  {
    code: "C54",
    fileName: "audio-68-medidas-familiares-provisionales.json",
    artifacts: 149,
    evidence: 11,
    forbiddenClaims: [],
    requiredClaims: [
      /líneas extensas se localizaron completas, sin inventar sublíneas/i,
      /No\. Se valora el interés superior, la capacidad de cuidado y las circunstancias particulares/i,
      /mención en el audio no acredita procedencia universal/i,
      /artículo 474 exige promover el aumento o disminución/i,
      /última reforma publicada 24-10-2024/i,
    ],
  },
  {
    code: "C55",
    fileName: "audio-63-apertura-sucesion-testamentaria-intestamentaria.json",
    artifacts: 153,
    evidence: 18,
    forbiddenClaims: [],
    requiredClaims: [
      /Cobertura editorial exclusiva de las líneas físicas 63–155/i,
      /los testigos de identificación no son tres ni intervienen siempre/i,
      /declaración formal del ológrafo exige intervención judicial/i,
      /Código Nacional ofrece un régimen notarial más detallado sujeto a entrada gradual/i,
      /última reforma publicada 30-11-2023/i,
    ],
  },
  {
    code: "C56",
    fileName: "audio-63-64-primera-seccion-sucesoria.json",
    artifacts: 149,
    evidence: 10,
    forbiddenClaims: [],
    requiredClaims: [
      /211–231 se evaluaron y excluyeron/i,
      /no sostienen comparecencia, parentesco, edictos, notificación, plazos ni voto/i,
      /Audio 64.*37–45.*no para aceptación o protesta/i,
      /Denunciar no equivale a heredar/i,
      /última reforma publicada 30-06-2020/i,
    ],
  },
  {
    code: "C57",
    fileName: "audio-64-inventario-avaluo-oposicion-sucesoria.json",
    artifacts: 149,
    evidence: 10,
    forbiddenClaims: [],
    requiredClaims: [
      /Cobertura exclusiva de las líneas físicas 47–109/i,
      /línea física 109 sólo como contexto amplio/i,
      /apelación automática/i,
      /bienes omitidos pueden agregarse/i,
      /reemplaza automáticamente hoy el procedimiento michoacano/i,
      /última reforma publicada 30-06-2020/i,
    ],
  },
] as const;

function collectUsedEvidenceIds(value: unknown, key = ""): Set<string> {
  const result = new Set<string>();
  if (
    (key === "evidenceIds" || key.endsWith("EvidenceIds")) &&
    Array.isArray(value)
  ) {
    for (const evidenceId of value) {
      if (typeof evidenceId === "string") result.add(evidenceId);
    }
    return result;
  }
  if (!value || typeof value !== "object") return result;

  for (const [childKey, childValue] of Object.entries(value)) {
    for (const evidenceId of collectUsedEvidenceIds(childValue, childKey)) {
      result.add(evidenceId);
    }
  }
  return result;
}

function expectedSourceOrigin(
  evidenceIds: string[],
  evidenceKinds: Map<string, "official" | "transcript">,
) {
  const kinds = new Set(evidenceIds.map((id) => evidenceKinds.get(id)));
  assert.ok(!kinds.has(undefined));
  if (kinds.size === 2) return "mixed";
  return kinds.has("transcript") ? "class" : "complementary";
}

for (const expected of traceablePackages) {
  test(`${expected.code} conserva ${expected.artifacts} artefactos trazables y un round-trip 1.2 íntegro`, async () => {
    const packagePath = path.join(
      process.cwd(),
      "content",
      "packages",
      expected.fileName,
    );
    const packageFile = classPackageFileSchema.parse(
      JSON.parse(await readFile(packagePath, "utf8")),
    );
    assert.equal(packageFile.packageVersion, "1.2");
    if (packageFile.packageVersion !== "1.2") {
      throw new Error(`${expected.code} debe usar el contrato trazable 1.2.`);
    }
    assert.equal(packageFile.curriculum.code, expected.code);

    const serializedPackage = JSON.stringify(packageFile);
    for (const forbiddenClaim of expected.forbiddenClaims) {
      assert.doesNotMatch(
        serializedPackage,
        forbiddenClaim,
        `${expected.code} reintrodujo una afirmación retirada: ${forbiddenClaim}`,
      );
    }
    for (const requiredClaim of expected.requiredClaims) {
      assert.match(
        serializedPackage,
        requiredClaim,
        `${expected.code} perdió una precisión jurídica requerida: ${requiredClaim}`,
      );
    }

    const cleanedTranscript = packageFile.transcript.cleaned;
    assert.ok(cleanedTranscript);
    const bundle = importableClassPackageSchema.parse({
      ...packageFile,
      transcript: {
        original: cleanedTranscript,
        cleaned: cleanedTranscript,
      },
    });

    if (expected.code === "C06" || expected.code === "C07") {
      const questions = bundle.topics.flatMap((topic) => topic.exam.questions);
      for (const question of questions) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          /(?:once|11) (?:ministros|integrantes)|(?:ocho|8) votos/i,
          `${expected.code} no puede presentar la integración o votación histórica como respuesta vigente.`,
        );
      }

      const obsoleteCompositionQuestion = questions.find(
        (question) =>
          /(?:once|11) (?:ministros|integrantes)/i.test(question.text) ||
          question.options.some((option) =>
            /(?:once|11) (?:ministros|integrantes)/i.test(option),
          ),
      );
      assert.ok(obsoleteCompositionQuestion);
      assert.match(
        obsoleteCompositionQuestion.options[
          obsoleteCompositionQuestion.correctOption
        ] ?? "",
        expected.code === "C06"
          ? /nueve integrantes.*artículo 94 vigente/i
          : /nueve integrantes.*seis votos/i,
      );
      if (expected.code === "C06") {
        assert.match(
          obsoleteCompositionQuestion.explanation,
          /desactualizado.*nueve integrantes/i,
        );
      } else {
        assert.match(
          JSON.stringify(obsoleteCompositionQuestion.optionExplanations),
          /cifras anteriores a la reforma/i,
        );
      }
    }

    if (expected.code === "C09" || expected.code === "C10") {
      const obsoleteAsCurrent =
        expected.code === "C09"
          ? /energía.*iniciar en Diputados|veto.*(?:siguiente|otro) periodo|toda iniciativa.*treinta días/i
          : /todo asunto federal.*Sala Superior|OPLE.*(?:depende|subordinad).*INE|per saltum.*siempre/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla retirada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C11" || expected.code === "C12") {
      const obsoleteAsCurrent =
        expected.code === "C11"
          ? /quince días sin excepciones|tres excepciones|revisión ordinaria.*(?:SCJN|Corte)/i
          : /Tribunal Unitario|WhatsApp|solo antes de (?:la )?detención|(?:madre|padre|familiar).*autoridad/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla histórica o absoluta como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C13" || expected.code === "C14") {
      const obsoleteAsCurrent =
        expected.code === "C13"
          ? /once integrantes|Primera Sala.*cinco|toda revisión.*Suprema Corte/i
          : /centralizada.*desconcentrada.*descentralizada|todo acto federal.*misma vía|órgano desconcentrado.*independiente/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una estructura histórica o regla absoluta como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C15" || expected.code === "C16") {
      const obsoleteAsCurrent =
        expected.code === "C15"
          ? /organismo descentralizado.*subordinado jerárquicamente|patrimonio propio.*recursos privados|autonomía de gestión.*autonomía constitucional/i
          : /CNDH.*(?:dicta sentencia|encarcela|destituye|anula)|recomendación.*(?:vinculante|repara automáticamente)|queja.*suspende.*plazo/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una generalización retirada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C17" || expected.code === "C18") {
      const obsoleteAsCurrent =
        expected.code === "C17"
          ? /(?:400|500)[,.]?000 pesos.*(?:umbral|límite) (?:general|universal)|tasa fija.*30%|CFDI.*(?:basta|garantiza).*deducci/i
          : /tasa (?:general )?(?:de )?14%|saldo a favor.*compens.*ISR|destruir inventario.*devolución|todo servicio extranjero.*IEPS/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una cifra obsoleta o generalización retirada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C19" || expected.code === "C20") {
      const obsoleteAsCurrent =
        expected.code === "C19"
          ? /500[,.]?000 pesos|toda AC.*exenta|trabajador.*no (?:hace|presenta) nada|toda persona.*Buzón/i
          : /crédito fiscal.*(?:es|equivale).*multa|siempre.*dos visitadores|aseguramiento automático|toda revisión.*(?:doce meses|cinco ejercicios)|(?:acuerdo conclusivo|recurso de revocación).*siempre/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una generalización fiscal retirada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C21" || expected.code === "C22") {
      const obsoleteAsCurrent =
        expected.code === "C21"
          ? /(?:siempre|obligatorio).*antes.*TFJA|presentación física.*regla|silencio.*(?:revoca|favorece)|suspensión automática|todo recurso.*exclusivo de fondo/i
          : /TFJA.*subordinado.*Ejecutivo|Buzón Tributario.*(?:presenta|tramita).*juicio|vía sumaria.*libre elección|testimonial.*(?:prohibida|inadmisible)|plazo general.*cuarenta y cinco días/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla procesal retirada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C23" || expected.code === "C24") {
      const obsoleteAsCurrent =
        expected.code === "C23"
          ? /toda nulidad.*lisa y llana|autoridad.*siempre.*revisión|amparo indirecto.*sentencia definitiva|queja.*recurso contra sentencia|garantía.*suspensión automática/i
          : /asesor.*(?:defensor del imputado|sustituye.*Ministerio Público)|registro.*(?:reparación|compensación) automática|toda persona familiar.*víctima indirecta|sentencia.*requisito.*víctima|asesoría federal.*todo asunto local/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una generalización retirada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C25" || expected.code === "C26") {
      const obsoleteAsCurrent =
        expected.code === "C25"
          ? /retención ministerial.*72 horas|control de detención.*(?:toda|cualquier).*(?:comparecencia|audiencia)|vinculación.*(?:culpabilidad|prisión automática)|juez.*solicita.*vinculación|(?:ampliación|plazo).*144 horas.*automát/i
          : /(?:siempre|en todo caso).*seis meses|quince días.*(?:plazo general|toda la etapa)|reapertura.*(?:libre|reinicia todo)|defensa.*(?:debe|tiene que).*probar.*inocencia|descubrimiento.*idéntic|juez de control.*integra.*tribunal de enjuiciamiento/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla procesal absoluta o retirada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C27" || expected.code === "C28") {
      const obsoleteAsCurrent =
        expected.code === "C27"
          ? /hipótesis fiscales.*(?:impiden|excluyen|improcedente)|(?:todo|cualquier) acuerdo previo.*impide|(?:firma|celebración).*extingue.*(?:inmediata|automática)|Ministerio Público.*aprueba.*investigación complementaria|(?:toda|cualquier) prestación parcial.*(?:se pierde|carece de efecto)/i
          : /hipótesis fiscales.*(?:impiden|excluyen|improcedente)|(?:todo|cualquier) delito.*media.*cinco años|revocación automática|(?:reaprehensión|prisión) automática|autoridad de supervisión.*(?:revoca|decide)|(?:toda|cualquier) oposición.*impide/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una exclusión invalidada o efecto automático como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C29" || expected.code === "C30") {
      const obsoleteAsCurrent =
        expected.code === "C29"
          ? /artículo 17.*(?:enumera|establece).*(?:principios|mediación|conciliación)|negociación.*(?:siempre|solo).*sin intermediarios|comunidad.*(?:siempre|obligatoria)|confidencialidad.*(?:absoluta|sin excepciones)|(?:mediación|firma).*(?:equivale|convierte).*acuerdo reparatorio/i
          : /(?:corredor público|tres árbitros).*(?:obligatorio|regla)|(?:institución|sede|confidencialidad).*(?:obligatoria|automática)|nulidad (?:es|equivale a|permite).*(?:apelación|revisar.*fondo)|nulidad del contrato.*(?:anula|elimina).*cláusula|toda.*(?:decisión|resolución).*irrecurrible/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una generalización del mecanismo o del arbitraje como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C31" || expected.code === "C32") {
      const obsoleteAsCurrent =
        expected.code === "C31"
          ? /primera inasistencia.*(?:presume|presunción)|inasistencia del consumidor.*(?:desistimiento|archivo definitivo|termina)|(?:todo|cualquier) (?:acto|documento|convenio).*(?:título ejecutivo|trae aparejada ejecución)|convenio.*(?:es|equivale a|convierte).*(?:pagaré|título de crédito)|arbitraje.*(?:obligatorio|automático)|Concilianet.*(?:todos|cualquier) (?:los )?proveedores|persona física.*carta poder.*sin testigos/i
          : /(?:modelo|régimen|ley) (?:nacional|universal)|Michoacán|protocolo.*(?:solo|únicamente).*(?:libro|carpeta)|(?:mismos|idénticos) documentos.*(?:todos|cualquier) (?:los )?actos|índice.*visitantes|(?:todo|cualquier) gravamen.*(?:impide|bloquea)|sello.*(?:por sí solo|solo).*(?:valida|autoriza)|sello perdido.*(?:reutiliza|recupera vigencia)|(?:100|cien) folios.*(?:5|cinco) libros.*(?:regla|universal)/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla conciliatoria o notarial absoluta como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C33" || expected.code === "C34") {
      const obsoleteAsCurrent =
        expected.code === "C33"
          ? /ratificaci[oó]n.*(?:ejecutiv|pagaré).*(?:automátic|siempre)|notificaci[oó]n.*(?:modifica|adendum).*(?:por sí sola|automátic)|interpelaci[oó]n.*(?:obliga|fuerza).*(?:responder|contestar)|omitir.*derecho al tanto.*nulidad absoluta.*(?:siempre|automátic)|protesto.*(?:reinicia|renueva|interrumpe).*(?:prescripci[oó]n|tres años)/i
          : /dominio.*(?:incluye|acumula|comprende).*(?:administraci[oó]n|pleitos)|(?:todo|cualquier) poder.*(?:debe|requiere).*(?:inscrib|Registro Público)|(?:todo|cualquier) poder.*(?:vence|dura|vigencia).*(?:tres|cinco) años|administraci[oó]n.*(?:permite|autoriza).*(?:cualquier|todo) acto|CNPCF.*(?:vigente|aplica).*(?:uniforme|todo el país)|cargo de gerente.*(?:basta|suficiente)/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una generalización notarial o representativa como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C35" || expected.code === "C36") {
      const obsoleteAsCurrent =
        expected.code === "C35"
          ? /autorizaci[oó]n.*denominaci[oó]n.*(?:crea|constituye|nace).*sociedad|SAS.*(?:debe|requiere).*(?:notario|fedatario)|(?:toda|cualquier) sociedad.*asamblea.*(?:accionistas|sociedad an[oó]nima)|(?:toda|cualquier) ordinaria.*(?:notario|protocoliza|inscrib|RPC)|videoconferencia.*(?:basta|sin controles)|(?:toda|cualquier) variaci[oó]n.*capital variable.*extraordinaria|disoluci[oó]n.*(?:extingue|borra|cancela).*(?:deudas|obligaciones)/i
          : /\bINPI\b|consulta.*(?:garantiza|equivale).*(?:registro|registrar)|uso previo.*(?:equivale|es igual).*(?:t[ií]tulo|registro)|vigencia.*(?:pago|solicitud|presentaci[oó]n)|declarar.*(?:todos|cinco).*(?:aunque|sin).*(?:uso|usar)|licencia.*(?:transfiere|cambia).*(?:titular|propiedad)|renovaci[oó]n.*(?:corrige|subsana).*(?:falta de uso|tres a[nñ]os)|gravamen.*hipoteca inmobiliaria/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla societaria o marcaria obsoleta como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C37" || expected.code === "C38") {
      const obsoleteAsCurrent =
        expected.code === "C37"
          ? /estado de la técnica.*(?:solo|únicamente).*(?:México|nacional)|patente.*(?:sin|no requiere).*actividad inventiva|vigencia.*veinte años.*otorgamiento|modelo de utilidad.*(?:requiere|exige).*actividad inventiva|modelo de utilidad.*(?:decorativ|ornamental)|búsqueda.*(?:garantiza|asegura).*(?:concesión|libertad)|divulgación.*doce meses.*(?:siempre|todos los países)/i
          : /diseño industrial.*(?:protege|incluye).*(?:función técnica|utilidad funcional)|vigencia.*(?:quince años|desde el otorgamiento)|declaración.*(?:diez años|renovación decenal)|denominación de origen.*marca privada|(?:denominación|indicación).*(?:son iguales|idénticas)|indicación geográfica.*(?:siempre|obligatoriamente).*NOM|(?:tipo|género|imitación).*(?:permite|vuelve lícito)/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla de propiedad industrial retirada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C39" || expected.code === "C40") {
      const obsoleteAsCurrent =
        expected.code === "C39"
          ? /derecho de autor.*(?:nace|comienza|surge).*(?:registro|inscripci[oó]n)|autor.*persona moral|derecho moral.*(?:dura|vigencia).*(?:cien|100) años|(?:ISBN|ISSN).*(?:crea|constituye|otorga).*(?:derecho|protecci[oó]n)|registrar.*(?:adaptaci[oó]n|obra derivada).*(?:autoriza|permite).*(?:obra original|primigenia)/i
          : /(?:todo|cualquier) contrato.*(?:trae aparejada|t[ií]tulo ejecutivo)|inter[eé]s.*(?:m[aá]ximo|tope).*(?:dos|tres|2|3)\s*%|embargo.*(?:decide|resuelve|equivale).*(?:fondo|ganar|sentencia)|(?:todo|cualquier) ejecutivo.*(?:oral|escrito).*(?:sin|independientemente).*(?:cuant[ií]a|monto)|acci[oó]n causal.*(?:siempre|autom[aá]tica)|costas.*(?:siempre|autom[aá]tica)/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla autoral o ejecutiva retirada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C41" || expected.code === "C42") {
      const obsoleteAsCurrent =
        expected.code === "C41"
          ? /(?:todo|cualquier) documento.*(?:trae aparejada|título ejecutivo)|924,300\.58 pesos.*(?:basta|crea).*(?:acción|vía)|embargo.*(?:equivale|sustituye).*(?:sentencia|condena)|reconvención.*(?:procede|admisible)|aval.*(?:es|equivale).*depositario/i
          : /(?:solo|únicamente).*(?:entre|para) comerciantes|etapa financiera.*(?:siempre|obligatoria)|juez de instrucción.*juez de oralidad|embargo.*(?:automático|siempre)|revocación.*(?:ordinaria|automática)/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla mercantil retirada o una confusión de vías como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C43" || expected.code === "C44") {
      const obsoleteAsCurrent =
        expected.code === "C43"
          ? /(?:toda|cualquier) controversia mercantil.*ordinario|ordinario.*(?:vía general|siempre procede)|contestación.*nueve días|prueba.*cuarenta días.*(?:siempre|obligatoriamente)/i
          : /(?:nombre|etiqueta) del contrato.*(?:determina|decide).*relación|falta.*escrito.*(?:elimina|pierde).*derechos|(?:40|cuarenta) horas.*(?:vigente|rigen|máximo).*(?:2026|hoy)|vacaciones.*seis días|aguinaldo.*(?:se pierde|renunciable)/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una vía mercantil o regla laboral obsoleta como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C45" || expected.code === "C46") {
      const obsoleteAsCurrent =
        expected.code === "C45"
          ? /(?:todo|cualquier) (?:despido|salida|terminación).*(?:tres meses|veinte días por año|prima de antigüedad)|renuncia.*(?:equivale|es).*despido|finiquito.*(?:fórmula|monto).*(?:única|universal)|(?:toda|cualquier) acción.*prescribe.*un año/i
          : /(?:todo|cualquier) conflicto.*(?:Centro Federal|competencia federal)|Centro.*(?:sentencia|juzga)|conciliación.*(?:siempre|sin excepciones).*obligatoria|cuarenta y cinco días hábiles|prescripción.*(?:no se interrumpe|continúa igual)|Apartado B.*(?:misma|igual).*ruta/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una fórmula laboral universal o una ruta prejudicial falsa como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C47" || expected.code === "C48") {
      const obsoleteAsCurrent =
        expected.code === "C47"
          ? /(?:más de tres salarios|menos de tres meses).*(?:ordinario|especial)|tribunal federal.*juzgado de distrito|juicio laboral.*(?:dura|termina).*(?:dos|tres) meses|carga.*siempre.*patrón|réplica.*(?:cinco|quince) días/i
          : /(?:todo|cualquier) sindicato.*veinte|contrato colectivo.*(?:completo|íntegro).*(?:cada año|anual)|huelga.*(?:abandono|garantiza|asegura).*(?:resultado|triunfo)|registro sindical.*autorización discrecional|(?:objeto|mayoría|emplazamiento).*(?:innecesario|no se requiere)/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una vía procesal o regla colectiva falsa como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C49" || expected.code === "C50") {
      const obsoleteAsCurrent =
        expected.code === "C49"
          ? /(?:siempre|en todo caso).*(?:cinco testigos|certificado negativo)|(?:información ad perpetuam|jurisdicción voluntaria).*(?:crea|transmite|garantiza).*(?:propiedad|título)|(?:inventar|falsear).*(?:linderos|colindancias)|500 metros.*(?:regla|requisito)/i
          : /CNPCF.*(?:ya|actualmente).*(?:rige|vigente|sustituyó).*(?:Michoacán|toda entidad)|quince días.*(?:termina|concluye).*(?:juicio|procedimiento)|(?:desocupación|lanzamiento).*(?:automático|inmediato)|audiencia preliminar.*(?:obligatoria|separada)/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla civil local falsa o una vigencia territorial no declarada como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C51" || expected.code === "C52") {
      const obsoleteAsCurrent =
        expected.code === "C51"
          ? /(?:toda|cualquier) capitulación.*(?:escritura|inscrip)|separación de bienes.*(?:elimina|impide).*(?:inventario|deudas)|(?:todo|cualquier) bien.*(?:automáticamente|siempre).*(?:común|sociedad conyugal)/i
          : /(?:impago|no pagar alimentos).*(?:extingue|pierde automáticamente).*patria potestad|patria potestad.*(?:renunciable|se renuncia).*(?:convenio|privado)|viaje.*(?:permiso|autorización).*(?:automático|unilateral)|custodia.*(?:equivale|es lo mismo).*patria potestad/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una formalidad patrimonial universal o una regla familiar lesiva como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C53" || expected.code === "C54") {
      const obsoleteAsCurrent =
        expected.code === "C53"
          ? /CNPCF.*(?:rige|opera|sustituyó).*(?:automáticamente|desde 2023).*Michoacán|(?:ambos|los dos) cónyuges.*(?:deben|tienen que).*(?:consentir|aceptar).*divorcio|(?:una|cualquier) inasistencia.*pérdida.*patria potestad|dos audiencias.*(?:siempre|obligatorias)/i
          : /(?:porcentaje|tarifa).*(?:universal|siempre)|custodia.*(?:automática|por género)|reducción.*(?:automática|unilateral.*basta)|(?:apelación|amparo|suspensión).*(?:siempre|automáticamente).*procede/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar una regla familiar automática o territorialmente falsa como respuesta vigente.`,
        );
      }
    }

    if (expected.code === "C55" || expected.code === "C56") {
      const obsoleteAsCurrent =
        expected.code === "C55"
          ? /testamento ológrafo.*(?:siempre|universal).*(?:tres testigos)|(?:vigencia|validez).*(?:automática|plazo fijo universal)|notari[oa].*(?:automática|irrestricta|sin límite)|CNPCF.*(?:ya|automáticamente).*(?:rige|opera).*Michoacán|apertura.*(?:equivale|es lo mismo).*(?:adjudicación|propiedad)/i
          : /denuncia.*(?:convierte|hace).*(?:heredero|dueño)|votación.*(?:prueba|acredita).*(?:parentesco|calidad de heredero)|albacea.*(?:es|se vuelve).*(?:dueño|propietario)|(?:siempre|en toda entidad).*cuatro secciones|notari[oa].*(?:universal|automática)|(?:aceptación|protesta).*(?:sustituye|reemplaza).*(?:resolución|decisión judicial)/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          `${expected.code} no puede presentar como vigente una regla sucesoria automática, universal o no acreditada.`,
        );
      }
    }

    if (expected.code === "C57") {
      const obsoleteAsCurrent =
        /(?:todo|cualquier) avalúo.*(?:requiere|exige).*(?:perito|peritaje)|(?:toda|cualquier) (?:resolución|interlocutoria).*(?:siempre|automáticamente).*apel|inventario.*(?:equivale|es lo mismo).*(?:partición|adjudicación)|segunda sección.*(?:solo|exclusivamente).*(?:pagar|pago).*(?:deudas|pasivo)|CNPCF.*(?:ya|automáticamente).*(?:rige|sustituyó|opera).*Michoacán/i;
      for (const question of bundle.topics.flatMap(
        (topic) => topic.exam.questions,
      )) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          obsoleteAsCurrent,
          "C57 no puede presentar como vigente una regla automática, universal o territorialmente falsa.",
        );
      }
    }

    assert.equal(countClassPackage(bundle).artifacts, expected.artifacts);
    assert.equal(bundle.evidenceRegistry.length, expected.evidence);
    assert.deepEqual(
      [...collectUsedEvidenceIds(bundle)].sort(),
      bundle.evidenceRegistry.map(({ id }) => id).sort(),
    );

    const evidenceKinds = new Map(
      bundle.evidenceRegistry.map(({ id, kind }) => [id, kind]),
    );
    for (const topic of bundle.topics) {
      for (const artifact of [...topic.materials, ...topic.flashcards]) {
        assert.equal(
          artifact.sourceOrigin,
          expectedSourceOrigin(artifact.evidenceIds, evidenceKinds),
        );
      }
    }

    const report = assertClassPackageRoundTrip(bundle, bundle, {
      publicationStatus: "draft",
      topicApprovalStatuses: bundle.topics.map(() => "pending"),
    });
    assert.equal(report.equivalent, true);
  });
}
