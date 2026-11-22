# Contrato de consumo de la API: Cargar la carrera

> La pantalla **consume** endpoints que ya existen (feature 001); no define ninguno. La fuente de
> verdad de la API es su OpenAPI (`/docs`); este documento fija cómo la usa el frontend.

Base: `API_URL` (`VITE_API_URL`, sin `/` final).

## `POST {API_URL}/planes/extraccion`

- **Request**: `multipart/form-data` con un único campo `file` (el archivo elegido). Se construye
  con `FormData` y **no** se fija el encabezado `Content-Type` (el navegador agrega el `boundary`).
  Sin autenticación. Se envía con una `AbortSignal` (límite de 60 s).
- **200**: `{ "plan_info": { program, plan, version }, "subjects": [ { code, name, activity_type,
  credits, group, is_elective, year, reported_year, reported_term, origin, prerequisites, status } ] }`.
  Los decimales (`credits`, `status.grade`) llegan como texto.

### Traducción de respuestas a errores tipados

| Resultado de la llamada | `ExtractionErrorCode` | Se puede reintentar |
|-------------------------|-----------------------|---------------------|
| 400 con `error.code = empty_file` | `empty_file` | No (otro archivo) |
| 413 con `error.code = file_too_large` | `file_too_large` | No |
| 422 con `error.code = invalid_file` | `invalid_file` | No |
| 422 con `error.code = no_subjects_found` | `no_subjects_found` | No |
| 422 con `error.code = validation_error` | `invalid_file` | No |
| 5xx, 429, otro estado, cuerpo que no es JSON o sin `error.code` | `service_unavailable` | Sí |
| Falla de red, CORS bloqueado, sin conexión | `service_unavailable` | Sí |
| Aborto por los 60 s | `service_unavailable` | Sí |

Los mensajes del backend **no** se muestran tal cual: la pantalla usa sus propios textos por causa
([ui-contract.md](ui-contract.md)). Nunca se muestran detalles técnicos.

## `GET {API_URL}/health` (warm-up)

- Se dispara una vez al entrar a la pantalla, sin mostrar nada, para despertar al backend gratuito
  mientras la persona elige el archivo.
- Cualquier resultado o falla se ignora en silencio.

## Garantías de privacidad

- La respuesta no trae nombre ni legajo (la feature 001 los excluye) y la pantalla solo muestra los
  campos de arriba.
- El archivo y el resultado no se guardan en el dispositivo ni se registran en consola.

## Entorno

| Origen del frontend | Backend | Resultado |
|---------------------|---------|-----------|
| `https://cuatri.vercel.app` | `https://cuatri-backend.onrender.com` | Permitido (`CORS_ORIGINS`) |
| `http://localhost:5173` | `http://localhost:8000` | Permitido (valor por defecto) |
| `http://localhost:5173` | Render | Requiere sumar el origen a `CORS_ORIGINS` |
| Vistas previas de Vercel | Render | Requieren sumar su dominio a `CORS_ORIGINS` |
