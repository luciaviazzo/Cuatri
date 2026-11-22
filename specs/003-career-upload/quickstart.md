# Quickstart de validación: Cargar la carrera

Guía para verificar la pantalla de punta a punta una vez implementada. Contratos:
[contracts/ui-contract.md](contracts/ui-contract.md) y
[contracts/api-consumption.md](contracts/api-consumption.md). Modelo: [data-model.md](data-model.md).

## Prerrequisitos

- `cd frontend && npm ci`.
- Backend de la feature 001: local (`docker compose up -d db` y `uv run uvicorn app.main:app --reload`
  en `backend/`) o el de Render (ver la nota de CORS en el contrato).
- Archivos de prueba: los sintéticos `backend/tests/fixtures/plan_sintetico.pdf` y `.xls`; el
  reporte real solo desde `backend/tests/fixtures/private/` (con datos personales, no se commitea).

## Checks automáticos

```bash
cd frontend
npm run lint && npx tsc -b && npm test && npm run build
```

Esperado: todo en verde. Incluye service, hook con temporizadores, componentes, página, arrastre,
contraste de tokens y arquitectura.

## Verificación manual en local (`npm run dev`, http://localhost:5173)

1. **Entrada**: en el inicio, "+ Cargar mi primera carrera" navega a `/cargar-carrera` (ya no hay
   aviso). La URL directa y la recarga funcionan.
2. **Elegir y analizar**: elegir `plan_sintetico.pdf`; se ve nombre y tamaño; "Analizar mi plan"
   muestra "Analizando tu plan…" y el botón queda deshabilitado; aparece el resultado con el foco
   en su título.
3. **Resultado**: resumen (carrera, plan, versión; 14 materias, 6 aprobadas con la muestra sintética),
   módulos con sus materias, optativas marcadas, "sin determinar" y el aviso de que no se guarda.
   Repetir con el `.xls`: mismo resultado.
4. **Muestra real** (opcional, local): 61 materias, 24 aprobadas; **ni el nombre ni el legajo**
   aparecen en ninguna parte de la pantalla.
5. **Arrastrar**: un archivo válido, uno inválido, varios a la vez, y soltar fuera del área (no debe
   abrir el archivo ni salir de la app).
6. **Validación previa**: un `.png`, un archivo de más de 10 MB y uno vacío avisan antes de enviar.
7. **Errores del servicio**: una imagen renombrada `.pdf` → `invalid_file`; un PDF sin materias →
   `no_subjects_found`; apagar el backend → "servicio no disponible" con "Reintentar".
8. **Demora**: con el backend detenido o lento, a los 10 s aparece el aviso de demora y a los 60 s el
   error de servicio.
9. **Un solo envío**: tocar "Analizar mi plan" varias veces seguidas no duplica la petición (pestaña
   Red de las DevTools).
10. **Teclado y lector**: Tab sigue el orden del contrato; "Cargar otro archivo" devuelve el foco a
    "Elegir archivo"; con NVDA (opcional) se anuncian el estado de carga, el resultado y los errores.
11. **Responsive**: 320, 360×640, 1280×720 y 1920 px, y zoom 200 %: sin scroll horizontal y con las
    61 materias legibles en el celular.
12. **Sin persistencia**: recargar con un resultado en pantalla vuelve al estado inicial; nada en
    `localStorage` ni `sessionStorage`.

## Verificación en el deploy (Principio IX)

Después del push a `main`, en `https://cuatri.vercel.app`:

- Repetir 1, 2, 3, 5, 6, 7 y 11 con los archivos sintéticos (nunca subir el reporte real a un servidor
  externo sin necesidad).
- Confirmar la **subida real** contra `https://cuatri-backend.onrender.com` (sin errores de CORS en
  la consola) y el comportamiento con el backend dormido (aviso de demora y, si hace falta, reintento).
