import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SelectedFile } from './SelectedFile'

describe('SelectedFile', () => {
  it('muestra el nombre y el tamaño legible del archivo', () => {
    const file = new File([new Uint8Array(24 * 1024)], 'plan_estudios.pdf')
    render(<SelectedFile file={file} onChange={() => {}} />)
    expect(screen.getByText('plan_estudios.pdf')).toBeInTheDocument()
    expect(screen.getByText('(24 KB)')).toBeInTheDocument()
  })

  it('"Cambiar archivo" avisa que se quiere elegir otro', async () => {
    const onChange = vi.fn()
    render(<SelectedFile file={new File([new Uint8Array(10)], 'a.pdf')} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar archivo' }))
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
