import type { HealthState } from '../../lib/api/health'

// Pure decision layer for the backend status banner. The component just probes and
// renders; *what* to say — and the priority when several things are wrong — lives
// here so it is testable in node. Priority matters: a build-time misconfiguration
// is the root cause and must win over the "unreachable" symptom it produces.

export interface BannerContent {
  tone: 'error' | 'warn'
  /** Short headline. */
  title: string
  /** One line of plain-language detail. */
  detail: string
}

export interface BannerInput {
  /** From base.ts: the build shipped an unusable backend origin. */
  misconfigured: boolean
  /** The reason string that accompanies a misconfiguration, if any. */
  reason: string | null
  /** Latest liveness probe; null while the first probe is still in flight. */
  health: HealthState | null
}

/**
 * Decide the banner to show, or null for "everything's fine / still checking".
 * Order is deliberate: misconfiguration (root cause) > unreachable > error.
 */
export function backendBanner({ misconfigured, reason, health }: BannerInput): BannerContent | null {
  if (misconfigured) {
    return {
      tone: 'error',
      title: '백엔드 설정 오류',
      detail:
        reason ??
        '이 빌드는 백엔드 주소가 잘못 설정되어 있어요. 배포 환경변수를 확인해 주세요.',
    }
  }

  if (health === 'unreachable') {
    return {
      tone: 'error',
      title: '백엔드에 연결할 수 없어요',
      detail:
        '행성·광도곡선·사냥 기능이 지금 동작하지 않습니다. 백엔드 서버가 켜져 있는지, 주소가 맞는지 확인해 주세요.',
    }
  }

  if (health === 'error') {
    return {
      tone: 'warn',
      title: '백엔드가 오류를 응답했어요',
      detail: '서버에는 닿았지만 정상 응답이 아닙니다. 일부 기능이 불안정할 수 있어요.',
    }
  }

  // 'ok' or still probing (null) → no banner.
  return null
}
