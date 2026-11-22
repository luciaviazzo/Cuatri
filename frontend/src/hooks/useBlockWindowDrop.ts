import { useEffect } from 'react'

/**
 * Si se suelta un archivo fuera del área de carga, el navegador por defecto lo abre y la persona
 * pierde la app. Mientras la pantalla está montada se cancela ese comportamiento.
 */
export function useBlockWindowDrop(): void {
  useEffect(() => {
    const block = (event: Event) => event.preventDefault()
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])
}
