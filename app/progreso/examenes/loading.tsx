export default function ExamHistoryLoading() {
  return (
    <div aria-live="polite" role="status">
      <p className="text-sm font-semibold text-success">Registro de resultados</p>
      <h1 className="mt-2 text-3xl tracking-[-0.035em] sm:text-4xl">
        Cargando historial de exámenes
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted">
        Estamos reuniendo tus intentos guardados y su contenido relacionado.
      </p>
      <span className="sr-only">Espera un momento.</span>
    </div>
  );
}
