import os
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


def main() -> None:
    base_url = loopback_url(required_env("E2E_BASE_URL"), "E2E_BASE_URL")
    admin_email = required_env("E2E_ADMIN_EMAIL")
    admin_password = required_env("E2E_ADMIN_PASSWORD")
    student_email = required_env("E2E_STUDENT_EMAIL")
    student_password = required_env("E2E_STUDENT_PASSWORD")
    class_id = required_env("E2E_CLASS_ID")
    topic_path = required_env("E2E_TOPIC_URL")
    topic_url = loopback_url(urljoin(f"{base_url}/", topic_path), "E2E_TOPIC_URL")
    class_path = f"/clases/{class_id}"
    secrets = [admin_email, admin_password, student_email, student_password]
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

            if console_errors or page_errors:
                details = "; ".join(
                    [
                        *(f"console: {item}" for item in console_errors),
                        *(f"page: {item}" for item in page_errors),
                    ]
                )
                raise AssertionError(f"El navegador registró errores: {details}")

            print(
                "[OK] E2E local: acceso estudiantil privado rechazado; login admin, skip-link, navegación, autosave y persistencia verificados; 0 errores de consola/página."
            )
        finally:
            browser.close()


if __name__ == "__main__":
    main()
