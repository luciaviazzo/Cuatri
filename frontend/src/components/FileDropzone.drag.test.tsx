import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FileDropzone } from './FileDropzone'

const pdf = new File([new Uint8Array(10)], 'plan.pdf', { type: 'application/pdf' })
const xls = new File([new Uint8Array(10)], 'plan.xls')

function area() {
  return screen.getByText(/Arrastrá tu archivo acá|Soltá el archivo acá/).closest('div') as HTMLElement
}

const filesTransfer = (files: File[]) => ({ dataTransfer: { files, types: ['Files'] } })

describe('FileDropzone: arrastrar y soltar', () => {
  it('al arrastrar un archivo sobre el área lo indica visualmente y al salir vuelve', () => {
    render(<FileDropzone onFileSelected={() => {}} />)
    fireEvent.dragEnter(area(), filesTransfer([pdf]))
    expect(screen.getByText('Soltá el archivo acá')).toBeInTheDocument()
    expect(area().className).toContain('border-rose-deep')
    fireEvent.dragLeave(area(), filesTransfer([pdf]))
    expect(screen.getByText('Arrastrá tu archivo acá')).toBeInTheDocument()
  })

  it('pasar el arrastre por los hijos no hace parpadear el estado (contador de entradas)', () => {
    render(<FileDropzone onFileSelected={() => {}} />)
    const child = screen.getByRole('button', { name: 'Elegir archivo' })
    fireEvent.dragEnter(area(), filesTransfer([pdf]))
    fireEvent.dragEnter(child, filesTransfer([pdf]))
    fireEvent.dragLeave(area(), filesTransfer([pdf]))
    expect(screen.getByText('Soltá el archivo acá')).toBeInTheDocument()
    fireEvent.dragLeave(child, filesTransfer([pdf]))
    expect(screen.getByText('Arrastrá tu archivo acá')).toBeInTheDocument()
  })

  it('soltar un archivo se comporta como elegirlo con el botón', () => {
    const onFileSelected = vi.fn()
    render(<FileDropzone onFileSelected={onFileSelected} />)
    fireEvent.dragEnter(area(), filesTransfer([pdf]))
    const notPrevented = fireEvent.drop(area(), filesTransfer([pdf]))
    expect(onFileSelected).toHaveBeenCalledWith(pdf)
    expect(notPrevented).toBe(false) // se cancela el comportamiento por defecto: no se abre el archivo
    expect(screen.getByText('Arrastrá tu archivo acá')).toBeInTheDocument()
  })

  it('arrastrar algo que no es un archivo (por ejemplo texto) no activa el área', () => {
    const onFileSelected = vi.fn()
    render(<FileDropzone onFileSelected={onFileSelected} />)
    fireEvent.dragEnter(area(), { dataTransfer: { files: [], types: ['text/plain'] } })
    expect(screen.queryByText('Soltá el archivo acá')).not.toBeInTheDocument()
    fireEvent.drop(area(), { dataTransfer: { files: [], types: ['text/plain'] } })
    expect(onFileSelected).not.toHaveBeenCalled()
  })

  it('soltar varios archivos avisa que se analiza uno a la vez y deja elegir cuál', async () => {
    const onFileSelected = vi.fn()
    render(<FileDropzone onFileSelected={onFileSelected} />)
    fireEvent.drop(area(), filesTransfer([pdf, xls]))
    expect(onFileSelected).not.toHaveBeenCalled()
    expect(screen.getByText('Soltaste 2 archivos. Elegí cuál querés analizar:')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'plan.xls' }))
    expect(onFileSelected).toHaveBeenCalledWith(xls)
    expect(screen.queryByText(/Soltaste 2 archivos/)).not.toBeInTheDocument()
  })

  it('elegir con el botón después de soltar varios descarta la lista', async () => {
    const { container } = render(<FileDropzone onFileSelected={() => {}} />)
    fireEvent.drop(area(), filesTransfer([pdf, xls]))
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, pdf)
    expect(screen.queryByText(/Soltaste 2 archivos/)).not.toBeInTheDocument()
  })
})
