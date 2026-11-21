import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'
import { homeCopy } from './homeCopy'

const careerButton = () => screen.getByRole('button', { name: '+ Cargar mi primera carrera' })
const sampleButton = () => screen.getByRole('button', { name: 'un plan de ejemplo' })

describe('HomePage: avisos de las acciones', () => {
  it('el botón principal muestra el aviso de cargar carrera sin salir de la pantalla', async () => {
    const before = window.location.href
    render(<HomePage />)
    await userEvent.click(careerButton())
    expect(screen.getByRole('status')).toHaveTextContent(homeCopy.notices.career)
    expect(window.location.href).toBe(before)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('"un plan de ejemplo" muestra el aviso del plan de ejemplo', async () => {
    render(<HomePage />)
    await userEvent.click(sampleButton())
    expect(screen.getByRole('status')).toHaveTextContent(homeCopy.notices.sample)
  })

  it('cambiar de acción reemplaza el aviso: nunca hay dos a la vez', async () => {
    render(<HomePage />)
    await userEvent.click(careerButton())
    await userEvent.click(sampleButton())
    const region = screen.getByRole('status')
    expect(region).toHaveTextContent(homeCopy.notices.sample)
    expect(region).not.toHaveTextContent(homeCopy.notices.career)
    expect(screen.getAllByText(/muy pronto|en camino/)).toHaveLength(1)
  })

  it('activar la misma acción varias veces no duplica el aviso', async () => {
    render(<HomePage />)
    await userEvent.click(careerButton())
    await userEvent.click(careerButton())
    await userEvent.click(careerButton())
    expect(screen.getAllByText(homeCopy.notices.career)).toHaveLength(1)
  })

  it('"Cerrar aviso" lo quita', async () => {
    render(<HomePage />)
    await userEvent.click(careerButton())
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('el foco se queda en el disparador cuando aparece el aviso', async () => {
    render(<HomePage />)
    careerButton().focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent(homeCopy.notices.career)
    expect(careerButton()).toHaveFocus()
  })

  it('al cerrar el aviso el foco vuelve al botón que lo abrió', async () => {
    render(<HomePage />)
    await userEvent.click(careerButton())
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(careerButton()).toHaveFocus()
    await userEvent.click(sampleButton())
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(sampleButton()).toHaveFocus()
  })

  it('funciona con teclado: Enter y Espacio activan ambas acciones', async () => {
    render(<HomePage />)
    sampleButton().focus()
    await userEvent.keyboard(' ')
    expect(screen.getByRole('status')).toHaveTextContent(homeCopy.notices.sample)
    careerButton().focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent(homeCopy.notices.career)
  })
})
