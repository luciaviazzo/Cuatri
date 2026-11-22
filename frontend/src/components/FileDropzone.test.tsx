import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FileDropzone, type FileDropzoneHandle } from './FileDropzone'

function input(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

describe('FileDropzone (con botón)', () => {
  it('muestra el título del área y el botón "Elegir archivo"', () => {
    render(<FileDropzone onFileSelected={() => {}} />)
    expect(screen.getByText('Arrastrá tu archivo acá')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Elegir archivo' })).toBeInTheDocument()
  })

  it('el input solo acepta PDF y Excel y queda fuera del orden de tabulación', () => {
    const { container } = render(<FileDropzone onFileSelected={() => {}} />)
    const accept = input(container).getAttribute('accept') ?? ''
    expect(accept).toContain('.pdf')
    expect(accept).toContain('.xls')
    expect(input(container)).toHaveAttribute('tabindex', '-1')
  })

  it('"Elegir archivo" abre el selector de archivos', async () => {
    const { container } = render(<FileDropzone onFileSelected={() => {}} />)
    const click = vi.spyOn(input(container), 'click')
    await userEvent.click(screen.getByRole('button', { name: 'Elegir archivo' }))
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('informa el archivo elegido con el selector', async () => {
    const onFileSelected = vi.fn()
    const { container } = render(<FileDropzone onFileSelected={onFileSelected} />)
    const file = new File([new Uint8Array(10)], 'plan.pdf', { type: 'application/pdf' })
    await userEvent.upload(input(container), file)
    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it('cancelar el selector sin elegir nada no hace nada', () => {
    const onFileSelected = vi.fn()
    const { container } = render(<FileDropzone onFileSelected={onFileSelected} />)
    fireEvent.change(input(container), { target: { files: [] } })
    expect(onFileSelected).not.toHaveBeenCalled()
  })

  it('expone openPicker y focusChooseButton para que la página los use', () => {
    const ref = createRef<FileDropzoneHandle>()
    const { container } = render(<FileDropzone ref={ref} onFileSelected={() => {}} />)
    const click = vi.spyOn(input(container), 'click')
    ref.current?.openPicker()
    expect(click).toHaveBeenCalledTimes(1)
    ref.current?.focusChooseButton()
    expect(screen.getByRole('button', { name: 'Elegir archivo' })).toHaveFocus()
  })
})
