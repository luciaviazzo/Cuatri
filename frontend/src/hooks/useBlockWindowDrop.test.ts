import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useBlockWindowDrop } from './useBlockWindowDrop'

function dispatch(type: 'dragover' | 'drop'): boolean {
  const event = new Event(type, { cancelable: true, bubbles: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
}

describe('useBlockWindowDrop', () => {
  it('mientras está montado cancela el comportamiento por defecto de dragover y drop', () => {
    const { unmount } = renderHook(() => useBlockWindowDrop())
    expect(dispatch('dragover')).toBe(true)
    expect(dispatch('drop')).toBe(true)
    unmount()
  })

  it('al desmontar restablece el comportamiento del navegador', () => {
    const { unmount } = renderHook(() => useBlockWindowDrop())
    unmount()
    expect(dispatch('dragover')).toBe(false)
    expect(dispatch('drop')).toBe(false)
  })
})
