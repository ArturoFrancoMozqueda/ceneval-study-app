import json
import os
import re
from datetime import date
from urllib.error import HTTPError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

from playwright.sync_api import Browser, Page, expect, sync_playwright


LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Falta la variable local obligatoria {name}.")
    return value


def loopback_url(
    raw_url: str,
    name: str,
    *,
    expected_port: int | None = None,
    require_origin_only: bool = False,
) -> str:
    parsed = urlparse(raw_url)
    if parsed.scheme not in {"http", "https"} or parsed.hostname not in LOOPBACK_HOSTS:
        raise RuntimeError(f"{name} debe apuntar únicamente a loopback.")
    if parsed.username or parsed.password:
        raise RuntimeError(f"{name} no admite credenciales en la URL.")
    if expected_port is not None and parsed.port != expected_port:
        raise RuntimeError(f"{name} no usa el puerto local dedicado.")
    if require_origin_only and (
        parsed.path not in {"", "/"} or parsed.query or parsed.fragment
    ):
        raise RuntimeError(f"{name} debe contener únicamente el origen local.")
    return raw_url.rstrip("/")


def redact(message: str, secrets: list[str]) -> str:
    redacted = message
    for secret in secrets:
        if secret:
            redacted = redacted.replace(secret, "<redacted>")
    return redacted[:500]


