# Quickstart de validación: extracción de plan desde PDF o Excel

Guía para verificar la feature de punta a punta una vez implementada. Contrato:
[contracts/plan-extraction.md](contracts/plan-extraction.md). Modelo: [data-model.md](data-model.md).

## Prerrequisitos

- Backend levantado (`docker compose up --build`). No hay API keys ni servicios externos.
- Archivos de prueba: los sintéticos de `backend/tests/fixtures/` y, si se tienen, los reales en
  `backend/tests/fixtures/private/` (ignorados por git).

## Checks automáticos

```bash
cd backend
uv run ruff check . && uv run mypy && uv run lint-imports && uv run pytest
```

Esperado: todo en verde. Los tests de muestras reales se saltan si no existe `private/`.

## Escenarios manuales (Swagger en http://localhost:8000/docs o curl)

```bash
curl -F "file=@plan.pdf" http://localhost:8000/planes/extraccion
curl -F "file=@plan.xls" http://localhost:8000/planes/extraccion
```

1. **PDF real**: 200 con 61 materias, 24 aprobadas con nota; `year` y `prerequisites` en `null`.
2. **XLS real**: las mismas materias que el PDF.
3. **Optativas**: las materias de los bloques "Materia genérica" con `is_elective: true`.
4. **Otra propuesta**: las materias del módulo de la diplomatura vienen con su `group`.
5. **Privacidad**: la respuesta y los logs no contienen el nombre ni el legajo del alumno.
6. **Archivo con columna de correlativas** (sintético): `null`, `[]` y lista con ítems `subject` y
   `unparsed`.
7. **Archivo vacío**: 400 `empty_file`.
8. **Imagen renombrada a `.pdf` o `.xls`**: 422 `invalid_file`.
9. **PDF o Excel sin materias**: 422 `no_subjects_found`.
10. **Archivo mayor al límite**: 413 `file_too_large`.
11. **OpenAPI**: `/docs` muestra el endpoint con el schema de respuesta y los errores.

## Verificación en el deploy (Principio IX)

Repetir los escenarios 1, 2 y 8 contra la URL pública del backend antes de dar la feature por
terminada. Verificar también que la imagen de Render instala las dependencias de lectura.
