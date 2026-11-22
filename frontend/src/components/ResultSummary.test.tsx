import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResultSummary } from './ResultSummary'

describe('ResultSummary', () => {
  it('muestra carrera, plan y versión cuando el archivo los trae', () => {
    render(
      <ResultSummary
        info={{ program: 'Licenciatura en Informática', plan: '2019', version: '7' }}
        total={61}
        approved={24}
      />,
    )
    expect(screen.getByText('Licenciatura en Informática')).toBeInTheDocument()
    expect(screen.getByText('2019')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('61 materias detectadas · 24 aprobadas')).toBeInTheDocument()
  })

  it('omite lo que el archivo no trae, sin inventarlo', () => {
    render(<ResultSummary info={{ program: null, plan: '2019', version: null }} total={3} approved={0} />)
    expect(screen.queryByText('Carrera')).not.toBeInTheDocument()
    expect(screen.queryByText('Versión')).not.toBeInTheDocument()
    expect(screen.getByText('Plan')).toBeInTheDocument()
  })

  it('usa el singular con una sola materia y una sola aprobada', () => {
    render(<ResultSummary info={{ program: null, plan: null, version: null }} total={1} approved={1} />)
    expect(screen.getByText('1 materia detectada · 1 aprobada')).toBeInTheDocument()
  })
})
