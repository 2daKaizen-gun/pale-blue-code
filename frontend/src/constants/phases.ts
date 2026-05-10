export type PhaseStatus = 'done' | 'in-progress' | 'planned'

export interface Phase {
  number: number
  path: string
  emoji: string
  title: string
  subtitle: string
  question: string
  status: PhaseStatus
}

export const PHASES: Phase[] = [
  {
    number: 0,
    path: '/',
    emoji: '🚀',
    title: 'Pre-flight',
    subtitle: '출항 준비',
    question: '어떻게 일할 것인가?',
    status: 'done',
  },
  {
    number: 1,
    path: '/',
    emoji: '🏗️',
    title: 'Foundation',
    subtitle: '기반',
    question: '토대를 어떻게 놓는가?',
    status: 'done',
  },
  {
    number: 2,
    path: '/solar',
    emoji: '🪐',
    title: 'Solar System',
    subtitle: '태양계',
    question: '우리가 아는 우주는 어떻게 생겼는가?',
    status: 'in-progress',
  },
  {
    number: 3,
    path: '/gravity',
    emoji: '⚛️',
    title: 'Gravity',
    subtitle: '중력',
    question: '우주는 무엇으로 움직이는가?',
    status: 'planned',
  },
  {
    number: 4,
    path: '/blackhole',
    emoji: '🕳️',
    title: 'Light Bent',
    subtitle: '빛이 휘는 곳',
    question: '빛은 무엇 앞에서 휘어지는가?',
    status: 'planned',
  },
  {
    number: 5,
    path: '/exoplanet',
    emoji: '🔭',
    title: 'Exoplanet',
    subtitle: '외계행성',
    question: '우리는 다른 별을 어떻게 알게 되었는가?',
    status: 'planned',
  },
  {
    number: 6,
    path: '/data',
    emoji: '📉',
    title: 'Data',
    subtitle: '데이터',
    question: '데이터는 어떻게 노래하는가?',
    status: 'planned',
  },
  {
    number: 7,
    path: '/signal',
    emoji: '📡',
    title: 'Signal',
    subtitle: '신호',
    question: '어떻게 행성을 찾는가?',
    status: 'planned',
  },
  {
    number: 8,
    path: '/hunt',
    emoji: '🎯',
    title: 'Hunt',
    subtitle: '사냥',
    question: '그래서 — 새 행성을 찾을 수 있는가?',
    status: 'planned',
  },
]
