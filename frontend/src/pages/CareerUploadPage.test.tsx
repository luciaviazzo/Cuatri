import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import sampleJson from '../test-fixtures/extraction-sample.json'
import type { ExtractionResult } from '../types/plan'
import { groupByModule } from '../utils/groupByModule'
import { CareerUploadPage } from './CareerUploadPage'

vi.mock('../service/planService', async () => {
  const actual = await vi.importActual<typeof import('../service/planService')>('../service/planService')
  return { ...actual, extractPlan: vi.fn(), warmUp: vi.fn().mockResolvedValue(undefined) }
})
import { extractPlan, warmUp } from '../service/planService'

const sample = sampleJson as ExtractionResult
const extractPlanMock = vi.mocked(extractPlan)
const warmUpMock = vi.mocked(warmUp)
const planFile = () => new File([new Uint8Array(24 * 1024)], 'plan_sintetico.pdf', { type: 'application/pdf' })

function renderPage() {
  return render(
    <MemoryRouter>
      <CareerUploadPage />
    </MemoryRouter>,
  )
}

function fileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

async function analyzeSample(container: HTMLElement) {
  extractPlanMock.mockResolvedValue(sample)
  await userEvent.upload(fileInput(container), planFile())
  await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
  await screen.findByRole('heading', { level: 2, name: 'Esto es lo que encontramos' })
}

beforeEach(() => {
  extractPlanMock.mockClear()
  warmUpMock.mockClear()
})

describe('CareerUploadPage: antes de elegir el archivo', () => {
  it('muestra el título, la explicación con formatos y tamaño máximo y el área de carga', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Cargá tu carrera' })).toBeInTheDocument()
    const intro = screen.getByText(/Subí el reporte/).textContent ?? ''
    expect(intro).toContain('PDF')
    expect(intro).toContain('Excel (.xls)')
    expect(intro).toContain('10 MB')
    expect(screen.getByRole('button', { name: 'Elegir archivo' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Analizar mi plan' })).not.toBeInTheDocument()
  })

  it('despierta al backend una vez al entrar', () => {
    renderPage()
    expect(warmUpMock).toHaveBeenCalledTimes(1)
  })

  it('tiene la región de estado siempre presente', () => {
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('CareerUploadPage: elegir y analizar', () => {
  it('al elegir un archivo muestra su nombre y tamaño y el botón para analizar', async () => {
    const { container } = renderPage()
    await userEvent.upload(fileInput(container), planFile())
    expect(screen.getByText('plan_sintetico.pdf')).toBeInTheDocument()
    expect(screen.getByText('(24 KB)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Analizar mi plan' })).toBeEnabled()
  })

  it('mientras analiza muestra el estado de carga y no deja analizar de nuevo', async () => {
    const { container } = renderPage()
    let resolve!: (value: ExtractionResult) => void
    extractPlanMock.mockReturnValue(new Promise<ExtractionResult>((r) => (resolve = r)))
    await userEvent.upload(fileInput(container), planFile())
    await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    expect(screen.getAllByText('Analizando tu plan…').length).toBeGreaterThan(0)
    expect(screen.getByRole('status')).toHaveTextContent('Analizando tu plan…')
    expect(screen.queryByRole('button', { name: 'Analizar mi plan' })).not.toBeInTheDocument()
    expect(extractPlanMock).toHaveBeenCalledTimes(1)
    resolve(sample)
    await screen.findByRole('heading', { level: 2 })
  })
})

describe('CareerUploadPage: resultado', () => {
  it('muestra el resumen con carrera, plan, versión, materias y aprobadas', async () => {
    const { container } = renderPage()
    await analyzeSample(container)
    expect(screen.getByText('Licenciatura en Informática')).toBeInTheDocument()
    expect(screen.getByText('14 materias detectadas · 6 aprobadas')).toBeInTheDocument()
  })

  it('agrupa las materias por módulo, incluido el de otra propuesta, y la cantidad coincide', async () => {
    const { container } = renderPage()
    await analyzeSample(container)
    const groups = groupByModule(sample.subjects)
    expect(groups.length).toBeGreaterThan(3)
    for (const group of groups) {
      const label = `${group.name} (${group.subjects.length})`
      const region = screen.getByRole('region', { name: label })
      expect(within(region).getAllByRole('listitem')).toHaveLength(group.subjects.length)
    }
    expect(screen.getByRole('region', { name: /Diplomatura/ })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(sample.subjects.length)
  })

  it('muestra los datos de cada materia, con optativas y estados', async () => {
    const { container } = renderPage()
    await analyzeSample(container)
    expect(screen.getByText('Lectura y Escritura Académica')).toBeInTheDocument()
    expect(screen.getAllByText('Optativa').length).toBe(sample.subjects.filter((s) => s.is_elective).length)
    expect(screen.getAllByText(/^Aprobada · nota/).length).toBe(6)
    expect(screen.getByText('2 (Desaprobado)')).toBeInTheDocument()
  })

  it('explica que el año del plan y las correlativas están "sin determinar" y que no se guarda', async () => {
    const { container } = renderPage()
    await analyzeSample(container)
    expect(screen.getByText(/figuran como «sin determinar»/)).toBeInTheDocument()
    expect(screen.getByText(/solo para revisar y todavía no se guarda/)).toBeInTheDocument()
  })

  it('el foco pasa al título del resultado y la región de estado anuncia el resultado', async () => {
    const { container } = renderPage()
    await analyzeSample(container)
    expect(screen.getByRole('heading', { level: 2, name: 'Esto es lo que encontramos' })).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('14 materias detectadas, 6 aprobadas')
  })

  it('ofrece "Cargar otro archivo" y "Volver al inicio"', async () => {
    const { container } = renderPage()
    await analyzeSample(container)
    expect(screen.getByRole('button', { name: 'Cargar otro archivo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
  })

  it('"Cargar otro archivo" vuelve al inicio de la pantalla y deja el foco en "Elegir archivo"', async () => {
    const { container } = renderPage()
    await analyzeSample(container)
    await userEvent.click(screen.getByRole('button', { name: 'Cargar otro archivo' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Cargá tu carrera' })).toBeInTheDocument()
    expect(screen.queryByText('Esto es lo que encontramos')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Elegir archivo' })).toHaveFocus()
  })
})
