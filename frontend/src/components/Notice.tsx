import { useEffect, useRef } from 'react'
import { homeCopy } from '../pages/homeCopy'
import type { NoticeKind } from '../types/notice'

interface NoticeProps {
  kind: NoticeKind | null
  onDismiss: () => void
}

/**
 * Aviso amable de "próximamente". La región de estado existe siempre en el DOM: los lectores de
 * pantalla solo anuncian los cambios de una región viva que ya estaba presente.
 */
export function Notice({ kind, onDismiss }: NoticeProps) {
  const box = useRef<HTMLDivElement>(null)

  // En pantallas bajas el aviso aparece debajo del borde: se lo lleva a la vista. El foco no se mueve.
  useEffect(() => {
    if (kind === null) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    box.current?.scrollIntoView?.({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [kind])

  return (
    <div role="status" aria-live="polite" className="w-full">
      {kind !== null && (
        <div
          ref={box}
          className="mt-6 flex items-start gap-3 rounded-xl border border-rainbow-amarillo-border bg-rainbow-amarillo-bg px-4 py-3 text-left text-rainbow-amarillo-text"
        >
          <p className="flex-1">{homeCopy.notices[kind]}</p>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={homeCopy.noticeClose}
            className="-my-1 -mr-1 cursor-pointer rounded-md px-2 py-1 text-xl leading-none font-bold"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}
    </div>
  )
}
