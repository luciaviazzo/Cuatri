import { useCallback, useState } from 'react'
import type { NoticeKind } from '../types/notice'

/** Estado del aviso visible: como máximo uno a la vez; mostrar uno nuevo reemplaza al anterior. */
export function useNotice() {
  const [activeNotice, setActiveNotice] = useState<NoticeKind | null>(null)
  // Mismo valor => React no re-renderiza: activar la misma acción dos veces no duplica el aviso.
  const show = useCallback((kind: NoticeKind) => setActiveNotice(kind), [])
  const dismiss = useCallback(() => setActiveNotice(null), [])
  return { activeNotice, show, dismiss }
}
