import type { Apod } from '../../lib/api/apod'

interface Props {
  apod: Apod
}

/**
 * Pale Blue Code — APOD 카드
 *
 * ─── 비이미지 미디어 처리 (phase-1-to-2 §4 미해결 항목 해결) ──
 *   기존엔 이미지가 아니면 무조건 `<iframe src={apod.url}>` → apod.nasa.gov 등이
 *   X-Frame-Options 로 임베드 거부 → "연결을 거부했습니다".
 *
 *   수정: YouTube / Vimeo 처럼 *임베드 가능한 호스트만* iframe. 그 외(apod.nasa.gov
 *   인터랙티브, 기타)는 임베드하지 않고 *새 탭 링크 카드* 로 안전하게 폴백.
 *   media_type 이 'video' 든 'other' 든 동일하게 (image 가 아니면 비이미지 경로).
 */
function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname.startsWith('/embed/')) return url // 이미 embed
      const v = u.searchParams.get('v')
      return v ? `https://www.youtube.com/embed/${v}` : null
    }
    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`
    }
    if (host === 'player.vimeo.com') return url
    if (host === 'vimeo.com') {
      return `https://player.vimeo.com/video${u.pathname}`
    }
    return null // 임베드 불가 호스트 → 링크 폴백
  } catch {
    return null
  }
}

export default function ApodCard({ apod }: Props) {
  const isImage = apod.media_type === 'image'
  const embedUrl = isImage ? null : getEmbedUrl(apod.url)

  return (
    <div className="max-w-2xl">
      {/* 날짜 */}
      <p className="text-cosmos-muted font-mono text-xs mb-2 tracking-widest">
        {apod.date}
      </p>

      {/* 제목 */}
      <h2 className="text-cosmos-text text-2xl font-semibold mb-4">
        {apod.title}
      </h2>

      {/* 미디어 — 이미지 / 임베드 가능 영상 / 폴백 링크 */}
      {isImage ? (
        <img
          src={apod.url}
          alt={apod.title}
          fetchPriority="high"
          decoding="async"
          className="aspect-video w-full rounded-lg mb-4 border border-cosmos-border bg-cosmos-surface object-contain"
        />
      ) : embedUrl ? (
        <iframe
          src={embedUrl}
          title={apod.title}
          className="w-full aspect-video rounded-lg mb-4 border border-cosmos-border"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <a
          href={apod.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex aspect-video w-full items-center justify-center rounded-lg mb-4 border border-cosmos-border bg-cosmos-surface px-6 text-center text-sm text-cosmos-muted transition-colors hover:border-cosmos-nebula hover:text-cosmos-text"
        >
          🔭 오늘의 APOD는 영상 / 인터랙티브 콘텐츠야 — apod.nasa.gov에서 보기 ↗
        </a>
      )}

      {/* 설명 */}
      <p className="text-cosmos-muted text-sm leading-relaxed">
        {apod.explanation}
      </p>

      {/* 저작권 */}
      {apod.copyright && (
        <p className="text-cosmos-subtle text-xs mt-3 font-mono">
          © {apod.copyright}
        </p>
      )}
    </div>
  )
}
