import os
import json
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlparse

from playwright.sync_api import Page, expect, sync_playwright


LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Falta la variable local obligatoria {name}.")
    return value


def loopback_url(raw_url: str, name: str) -> str:
    parsed = urlparse(raw_url)
    if parsed.scheme not in {"http", "https"} or parsed.hostname not in LOOPBACK_HOSTS:
        raise RuntimeError(f"{name} debe apuntar únicamente a loopback.")
    return raw_url.rstrip("/")


def redact(message: str, secrets: list[str]) -> str:
    redacted = message
    for secret in secrets:
        if secret:
            redacted = redacted.replace(secret, "<redacted>")
    return redacted[:500]


def wait_for_network(page: Page) -> None:
    page.wait_for_load_state("networkidle")


def health_response(base_url: str, path: str, token: str | None = None) -> tuple[int, dict[str, str], dict[str, str]]:
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


def main() -> None:
    base_url = loopback_url(required_env("E2E_BASE_URL"), "E2E_BASE_URL")
    admin_email = required_env("E2E_ADMIN_EMAIL")
    admin_password = required_env("E2E_ADMIN_PASSWORD")
    student_email = required_env("E2E_STUDENT_EMAIL")
    student_password = required_env("E2E_STUDENT_PASSWORD")
    readiness_token = required_env("OPS_READINESS_TOKEN")
    class_id = required_env("E2E_CLASS_ID")
    topic_path = required_env("E2E_TOPIC_URL")
    topic_url = loopback_url(urljoin(f"{base_url}/", topic_path), "E2E_TOPIC_URL")
    class_path = f"/clases/{class_id}"
    secrets = [
        admin_email,
        admin_password,
        student_email,
        student_password,
        readiness_token,
    ]
    console_errors: list[str] = []
    page_errors: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.on(
            "console",
            lambda message: console_errors.append(redact(message.text, secrets))
            if message.type == "error"
            else None,
        )
        page.on("pageerror", lambda error: page_errors.append(redact(str(error), secrets)))

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

            page.evaluate("document.activeElement?.blur()")
            page.keyboard.press("Tab")
            skip_link = page.get_by_role("link", name="Saltar al contenido principal")
            expect(skip_link).to_be_focused()
            page.keyboard.press("Enter")
            expect(page.locator("#contenido-principal")).to_be_focused()

            page.get_by_role("link", name="Sesiones").first.click()
            page.wait_for_url(f"{base_url}/sesiones")
            wait_for_network(page)

            page.locator(f'a[href="{class_path}"]').first.click()
            page.wait_for_url(f"{base_url}{class_path}")
            wait_for_network(page)

            page.locator(f'a[href="{topic_path}"]').first.click()
            page.wait_for_url(topic_url)
            wait_for_network(page)
            expect(page.locator("h1")).to_be_visible()

            page.get_by_role("button", name="Practicar casos").click()
            expect(page.get_by_role("status")).to_have_text("Avance guardado")

            page.reload(wait_until="networkidle")
            current_step = page.locator(
                'nav[aria-label="Recorrido de aprendizaje"] button[aria-current="step"]'
            )
            expect(current_step).to_contain_text("Aplica")

            page.get_by_role("link", name="Panel editorial").first.click()
            page.wait_for_url(f"{base_url}/administrar")
            wait_for_network(page)
            expect(page.get_by_role("heading", name="Panel editorial", exact=True)).to_be_visible()

            published_card = page.get_by_role("article").filter(has_text="Publicadas")
            expect(published_card.locator("p").first).to_have_text("1")
            editorial_class_path = f"/administrar/clases/{class_id}"
            editorial_class_link = page.locator(
                f'a[href="{editorial_class_path}"]'
            ).first
            expect(editorial_class_link).to_contain_text(
                "Clase sintética de persistencia"
            )
            editorial_class_link.click()
            page.wait_for_url(f"{base_url}{editorial_class_path}")
            wait_for_network(page)

            expect(
                page.get_by_role(
                    "heading", name="Clase sintética de persistencia", exact=True
                )
            ).to_be_visible()
            expect(page.get_by_text("Estado actual: Publicada", exact=True)).to_be_visible()
            expect(
                page.get_by_role("heading", name="Publicación", exact=True)
            ).to_be_visible()
            expect(
                page.get_by_role("button", name="Publicar clase", exact=True)
            ).to_be_disabled()
            expect(page.locator(f'a[href="{topic_path}"]').first).to_contain_text(
                "Aprobado"
            )

            if console_errors or page_errors:
                details = "; ".join(
                    [
                        *(f"console: {item}" for item in console_errors),
                        *(f"page: {item}" for item in page_errors),
                    ]
                )
                raise AssertionError(f"El navegador registró errores: {details}")

            print(
                "[OK] E2E local: acceso estudiantil privado rechazado; login admin, skip-link, estudio, autosave, persistencia y panel editorial read-only verificados; 0 errores de consola/página."
            )
        finally:
            browser.close()


if __name__ == "__main__":
    main()
