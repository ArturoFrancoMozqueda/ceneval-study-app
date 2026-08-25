# Auditoría de suficiencia de fuente — C58

Fecha de corte: 21 de agosto de 2026  
Clase evaluada: **C58 — Administración, partición y adjudicación de la herencia**  
Dictamen: **DESCARTADA con el corpus actual / bloqueada por falta de fuente académica suficiente**

## Alcance

La revisión cubrió:

- los 70 archivos TXT privados del inventario, del Audio 01 al Audio 70;
- los 14 documentos vivos de clasificación en `content/batches/`;
- `content/curriculum-plan.md`;
- `docs/PROJECT_STATUS.md` y la documentación viva obligatoria del proyecto;
- la asignación editorial existente de C01 a C57 y los tres bancos transversales.

No se consultó `docs/archivo/`. La auditoría no incorporó transcripciones, rutas
privadas, hashes privados ni citas textuales al repositorio.

## Método

1. Se comprobó la existencia y legibilidad de los 70 TXT.
2. Se buscaron, con variantes ortográficas y de contexto, los conceptos:
   `sucesión`, `herencia`, `albacea`, `inventario`, `avalúo`,
   `administración`, `rendición de cuentas`, `glosa`, `tercera sección`,
   `cuarta sección`, `partición`, `oposición`, `adjudicación`, `liquidación`,
   `caudal` y `pasivo hereditario`.
3. Se revisaron las coincidencias en su entorno para separar lenguaje sucesorio
   de homónimos y usos ajenos, como administración pública, administración de
   sociedades, liquidación fiscal o laboral e impartición de justicia.
4. Los candidatos sucesorios se revisaron manualmente por rango físico y se
   contrastaron con las fronteras ya asignadas a C55, C56 y C57.
5. Se exigió cobertura transcriptiva suficiente para construir honestamente el
   paquete 1.2 completo. Las fuentes oficiales pueden corregir o complementar
   una clase, pero no sustituir la fuente académica que origina la clase.

## Matriz de candidatos

| Fuente candidata | Cobertura encontrada | Pertinencia para C58 | Decisión |
| --- | --- | --- | --- |
| Audio 63, líneas 157–161 | Puente que menciona la organización del juicio sucesorio y una cuarta sección, sin desarrollar sus actos | Insuficiente: no explica administración, cuentas, partición, oposición ni adjudicación; además pertenece a la frontera editorial de C56 | Excluir de C58 |
| Audio 64, líneas 47–61 | Continuación de la segunda sección con menciones genéricas de administración | Insuficiente: no desarrolla una tercera sección, rendición o aprobación de cuentas, proyecto de partición ni adjudicación | Reservar a C57 cuando sea pertinente |
| Audio 64, líneas 97–111 | Inventario, avalúo, oposición y cierre de la segunda sección | Pertinente para C57, no para C58 | Asignar exclusivamente a C57 |
| Audio 66 completo | Archivo fragmentario y severamente deteriorado sobre una acción real | No contiene desarrollo sucesorio ni los conceptos nucleares de C58 | Mantener archivado; no rescatar para C58 |

## Coincidencias descartadas

La búsqueda completa produjo coincidencias aisladas que no forman una fuente
para C58:

- administración pública, órganos y entidades administrativas;
- administración societaria, poderes para administración y cuentas de
  sociedades;
- liquidación fiscal, laboral, familiar o mercantil;
- partición o reparto usados fuera de una herencia, e `impartición` detectada
  por búsquedas de raíz;
- menciones generales de sucesión, testamento o herencia dentro de clases ya
  asignadas a C02, C04, C32–C34, C36–C39 y bancos transversales;
- ejemplos incidentales sin secuencia procesal, jurisdicción o reglas
  suficientes para producir materiales y evaluaciones.

Ninguna coincidencia del corpus desarrolla conjuntamente administración de la
herencia, rendición de cuentas, partición, oposición y adjudicación. Tampoco se
identificó una continuación utilizable después del Audio 64.

## Dictamen

C58 no debe tener un JSON construido sólo con legislación o fuentes oficiales.
Hacerlo produciría una clase nueva sin respaldo en una transcripción académica,
incumpliría el modelo editorial y convertiría las fuentes complementarias en
una fuente de clase inexistente.

Por tanto:

- **no se crea paquete C58**;
- el estado correcto es **bloqueada por insuficiencia de fuente**;
- C57 puede cerrar la segunda sección sin fingir continuidad hacia C58;
- el módulo sucesorio queda conscientemente incompleto hasta recibir material
  nuevo.

## Criterio de desbloqueo

C58 podrá reevaluarse cuando exista una transcripción académica íntegra,
conservada como original privado, que identifique la jurisdicción y el
ordenamiento aplicable y desarrolle, al menos:

1. administración del caudal hereditario y facultades/deberes del albacea;
2. rendición, revisión, aprobación u oposición de cuentas;
3. formación del proyecto de partición y reglas de distribución;
4. intervención y oposición de las personas interesadas;
5. resolución sobre partición y adjudicación, sus efectos y formalización;
6. separación clara frente a inventario/avalúo y frente a una eventual vía
   notarial.

La nueva fuente debe ofrecer suficiente contenido propio para nueve materiales,
un mapa sustantivo, entre diez y quince flashcards y diez reactivos originales,
sin que la legislación oficial tenga que reemplazar la explicación académica.
Después deberá pasar la misma matriz de rangos, vigencia, jurisdicción,
evidencia por artefacto y round-trip exigida a C01–C57.

## Seguimiento del 25 de agosto de 2026

La búsqueda externa posterior sí localizó dos obras académicas con cobertura
temática suficiente. El dictamen completo, páginas, enlaces, licencias,
jurisdicción y contraste con el CNPCF se documentan en
[`C58_NEW_SOURCE.md`](./C58_NEW_SOURCE.md).

Este hallazgo supera la carencia temática del corpus original, pero no autoriza
crear todavía el paquete: la obra principal tiene restricciones BY-NC-ND/no
lucrativas y el contrato 1.2 requiere una clase/transcripción original privada.
El bloqueo vigente es obtener permiso comercial y producir esa fuente original
con una persona docente, no encontrar otra compilación legislativa.
