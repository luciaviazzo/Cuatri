import type { NoticeKind } from '../types/notice'

/** Textos del home en español rioplatense (contrato: specs/002-home-screen/contracts). */
export const homeCopy = {
  brand: 'Cuatri',
  titleLine1: 'Planificá tu cursada',
  titleLine2: 'sin volverte loca.',
  lead: 'Cargá tu carrera, marcá lo que aprobaste y Cuatri te muestra qué podés cursar, en qué orden y cuánto te queda.',
  steps: [
    { label: 'Cargá tu carrera', tone: 'rose' },
    { label: 'Marcá tus materias', tone: 'green' },
    { label: 'Generá opciones de cursada', tone: 'blue' },
  ],
  primaryAction: '+ Cargar mi primera carrera',
  samplePrefix: 'O explorá',
  sampleAction: 'un plan de ejemplo',
  sampleSuffix: 'para ver cómo funciona.',
  stepsLabel: 'Cómo funciona',
  logoAlt: 'Logo de Cuatri',
  noticeClose: 'Cerrar aviso',
  notices: {
    career: 'Cargar tu carrera va a estar disponible muy pronto. ¡Gracias por la paciencia!',
    sample: 'El plan de ejemplo todavía está en camino. ¡Pronto vas a poder explorarlo!',
  } satisfies Record<NoticeKind, string>,
} as const
