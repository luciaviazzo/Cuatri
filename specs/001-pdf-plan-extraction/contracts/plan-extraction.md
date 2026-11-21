# Contrato de comportamiento: extracción de plan

> Documento de **diseño**. La documentación de la API (OpenAPI) se genera automáticamente desde
> los schemas y las firmas (Principio VIII) y no se escribe a mano.

## `POST /planes/extraccion` (ruta tentativa, ver Q-01)

- **Request**: `multipart/form-data` con un campo `file` (PDF o Excel .xls). Sin autenticación. El
  formato se identifica por el contenido, no por la extensión.
- **200**: `{ "plan_info": {...}, "subjects": [ {...}, ... ] }`, siempre con al menos una materia.
  No se persiste nada.

### Ejemplo (recortado)

```json
{
  "plan_info": { "program": "Licenciatura en Informática", "plan": "2019", "version": "7" },
  "subjects": [
    {
      "code": "80000", "name": "Lectura y Escritura Académica", "activity_type": "Materia",
      "credits": "10.00", "group": "Ciclo Introductorio : Depto. de Ciencia y Tec (X-W-P)",
      "is_elective": false, "year": null, "reported_year": null, "reported_term": null,
      "origin": "Promoción", "prerequisites": null,
      "status": { "kind": "approved", "grade": "9", "condition": "Promocionado", "text": null }
    },
    {
      "code": "01309", "name": "Teoría de la Computación", "activity_type": "Materia",
      "credits": "8.00", "group": "Cursos Avanzados de la carr:Lic en Informática(2012-2015-19)",
      "is_elective": false, "year": null, "reported_year": null, "reported_term": null,
      "origin": null, "prerequisites": null, "status": null
    }
  ]
}
```

### Semántica de campos

| Campo | Valor | Significado |
|-------|-------|-------------|
| `year` | `null` | Año del plan sin asignar (siempre, en el formato SIU) |
| `prerequisites` | `null` | Sin determinar (siempre, en el formato SIU) |
| `prerequisites` | `[]` | Confirmado sin correlativas (solo si el archivo lo dice) |
| `prerequisites[]` | `{kind: "subject" \| "unparsed", text}` | Correlativa o requisito literal |
| `status` | `null` | Sin nota ni estado |
| `status` | `{kind: "approved", grade, condition}` | Aprobada con nota |
| `status` | `{kind: "in_progress"}` | En curso |
| `status` | `{kind: "unparsed", text}` | Estado literal no interpretado |
| `is_elective` | `true` | Figura en un bloque "Materia genérica" |

No se devuelven nombre ni legajo del alumno.

### Errores (formato global `{"error": {"code", "message"}}`)

| HTTP | `code` | Cuándo |
|------|--------|--------|
| 400 | `empty_file` | Archivo sin contenido |
| 413 | `file_too_large` | Supera `MAX_UPLOAD_BYTES` |
| 422 | `invalid_file` | No es PDF ni Excel .xls válido (incluye imágenes con extensión `.pdf` o `.xls`, archivos corruptos o protegidos) |
| 422 | `no_subjects_found` | PDF o Excel válido sin materias reconocibles |
| 422 | `validation_error` | Falta el campo `file` |

Ningún error expone stack traces ni contenido del archivo.
