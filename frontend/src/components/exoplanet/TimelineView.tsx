import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { Planet } from '../../lib/api/exoplanet'
import { getMethodColor, METHOD_COLOR } from './methodColor'

interface Props {
  planets: Planet[]
}

interface YearDatum {
  year: number
  [method: string]: number
}

const MARGIN = { top: 20, right: 20, bottom: 50, left: 70 }
const HEIGHT = 440
const MILESTONES = [
  { year: 2009, label: 'Kepler' },
  { year: 2018, label: 'TESS' },
]

function computeTimeline(planets: Planet[]) {
  const valid = planets.filter(
    (p): p is Planet & { disc_year: number } => p.disc_year !== null
  )
  const methods = [...new Set(valid.map((p) => p.discoverymethod))].sort()
  const rawYears = valid.map((p) => p.disc_year)
  const minYear = Math.min(...rawYears)
  const maxYear = Math.max(...rawYears)
  const allYears = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

  // new-per-year counts
  const countByYearMethod: Record<number, Record<string, number>> = {}
  for (const y of allYears) countByYearMethod[y] = {}
  for (const p of valid) {
    const bucket = countByYearMethod[p.disc_year]
    bucket[p.discoverymethod] = (bucket[p.discoverymethod] ?? 0) + 1
  }

  // cumulative across years
  const running: Record<string, number> = Object.fromEntries(methods.map((m) => [m, 0]))
  const stackData: YearDatum[] = allYears.map((year) => {
    for (const m of methods) running[m] += countByYearMethod[year][m] ?? 0
    return { year, ...Object.fromEntries(methods.map((m) => [m, running[m]])) }
  })

  const totalAtMax = methods.reduce(
    (sum, m) => sum + ((stackData[stackData.length - 1][m] as number) ?? 0),
    0
  )

  return { methods, allYears, stackData, minYear, maxYear, totalAtMax }
}

export default function TimelineView({ planets }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { methods, allYears, stackData, minYear, maxYear, totalAtMax } = useMemo(
    () => computeTimeline(planets),
    [planets]
  )

  const [currentYear, setCurrentYear] = useState(maxYear)
  const [playing, setPlaying] = useState(false)

  // stop when animation reaches end
  useEffect(() => {
    if (playing && currentYear >= maxYear) setPlaying(false)
  }, [playing, currentYear, maxYear])

  // tick forward
  useEffect(() => {
    if (!playing) return
    const id = setInterval(
      () => setCurrentYear((y) => Math.min(y + 1, maxYear)),
      160
    )
    return () => clearInterval(id)
  }, [playing, maxYear])

  const handlePlay = useCallback(() => {
    if (playing) {
      setPlaying(false)
    } else if (currentYear >= maxYear) {
      setCurrentYear(minYear)
      setPlaying(true)
    } else {
      setPlaying(true)
    }
  }, [playing, currentYear, minYear, maxYear])

  // D3 draw
  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container || stackData.length === 0) return

    function draw() {
      const width = container!.clientWidth
      const innerW = width - MARGIN.left - MARGIN.right
      const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

      d3.select(svg).selectAll('*').remove()

      const visibleData = stackData.filter((d) => d.year <= currentYear)
      if (visibleData.length === 0) return

      const root = d3
        .select(svg)
        .attr('width', width)
        .attr('height', HEIGHT)
        .append('g')
        .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

      const xScale = d3
        .scaleBand()
        .domain(allYears.map(String))
        .range([0, innerW])
        .padding(0.15)

      const yScale = d3
        .scaleLinear()
        .domain([0, totalAtMax * 1.05])
        .range([innerH, 0])

      const stack = d3
        .stack<YearDatum>()
        .keys(methods)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone)

      const series = stack(visibleData)

      series.forEach((methodSeries, i) => {
        root
          .selectAll<SVGRectElement, d3.SeriesPoint<YearDatum>>(`rect.s${i}`)
          .data(methodSeries)
          .join('rect')
          .attr('class', `s${i}`)
          .attr('x', (d) => xScale(String(d.data.year)) ?? 0)
          .attr('y', (d) => yScale(d[1]))
          .attr('height', (d) => Math.max(0, yScale(d[0]) - yScale(d[1])))
          .attr('width', xScale.bandwidth())
          .attr('fill', getMethodColor(methods[i]))
          .attr('fill-opacity', 0.85)
      })

      // X axis — tick every 5 years
      root
        .append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(
          d3
            .axisBottom(xScale)
            .tickValues(allYears.filter((y) => y % 5 === 0).map(String))
        )
        .call((g) => g.select('.domain').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('.tick line').attr('stroke', '#1e293b'))
        .call((g) =>
          g.selectAll('text').attr('fill', '#64748b').attr('font-size', '11px')
        )

      // Y axis
      root
        .append('g')
        .call(d3.axisLeft(yScale).ticks(6))
        .call((g) => g.select('.domain').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('.tick line').attr('stroke', '#1e293b'))
        .call((g) =>
          g.selectAll('text').attr('fill', '#64748b').attr('font-size', '11px')
        )

      root
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -54)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text('누적 발견 수')

      // Milestone markers
      MILESTONES.filter((m) => m.year <= currentYear).forEach(({ year, label }) => {
        const x = (xScale(String(year)) ?? 0) + xScale.bandwidth() / 2
        root
          .append('line')
          .attr('x1', x).attr('x2', x)
          .attr('y1', 0).attr('y2', innerH)
          .attr('stroke', '#fbbf24')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4 3')
        root
          .append('text')
          .attr('x', x + 4)
          .attr('y', 13)
          .attr('fill', '#fbbf24')
          .attr('font-size', '10px')
          .attr('font-family', 'Space Mono, monospace')
          .text(label)
      })

      // Current-year cursor (when not at end)
      if (currentYear < maxYear) {
        const cx = (xScale(String(currentYear)) ?? 0) + xScale.bandwidth()
        root
          .append('line')
          .attr('x1', cx).attr('x2', cx)
          .attr('y1', 0).attr('y2', innerH)
          .attr('stroke', '#e2e8f0')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2 2')
          .attr('opacity', 0.35)
      }
    }

    draw()
    const obs = new ResizeObserver(draw)
    obs.observe(container)
    return () => {
      obs.disconnect()
      d3.select(svg).selectAll('*').remove()
    }
  }, [stackData, allYears, methods, currentYear, maxYear, totalAtMax])

  const currentDatum = stackData.find((d) => d.year === currentYear)
  const currentTotal = currentDatum
    ? methods.reduce((sum, m) => sum + ((currentDatum[m] as number) ?? 0), 0)
    : 0

  const btnLabel = playing ? '⏸ 일시정지' : currentYear >= maxYear ? '↺ 다시' : '▶ 재생'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlay}
          className="rounded border border-cosmos-border px-4 py-2 font-mono text-sm text-cosmos-muted transition-colors hover:text-cosmos-text"
        >
          {btnLabel}
        </button>
        <div className="font-mono text-sm">
          <span className="text-cosmos-muted">연도 </span>
          <span className="text-cosmos-nebula">{currentYear}</span>
          <span className="ml-3 text-xs text-cosmos-muted">
            행성 {currentTotal.toLocaleString()}개
          </span>
        </div>
      </div>

      <div className="relative" ref={containerRef}>
        <svg ref={svgRef} className="w-full" />
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(METHOD_COLOR).map(([method, color]) => (
          <div key={method} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="font-mono text-xs text-cosmos-muted">{method}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