def safe_request_label(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    host = parsed.hostname or "invalid"
    port = f":{parsed.port}" if parsed.port else ""
    return f"{parsed.scheme}://{host}{port}{parsed.path}"[:300]


def wait_for_network(page: Page) -> None:
    page.wait_for_load_state("networkidle")


def attach_error_gates(
    page: Page,
    base_url: str,
    secrets: list[str],
    console_errors: list[str],
    page_errors: list[str],
    network_errors: list[str],
    allowed_aborts: dict[str, int],
) -> None:
    def record_failed_request(request) -> None:
        failure_reason = (request.failure or "").strip()
        parsed_request = urlparse(request.url)
        parsed_base = urlparse(base_url)
        same_origin = (
            parsed_request.scheme,
            parsed_request.hostname,
            parsed_request.port,
        ) == (parsed_base.scheme, parsed_base.hostname, parsed_base.port)
        headers = {name.lower(): value for name, value in request.headers.items()}
        is_document_navigation = (
            request.resource_type == "document" and request.is_navigation_request()
        )
        is_explicit_next_prefetch = request.resource_type in {"fetch", "xhr"} and (
            headers.get("next-router-prefetch") == "1"
            or headers.get("purpose") == "prefetch"
            or headers.get("sec-purpose") == "prefetch"
        )
        is_explicit_next_action = (
            request.resource_type == "fetch"
            and request.method == "POST"
            and bool(headers.get("next-action"))
            and bool(headers.get("next-router-state-tree"))
        )
        is_next_rsc_navigation = (
            request.resource_type == "fetch"
            and request.method == "GET"
            and headers.get("rsc") == "1"
            and bool(headers.get("next-router-state-tree"))
        )
        if failure_reason in {"net::ERR_ABORTED", "NS_BINDING_ABORTED"} and same_origin:
            if is_document_navigation:
                allowed_aborts["document-navigation"] += 1
                return
            if is_explicit_next_prefetch:
                allowed_aborts["next-prefetch"] += 1
                return
            if is_explicit_next_action:
                allowed_aborts["next-server-action"] += 1
                return
            if is_next_rsc_navigation:
                allowed_aborts["next-rsc-navigation"] += 1
                return
        safe_reason = (
            failure_reason
            if failure_reason.replace(":", "").replace("_", "").isalnum()
            else "unknown"
        )
        diagnostic_headers = ",".join(
            name
            for name in (
                "next-router-prefetch",
                "next-router-segment-prefetch",
                "next-router-state-tree",
                "next-action",
                "rsc",
                "purpose",
                "sec-purpose",
            )
            if name in headers
        ) or "none"
        network_errors.append(
            f"requestfailed {safe_reason[:80]} type={request.resource_type} "
            f"navigation={is_document_navigation} headers={diagnostic_headers} "
            f"{request.method} "
            f"{safe_request_label(request.url)}"
        )

    page.on(
        "console",
        lambda message: console_errors.append(redact(message.text, secrets))
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: page_errors.append(redact(str(error), secrets)))
    page.on("requestfailed", record_failed_request)
    page.on(
        "response",
        lambda response: network_errors.append(
            f"http {response.status} {safe_request_label(response.url)}"
        )
        if response.status >= 500
        else None,
    )


def health_response(
    base_url: str, path: str, token: str | None = None
) -> tuple[int, dict[str, str], dict[str, str]]:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    request = Request(f"{base_url}{path}", headers=headers, method="GET")
    try:
        response = urlopen(request, timeout=5)
    except HTTPError as error:
        response = error
    with response:
        raw_body = response.read(256)
        if response.read(1):
            raise AssertionError("Health devolvió un cuerpo inesperadamente grande.")
        body = json.loads(raw_body.decode("utf-8"))
        if not isinstance(body, dict):
            raise AssertionError("Health devolvió un cuerpo inválido.")
        return response.status, dict(response.headers.items()), body


def assert_no_store(headers: dict[str, str]) -> None:
    cache_control = next(
        (value for name, value in headers.items() if name.lower() == "cache-control"),
        "",
    )
    if "no-store" not in cache_control.lower():
        raise AssertionError("Health no bloqueó el almacenamiento en caché.")


def assert_reflow_and_targets(page: Page, label: str) -> None:
    overflow = page.evaluate(
        "document.documentElement.scrollWidth - document.documentElement.clientWidth"
    )
    if overflow > 1:
        raise AssertionError(f"{label}: la página requiere desplazamiento horizontal.")

    undersized = page.locator(
        "button:visible, a[href]:visible, input:not([type=hidden]):visible, "
        "select:visible, textarea:visible, [role=button]:visible, [role=link]:visible"
    ).evaluate_all(
        """controls => {
          const candidates = controls
          // WCAG permite una excepción para enlaces de texto en línea. Se
          // excluyen únicamente esos enlaces; navegación y controles quedan medidos.
          .filter(control => !(
            control.matches('a[href]') &&
            getComputedStyle(control).display === 'inline'
          ))
          .map(control => {
            // Para radio/checkbox/input, la etiqueta asociada también forma
            // parte del objetivo activable y es el área efectiva que se mide.
            const effective = control.labels?.[0] || control;
            const box = effective.getBoundingClientRect();
            return {
              name: (control.getAttribute('aria-label') || control.textContent || '').trim(),
              tag: control.tagName,
              width: box.width,
              height: box.height,
              centerX: box.left + box.width / 2,
              centerY: box.top + box.height / 2
            };
          });
          return candidates
            .filter(box =>
              box.width > 0 && box.height > 0 &&
              (box.width < 24 || box.height < 24)
            )
            .slice(0, 5);
        }"""
    )
    if undersized:
        raise AssertionError(f"{label}: hay controles relevantes menores a 24 CSS px.")


def assert_computed_reduced_motion(page: Page, label: str) -> None:
    maximum_duration_ms = page.evaluate(
        """() => {
          const milliseconds = value => value.split(',').reduce((maximum, token) => {
            const normalized = token.trim();
            const number = Number.parseFloat(normalized) || 0;
            const duration = normalized.endsWith('ms') ? number : number * 1000;
            return Math.max(maximum, duration);
          }, 0);
          return [...document.querySelectorAll('*')].reduce((maximum, element) => {
            const style = getComputedStyle(element);
            return Math.max(
              maximum,
              milliseconds(style.animationDuration),
              milliseconds(style.transitionDuration)
            );
          }, 0);
        }"""
    )
    if maximum_duration_ms > 1:
        raise AssertionError(
            f"{label}: movimiento computado mayor a 1 ms con reducción activa."
        )


def assert_privacy_curtain(page: Page) -> None:
    """Comprueba las señales web reales sin afirmar que bloquean PrtScn."""
    curtain = page.locator(".privacy-curtain")
    expect(curtain).to_have_count(1)
    page.bring_to_front()
    page.evaluate("window.dispatchEvent(new Event('focus'))")
    expect(curtain).to_have_attribute("data-state", "hidden")

    # Demostración deliberada de la limitación: con la ventana activa el
    # contenido continúa visible y Playwright puede capturarlo.
    expect(page.locator("#contenido-principal")).to_be_visible()
    direct_capture = page.screenshot()
    assert len(direct_capture) > 0
    expect(curtain).to_have_attribute("data-state", "hidden")

    page.evaluate("window.dispatchEvent(new Event('blur'))")
    expect(curtain).to_have_attribute("data-state", "visible")
    assert curtain.evaluate("el => getComputedStyle(el).backgroundColor") == "rgb(0, 0, 0)"
    page.evaluate("window.dispatchEvent(new Event('focus'))")
    expect(curtain).to_have_attribute("data-state", "hidden")

    page.evaluate(
        """() => {
          Object.defineProperty(document, 'hidden', {
            configurable: true,
            get: () => true
          });
          document.dispatchEvent(new Event('visibilitychange'));
        }"""
    )
    expect(curtain).to_have_attribute("data-state", "visible")
    page.evaluate(
        """() => {
          delete document.hidden;
          document.dispatchEvent(new Event('visibilitychange'));
          window.dispatchEvent(new Event('focus'));
        }"""
    )
    expect(curtain).to_have_attribute("data-state", "hidden")

    page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
    expect(curtain).to_have_attribute("data-state", "visible")
    page.evaluate("window.dispatchEvent(new Event('afterprint'))")
    expect(curtain).to_have_attribute("data-state", "hidden")


def create_editorial_draft_through_ui(
    page: Page,
    base_url: str,
    subject_name: str,
    subject_description: str,
    class_title: str,
    class_description: str,
    class_date: str,
    class_teacher: str,
) -> tuple[str, str]:
    page.goto(f"{base_url}/materias", wait_until="networkidle")
    page.get_by_role("link", name="Nueva materia", exact=True).click()
    wait_for_network(page)
    expect(page.get_by_role("heading", name="Nueva materia", exact=True)).to_be_visible()

    subject_name_input = page.locator("#subject-name")
    page.get_by_role("button", name="Guardar materia", exact=True).click()
    expect(page.locator("#subject-name-error")).to_have_text(
        "Escribe el nombre de la materia."
    )
    expect(subject_name_input).to_be_focused()
    subject_name_input.fill(subject_name)
    page.locator("#subject-description").fill(subject_description)
    page.get_by_role("button", name="Guardar materia", exact=True).click()
    page.wait_for_url(re.compile(rf"^{re.escape(base_url)}/materias\?creada=1$"))
    wait_for_network(page)

    subject_link = page.get_by_role("link", name=f"Abrir {subject_name}", exact=True)
    expect(subject_link).to_contain_text("0 clases · 0 temas")
    subject_href = subject_link.get_attribute("href")
    if not subject_href or not re.fullmatch(r"/materias/[1-9]\d*", subject_href):
        raise AssertionError("La materia creada no expuso un enlace local válido.")
    # SubjectForm hace push y refresh consecutivos. Esperar a que el refresh
    # termine evita activar el enlace contra el árbol anterior del router.
    page.wait_for_timeout(500)
    subject_link.click()
    page.wait_for_url(f"{base_url}{subject_href}")
    wait_for_network(page)
    subject_path = urlparse(page.url).path
    if not re.fullmatch(r"/materias/[1-9]\d*", subject_path):
        raise AssertionError(
            f"La materia creada no abrió una ruta local válida: {subject_path[:80]}."
        )
    expect(page.get_by_role("heading", name=subject_name, exact=True)).to_be_visible()
    expect(
        page.get_by_role("heading", name="Esta materia aún no tiene clases", exact=True)
    ).to_be_visible()
    page.get_by_role("link", name="Crear la primera clase", exact=True).click()
    wait_for_network(page)
    expect(page.get_by_role("heading", name="Nueva clase", exact=True)).to_be_visible()

    class_title_input = page.locator("#class-title")
    page.get_by_role("button", name="Guardar clase", exact=True).click()
    expect(page.locator("#class-title-error")).to_have_text(
        "Escribe el título de la clase."
    )
    expect(class_title_input).to_be_focused()
    class_title_input.fill(class_title)
    page.locator("#class-date").fill(class_date)
    page.locator("#class-teacher").fill(class_teacher)
    page.locator("#class-description").fill(class_description)
    page.get_by_role("button", name="Guardar clase", exact=True).click()
    page.wait_for_url(re.compile(rf"^{re.escape(base_url)}/clases/[1-9]\d*$"))
    wait_for_network(page)
    class_path = urlparse(page.url).path
    expect(page.get_by_role("heading", name=class_title, exact=True)).to_be_visible()
    expect(page.get_by_text("Borrador", exact=True)).to_be_visible()
    expect(page.get_by_text(class_description, exact=True)).to_be_visible()
    expect(
        page.get_by_role(
            "heading", name="Esta clase aún no tiene temas disponibles", exact=True
        )
    ).to_be_visible()
    page.reload(wait_until="networkidle")
    expect(page.get_by_role("heading", name=class_title, exact=True)).to_be_visible()
    expect(page.get_by_text(class_description, exact=True)).to_be_visible()
    return subject_path, class_path


def exercise_incomplete_publication_gate(
    page: Page,
    base_url: str,
    class_path: str,
) -> None:
    page.get_by_role("link", name="Revisar publicación", exact=True).click()
    wait_for_network(page)
    expected_path = class_path.replace("/clases/", "/administrar/clases/")
    expect(page).to_have_url(f"{base_url}{expected_path}")
    expect(page.get_by_text("Estado actual: Borrador", exact=True)).to_be_visible()

    publish_button = page.get_by_role("button", name="Publicar clase", exact=True)
    publish_button.click()
    dialog = page.get_by_role("dialog", name="¿Publicar esta clase?")
    expect(dialog).to_be_visible()
    expect(page.get_by_role("button", name="Cancelar", exact=True)).to_be_focused()
    page.keyboard.press("Escape")
    expect(dialog).to_have_count(0)
    expect(publish_button).to_be_focused()

    publish_button.click()
    page.get_by_role("button", name="Sí, publicar clase", exact=True).click()
    direct_publish_error = page.get_by_role("alert").filter(
        has_text="Primero envía la clase a revisión"
    )
    expect(direct_publish_error).to_contain_text(
        "Primero envía la clase a revisión"
    )
    page.get_by_role("button", name="Enviar a revisión", exact=True).click()
    expect(page.get_by_text("Estado actual: En revisión", exact=True)).to_be_visible()
    page.get_by_role("button", name="Publicar clase", exact=True).click()
    page.get_by_role("button", name="Sí, publicar clase", exact=True).click()
    incomplete_error = page.get_by_role("alert").filter(
        has_text="La clase no tiene temas para publicar."
    )
    expect(incomplete_error).to_contain_text("La clase no tiene temas para publicar.")
    page.get_by_role("button", name="Volver a borrador", exact=True).click()
    expect(page.get_by_text("Estado actual: Borrador", exact=True)).to_be_visible()
    page.reload(wait_until="networkidle")
    expect(page.get_by_text("Estado actual: Borrador", exact=True)).to_be_visible()


def exercise_complete_editorial_workflow(page: Page) -> None:
    updated_description = (
        "Fixture artificial actualizado desde los controles visibles del E2E local."
    )
    description_input = page.locator("#editorial-class-description")
    description_input.fill(updated_description)
    page.get_by_role("button", name="Guardar cambios", exact=True).click()
    expect(page.get_by_text("Cambios guardados correctamente.", exact=True)).to_be_visible()
    page.reload(wait_until="networkidle")
    expect(page.locator("#editorial-class-description")).to_have_value(
        updated_description
    )

    page.get_by_role("button", name="Enviar a revisión", exact=True).click()
    expect(page.get_by_text("Estado actual: En revisión", exact=True)).to_be_visible()
    expect(
        page.get_by_role("heading", name="Dictamen editorial", exact=True)
    ).to_be_visible()
    approve_button = page.get_by_role("button", name="Aprobar versión", exact=True)
    expect(approve_button).to_be_disabled()
    page.locator("#legal-verified-on").fill(date.today().isoformat())
    page.locator("#review-notes").fill(
        "Dictamen ejercido únicamente por el navegador E2E local."
    )
    expect(approve_button).to_be_enabled()
    approve_button.click()
    expect(
        page.get_by_text(
            "Aprobación editorial registrada para esta versión.", exact=True
        )
    ).to_be_visible()

    publish_button = page.get_by_role("button", name="Publicar clase", exact=True)
    publish_button.click()
    expect(page.get_by_role("dialog", name="¿Publicar esta clase?")).to_be_visible()
    page.get_by_role("button", name="Sí, publicar clase", exact=True).click()
    expect(page.get_by_text("Estado actual: Publicada", exact=True)).to_be_visible()
    expect(
        page.get_by_role("button", name="Publicar clase", exact=True)
    ).to_be_disabled()
    page.reload(wait_until="networkidle")
    expect(page.get_by_text("Estado actual: Publicada", exact=True)).to_be_visible()


def audit_emulated_accessibility(
    browser: Browser,
    base_url: str,
    topic_url: str,
    storage_state: dict,
    secrets: list[str],
    console_errors: list[str],
    page_errors: list[str],
    network_errors: list[str],
    allowed_aborts: dict[str, int],
) -> None:
    configurations = [
        {
            "label": "mobile-touch-320-reduced-motion",
            "viewport": {"width": 320, "height": 800},
            "has_touch": True,
            "is_mobile": True,
            "reduced_motion": "reduce",
        },
        {
            # 640 CSS px is an automated reflow proxy for 200% zoom from 1280.
            # It is not represented as a real browser/screen-reader certification.
            "label": "zoom-200-reflow-proxy",
            "viewport": {"width": 640, "height": 900},
            "has_touch": False,
            "is_mobile": False,
            "reduced_motion": "reduce",
        },
    ]
    for configuration in configurations:
        context = browser.new_context(
            viewport=configuration["viewport"],
            has_touch=configuration["has_touch"],
            is_mobile=configuration["is_mobile"],
            reduced_motion=configuration["reduced_motion"],
            storage_state=storage_state,
        )
        page = context.new_page()
        attach_error_gates(
            page,
            base_url,
            secrets,
            console_errors,
            page_errors,
            network_errors,
            allowed_aborts,
        )
        try:
            page.goto(topic_url, wait_until="networkidle")
            expect(page.locator("#contenido-principal")).to_be_visible()
            assert_reflow_and_targets(page, str(configuration["label"]))
            assert page.evaluate(
                "matchMedia('(prefers-reduced-motion: reduce)').matches"
            )
            assert_computed_reduced_motion(page, str(configuration["label"]))
            if configuration["has_touch"]:
                assert page.evaluate("navigator.maxTouchPoints > 0")
        finally:
            context.close()


def main() -> None:
    base_url = loopback_url(
        required_env("E2E_BASE_URL"),
        "E2E_BASE_URL",
        expected_port=3100,
        require_origin_only=True,
    )
    admin_email = required_env("E2E_ADMIN_EMAIL")
    admin_password = required_env("E2E_ADMIN_PASSWORD")
    student_email = required_env("E2E_STUDENT_EMAIL")
    student_password = required_env("E2E_STUDENT_PASSWORD")
    readiness_token = required_env("OPS_READINESS_TOKEN")
    class_id = required_env("E2E_CLASS_ID")
    topic_path = required_env("E2E_TOPIC_URL")
    ui_subject_name = required_env("E2E_UI_SUBJECT_NAME")
    ui_subject_description = required_env("E2E_UI_SUBJECT_DESCRIPTION")
    ui_class_title = required_env("E2E_UI_CLASS_TITLE")
    ui_class_description = required_env("E2E_UI_CLASS_DESCRIPTION")
    ui_class_date = required_env("E2E_UI_CLASS_DATE")
    ui_class_teacher = required_env("E2E_UI_CLASS_TEACHER")
    topic_url = loopback_url(urljoin(f"{base_url}/", topic_path), "E2E_TOPIC_URL")
    lesson_url = f"{topic_url}?modo=leccion"
    class_path = f"/clases/{class_id}"
    secrets = [
        admin_email,
        admin_password,
        student_email,
        student_password,
        readiness_token,
        os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ""),
        os.environ.get("SUPABASE_SECRET_KEY", ""),
    ]
    console_errors: list[str] = []
    page_errors: list[str] = []
    network_errors: list[str] = []
    allowed_aborts = {
        "document-navigation": 0,
        "next-prefetch": 0,
        "next-server-action": 0,
        "next-rsc-navigation": 0,
    }

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()
        attach_error_gates(
            page,
            base_url,
            secrets,
            console_errors,
            page_errors,
            network_errors,
            allowed_aborts,
        )

        try:
            live_status, live_headers, live_body = health_response(
                base_url, "/api/health/live"
            )
            assert live_status == 200
            assert live_body == {"status": "live"}
            assert_no_store(live_headers)

            hidden_status, hidden_headers, hidden_body = health_response(
                base_url, "/api/health/ready"
            )
            assert hidden_status == 404
            assert hidden_body == {"status": "not_found"}
            assert_no_store(hidden_headers)

            ready_status, ready_headers, ready_body = health_response(
                base_url, "/api/health/ready", readiness_token
            )
            assert ready_status == 200
            assert ready_body == {"status": "ready"}
            assert_no_store(ready_headers)

            # Excepción localizada: el primer documento de Next no alcanza
            # networkidle de forma estable en Windows. El formulario visible es
            # la señal explícita; las navegaciones autenticadas sí exigen idle.
            page.goto(f"{base_url}/iniciar-sesion", wait_until="domcontentloaded")
            expect(page.get_by_role("button", name="Iniciar sesión")).to_be_visible()
            page.get_by_label("Correo electrónico").fill(student_email)
            page.get_by_label("Contraseña").fill(student_password)
            page.get_by_role("button", name="Iniciar sesión").click()
            expect(page.locator("#sign-in-error")).to_have_text(
                "No pudimos iniciar sesión. Revisa tus datos o confirma tu correo."
            )
            expect(page).to_have_url(f"{base_url}/iniciar-sesion")

            page.get_by_label("Correo electrónico").fill(admin_email)
            page.get_by_label("Contraseña").fill(admin_password)
            page.get_by_role("button", name="Iniciar sesión").click()
            page.wait_for_url(f"{base_url}/")
            wait_for_network(page)

            assert_privacy_curtain(page)

            sign_out_button = page.get_by_role("button", name="Cerrar sesión").first
            expect(sign_out_button).to_be_visible()
            sign_out_box = sign_out_button.bounding_box()
            assert sign_out_box is not None
            assert sign_out_box["height"] >= 44, (
                "El botón lateral Cerrar sesión debe medir al menos 44 CSS px de alto."
            )

            page.evaluate("document.activeElement?.blur()")
            page.keyboard.press("Tab")
            skip_link = page.get_by_role("link", name="Saltar al contenido principal")
            expect(skip_link).to_be_focused()
            page.keyboard.press("Enter")
            expect(page.locator("#contenido-principal")).to_be_focused()

            # Recorre la biblioteca como lo haría una persona: lista de
            # materias -> materia -> clase -> tema. Comprobar solo hrefs con
            # page.goto() no detectaría enlaces que no navegan al activarlos.
            page.goto(f"{base_url}/materias", wait_until="networkidle")
            expect(
                page.get_by_role("heading", name="Biblioteca CENEVAL", exact=True)
            ).to_be_visible()
            subject_link = page.get_by_role("link", name="Abrir Materia sintética")
            expect(subject_link).to_be_visible()
            expect(subject_link).to_contain_text("1 clase · 1 tema")
            subject_link.click()
            wait_for_network(page)
            expect(page.get_by_role("heading", name="Materia sintética", exact=True)).to_be_visible()
            class_link = page.locator(f'a[href="{class_path}"]').first
            expect(class_link).to_contain_text("Clase sintética de persistencia")
            expect(class_link).to_contain_text("1 tema")
            class_link.click()
            wait_for_network(page)
            expect(
                page.get_by_role(
                    "heading", name="Clase sintética de persistencia", exact=True
                )
            ).to_be_visible()
            topic_link = page.locator(f'a[href="{topic_path}"]').first
            expect(topic_link).to_contain_text("Tema sintético")
            topic_link.click()
            wait_for_network(page)
            expect(page).to_have_url(topic_url)

            _, created_class_path = create_editorial_draft_through_ui(
                page,
                base_url,
                ui_subject_name,
                ui_subject_description,
                ui_class_title,
                ui_class_description,
                ui_class_date,
                ui_class_teacher,
            )
            exercise_incomplete_publication_gate(
                page,
                base_url,
                created_class_path,
            )

            # La búsqueda valida tanto el estado útil sin resultados como un
            # resultado seleccionable y el regreso con la consulta intacta.
            page.goto(f"{base_url}/buscar", wait_until="networkidle")
            expect(
                page.get_by_role("heading", name="Buscar en todo el contenido")
            ).to_be_visible()
            search = page.get_by_role(
                "searchbox", name="Buscar materias, clases o temas"
            )
            search.fill("consulta-sintetica-inexistente")
            page.get_by_role("button", name="Buscar", exact=True).click()
            wait_for_network(page)
            expect(
                page.get_by_text(
                    "No encontramos contenido publicado para “consulta-sintetica-inexistente”.",
                    exact=True,
                )
            ).to_be_visible()
            search.fill("Tema sintético")
            page.get_by_role("button", name="Buscar", exact=True).click()
            wait_for_network(page)
            expect(page.get_by_role("heading", name="1 resultado", exact=True)).to_be_visible()
            search_result = page.locator(f'a[href="{topic_path}"]').first
            expect(search_result).to_contain_text("Tema sintético")
            expect(search_result.get_by_text("Tema", exact=True)).to_be_visible()
            expect(search_result).to_contain_text(
                "Materia sintética · C41 · Clase sintética de persistencia"
            )
            search_result.click()
            wait_for_network(page)
            expect(page).to_have_url(topic_url)
            page.go_back(wait_until="networkidle")
            expect(
                page.get_by_role(
                    "searchbox", name="Buscar materias, clases o temas"
                )
            ).to_have_value("Tema sintético")

            page.goto(f"{base_url}/progreso/examenes", wait_until="networkidle")
            expect(page.get_by_role("heading", name="Historial de exámenes")).to_be_visible()
            expect(
                page.get_by_role("heading", name="Aún no has entregado exámenes")
            ).to_be_visible()
            expect(page.get_by_role("link", name="Elegir un tema")).to_have_attribute(
                "href", "/estudiar"
            )

            sessions_link = page.get_by_role("link", name="Mi ruta").first
            expect(sessions_link).to_have_attribute("href", "/sesiones")
            page.goto(f"{base_url}/sesiones", wait_until="networkidle")
            expect(page.get_by_role("heading", name="Mi ruta", exact=True)).to_be_visible()
            expect(page.get_by_role("heading", name="Ruta completa", exact=True)).to_be_visible()

            class_link = page.locator(f'a[href="{class_path}"]').first
            expect(class_link).to_be_visible()
            class_link.click()
            wait_for_network(page)

            topic_link = page.locator(f'a[href="{topic_path}"]').first
            expect(topic_link).to_be_visible()
            page.goto(lesson_url, wait_until="networkidle")
            expect(page.locator("h1")).to_be_visible()

            page.get_by_role("button", name=re.compile("Explicación")).click()
            expect(page.get_by_text("Explicación principal", exact=True)).to_be_visible()
            legal_disclosure = page.locator("summary").filter(
                has_text="Ver fundamento jurídico"
            )
            expect(legal_disclosure).to_be_visible()
            legal_disclosure.click()
            expect(page.get_by_text("Fundamento jurídico", exact=True)).to_be_visible()

            page.get_by_role("button", name="Aplicar lo aprendido").click()
            expect(page.get_by_role("status")).to_have_text("Avance guardado")
            page.reload(wait_until="networkidle")
            current_step = page.locator(
                'nav[aria-label="Recorrido de aprendizaje"] button[aria-current="step"]'
            )
            expect(current_step).to_contain_text("Casos")
            optional_review = page.locator("summary").filter(
                has_text="Otras formas de repasar"
            )
            expect(optional_review).to_be_visible()
            optional_review.click()
            expect(page.get_by_text("Conceptos clave", exact=True)).to_be_visible()
            expect(page.get_by_text("Guía de estudio", exact=True)).to_be_visible()

            page.get_by_role("button", name="Marcar lección como consultada").click()
            expect(page.get_by_role("status")).to_have_text("Avance guardado")
            page.get_by_role("link", name="Practicar este tema").click()
            wait_for_network(page)
            page.get_by_role("button", name="Iniciar ronda adaptativa").click()
            for index in range(5):
                expect(page.get_by_text(f"Pregunta {index + 1} de 5", exact=True)).to_be_visible()
                page.locator("label").filter(has_text="Puedo explicarlo").click()
                expect(
                    page.get_by_role("radio", name=re.compile("Puedo explicarlo"))
                ).to_be_checked()
                page.get_by_role("button", name="Comparar con la clave").click()
                expect(page.get_by_text("Clave de comparación", exact=True)).to_be_visible()
                page.get_by_role("button", name=re.compile("Correcta")).click()
                wait_for_network(page)
            completion_heading = page.get_by_role(
                "heading", name=re.compile("Ya hiciste el trabajo difícil")
            )
            expect(completion_heading).to_be_visible()
            expect(completion_heading).to_be_focused()
            page.get_by_role("link", name="Hacer el simulacro").click()
            wait_for_network(page)

            for index in range(10):
                fieldset = page.locator("fieldset").first
                legend = fieldset.locator("legend")
                question_text = legend.locator("span").nth(1).inner_text().strip()
                if not question_text:
                    raise AssertionError("El reactivo no expuso un nombre accesible.")
                expect(
                    page.get_by_role(
                        "group", name=re.compile(re.escape(question_text))
                    )
                ).to_be_visible()
                page.get_by_role("radio").first.check()
                if index == 0:
                    page.get_by_role("button", name="Siguiente pregunta").click()
                    expect(page.locator("fieldset legend")).to_be_focused()
                    page.get_by_role("button", name="Anterior", exact=True).click()
                    expect(page.locator("fieldset legend")).to_be_focused()
                    expect(page.get_by_role("radio").first).to_be_checked()
                    page.get_by_role("button", name="Siguiente pregunta").click()
                    expect(page.locator("fieldset legend")).to_be_focused()
                    continue
                if index < 9:
                    page.get_by_role("button", name="Siguiente pregunta").click()
                    expect(page.locator("fieldset legend")).to_be_focused()
                else:
                    page.get_by_role("button", name="Entregar examen").click()
            result_heading = page.get_by_role("heading", name="Resultado")
            expect(result_heading).to_be_visible()
            expect(result_heading).to_be_focused()
            expect(page.get_by_text("0/10", exact=True)).to_be_visible()
            expect(page.get_by_text("Tu intento quedó guardado.", exact=False)).to_be_visible()
            expect(page.get_by_text("Necesita repaso", exact=True)).to_have_count(10)
            expect(page.get_by_role("heading", name="Tu respuesta")).to_have_count(10)
            expect(page.get_by_text("Opción sintética A", exact=True)).to_have_count(10)
            expect(
                page.get_by_text("Explicación sintética de la opción A", exact=True)
            ).to_have_count(10)
            expect(
                page.get_by_text(
                    "Explicación general artificial suficientemente extensa para la prueba.",
                    exact=True,
                )
            ).to_have_count(10)
            page.get_by_role("button", name="Repetir examen", exact=True).click()
            expect(page.get_by_text("Nuevo intento:", exact=False)).to_be_visible()
            expect(page.locator("fieldset legend")).to_be_visible()
            expect(page.get_by_role("radio").first).not_to_be_checked()

            page.goto(f"{base_url}/progreso/examenes", wait_until="networkidle")
            expect(page.get_by_role("heading", name="Historial de exámenes")).to_be_visible()
            expect(page.get_by_text("Examen sintético", exact=True)).to_be_visible()
            open_attempt = page.get_by_role("link", name="Abrir intento")
            expect(open_attempt).to_be_visible()
            open_attempt.click()
            wait_for_network(page)
            expect(page.get_by_role("heading", name="Examen sintético", exact=True)).to_be_visible()
            expect(page.get_by_text("0% de respuestas correctas", exact=True)).to_be_visible()
            expect(page.get_by_text("Necesita repaso", exact=False)).to_have_count(10)
            expect(page.get_by_text("Opción sintética A", exact=True)).to_have_count(10)
            page.get_by_role("link", name="Volver al historial", exact=True).click()
            wait_for_network(page)
            expect(page.get_by_role("heading", name="Historial de exámenes")).to_be_visible()

            admin_link = page.get_by_role("link", name="Panel editorial").first
            expect(admin_link).to_have_attribute("href", "/administrar")
            page.goto(f"{base_url}/administrar", wait_until="networkidle")
            expect(page.get_by_role("heading", name="Panel editorial", exact=True)).to_be_visible()
            published_card = page.get_by_role("article").filter(has_text="Publicadas")
            expect(published_card.locator("p").first).to_have_text("1")
            editorial_class_path = f"/administrar/clases/{class_id}"
            editorial_class_link = page.locator(f'a[href="{editorial_class_path}"]').first
            expect(editorial_class_link).to_contain_text("Clase sintética de persistencia")
            page.goto(
                f"{base_url}{editorial_class_path}", wait_until="networkidle"
            )
            expect(page.get_by_text("Estado actual: Publicada", exact=True)).to_be_visible()
            expect(page.get_by_role("heading", name="Publicación", exact=True)).to_be_visible()
            expect(page.get_by_role("button", name="Publicar clase", exact=True)).to_be_disabled()
            exercise_complete_editorial_workflow(page)

            storage_state = context.storage_state()
            audit_emulated_accessibility(
                browser,
                base_url,
                topic_url,
                storage_state,
                secrets,
                console_errors,
                page_errors,
                network_errors,
                allowed_aborts,
            )

            for invalid_path in [
                "/temas/999999999",
                "/progreso/examenes/no-valida",
                "/clases/no-valida",
                "/materias/no-valida",
            ]:
                page.goto(f"{base_url}{invalid_path}", wait_until="networkidle")
                expect(page.get_by_text("ERROR 404", exact=True)).to_be_visible()

            if console_errors or page_errors or network_errors:
                details = "; ".join(
                    [
                        *(f"console: {item}" for item in console_errors),
                        *(f"page: {item}" for item in page_errors),
                        *(f"network: {item}" for item in network_errors),
                    ]
                )
                raise AssertionError(f"El navegador registró errores: {details}")

            print(
                "[OK] E2E local: login privado, health, biblioteca navegable, creación visible de materia y clase con validación/persistencia, gate de publicación incompleta, revisión y publicación completa, búsqueda con y sin resultados, estado vacío de historial, progreso, práctica adaptativa, examen, detalle e historial del intento, rutas inválidas, panel y emulación de reflow/touch/reduced-motion verificados; "
                f"0 errores de consola/página/red; abortos permitidos document-navigation={allowed_aborts['document-navigation']}, next-prefetch={allowed_aborts['next-prefetch']}, next-server-action={allowed_aborts['next-server-action']}, next-rsc-navigation={allowed_aborts['next-rsc-navigation']}."
            )
        finally:
            context.close()
            browser.close()


if __name__ == "__main__":
    main()
