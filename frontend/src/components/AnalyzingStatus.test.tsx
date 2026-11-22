import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnalyzingStatus } from './AnalyzingStatus'

describe('AnalyzingStatus', () => {
  it('muestra "Analizando tu plan…" con el spinner decorativo oculto a los lectores', () => {
    const { container } = render(<AnalyzingStatus slow={false} />)
    expect(screen.getByText('Analizando tu plan…')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.queryByText(/tardando un poco más/)).not.toBeInTheDocument()
  })

  it('con demora agrega el aviso amable', () => {
    render(<AnalyzingStatus slow />)
    expect(screen.getByText('Esto está tardando un poco más de lo normal. ¡Ya casi!')).toBeInTheDocument()
  })
})
