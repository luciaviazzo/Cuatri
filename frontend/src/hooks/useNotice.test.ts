import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useNotice } from './useNotice'

describe('useNotice', () => {
  it('empieza sin ningún aviso', () => {
    const { result } = renderHook(() => useNotice())
    expect(result.current.activeNotice).toBeNull()
  })

  it.each(['career', 'sample'] as const)('show(%s) muestra ese aviso', (kind) => {
    const { result } = renderHook(() => useNotice())
    act(() => result.current.show(kind))
    expect(result.current.activeNotice).toBe(kind)
  })

  it('show reemplaza al aviso visible: nunca hay dos a la vez', () => {
    const { result } = renderHook(() => useNotice())
    act(() => result.current.show('career'))
    act(() => result.current.show('sample'))
    expect(result.current.activeNotice).toBe('sample')
    act(() => result.current.show('career'))
    expect(result.current.activeNotice).toBe('career')
  })

  it('show con el mismo tipo no cambia nada (no se duplica)', () => {
    const { result } = renderHook(() => useNotice())
    act(() => result.current.show('career'))
    const before = result.current.activeNotice
    act(() => result.current.show('career'))
    expect(result.current.activeNotice).toBe(before)
  })

  it('dismiss limpia el aviso, también si no había ninguno', () => {
    const { result } = renderHook(() => useNotice())
    act(() => result.current.dismiss())
    expect(result.current.activeNotice).toBeNull()
    act(() => result.current.show('sample'))
    act(() => result.current.dismiss())
    expect(result.current.activeNotice).toBeNull()
  })
})
