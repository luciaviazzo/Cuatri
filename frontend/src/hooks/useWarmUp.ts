import { useEffect } from 'react'
import { warmUp } from '../service/planService'

/** Despierta al backend gratuito al entrar a la pantalla, mientras la persona elige el archivo. */
export function useWarmUp(): void {
  useEffect(() => {
    void warmUp()
  }, [])
}
