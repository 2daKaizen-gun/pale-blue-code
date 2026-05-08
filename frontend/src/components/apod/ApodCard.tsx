import { Apod } from '../../lib/api/apod'

interface Props {
  apod: Apod
}

export default function ApodCard({ apod }: Props) {
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

      {/* 이미지 or 영상 */}
      {apod.media_type === 'image' ? (
        <img
          src={apod.url}
          alt={apod.title}
          className="w-full rounded-lg mb-4 border border-cosmos-border"
        />
      ) : (
        <iframe
          src={apod.url}
          title={apod.title}
          className="w-full aspect-video rounded-lg mb-4 border border-cosmos-border"
          allowFullScreen
        />
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
