# Quickstart de validación: Pantalla de inicio

Guía para verificar el home de punta a punta una vez implementado. Contrato:
[contracts/ui-contract.md](contracts/ui-contract.md). Modelo: [data-model.md](data-model.md).

## Prerrequisitos

- `cd frontend && npm ci` (incluye las fuentes autoalojadas).
- No hace falta backend: el home no hace pedidos de red.

## Checks automáticos

```bash
cd frontend
npm run lint && npx tsc -b && npm test && npm run build
```

Esperado: todo en verde. Incluye los tests de textos, avisos, teclado, contraste WCAG de los tokens
y de arquitectura del frontend.

## Verificación manual en local (`npm run dev`)

Abrir http://localhost:5173 y revisar:

1. **Contenido y orden**: franja, logo, "Cuatri", título en dos líneas (la 2ª en rosa profundo),
   bajada, tres pasos de colores, botón, texto con el enlace. **No** hay "Salir", pie de página ni
   indicador de estado.
2. **Avisos**: activar el botón y el enlace con mouse, teclado (Tab + Enter/Espacio) y toque. Aparece
   un solo aviso, se reemplaza al cambiar de acción, no se duplica y se cierra con "Cerrar aviso".
3. **Teclado**: Tab recorre botón → enlace → cierre del aviso; el foco se ve con claridad en cada uno.
4. **Responsive** (DevTools, modo dispositivo): 320, 360×640, 1280×720 y 1920 px. Sin scroll
   horizontal; título y botón visibles sin desplazarse en 360×640 y 1280×720.
5. **Zoom 200 %**: todo legible y alcanzable.
6. **Movimiento reducido**: con la preferencia activada no hay transiciones.
7. **Logo caído**: bloquear `/logo.svg` en DevTools y confirmar que se entiende la marca por el
   nombre y el texto alternativo.
8. **Lector de pantalla** (NVDA en Windows, opcional): el aviso se anuncia al aparecer.

## Verificación en el deploy (Principio IX)

Después del push a `main`, Vercel publica solo. Repetir los escenarios 1, 2, 3 y 4 en
`https://cuatri.vercel.app` (escritorio y celular real). El home no depende del backend, pero se
confirma igualmente que `https://cuatri-backend.onrender.com/health` sigue respondiendo.
