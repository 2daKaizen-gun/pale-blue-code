import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { MonotransitCurve, MonotransitCurveEvent } from '../../lib/api/monotransit'
import { DISCRIMINATOR_LABEL } from './monotransitCopy'

/**
 * The light curve behind a star's verdict (sub-11-13) — the last legibility piece. It draws the
 * SAME detrended, normalized curve the single-transit search saw, and marks every event the
 * search found, coloured by what became of it: emerald for a candidate, red for a significant dip
 * the discriminators rejected, grey for an insignificant blip. A quiet star simply shows a flat,
 * marker-free curve — the honest picture of "nothing there". No zoom; this is a glance, not a tool.
 */

const MARGIN = { top: 10, right: 12, bottom: 28, left: 44 }
const HEIGHT = 200

// The colour of an event marker is its fate, not its loudness — significance alone never wins.
function eventColor(e: MonotransitCurveEvent): string {
  if (e.candidate) return '#34d399' // emerald — cleared every gate
  if (e.significant) return '#f87171' // red — loud, but a discriminator caught it
  return '#64748b' // grey — a blip below the significance floor
}

// The one-word fate of an event, matching its marker colour.
function eventFate(e: MonotransitCurveEvent): string {
  if (e.candidate) return '후보'
  if (e.significant) return '기각'
  return '잡음'
}

// The short reason each failed gate gives — the first phrase of its plain-language label. Shown
// for EVERY event with a failed gate, even an insignificant one: a sub-threshold blip that also
// sits on a segment edge reads as the instrument artifact it is, not a wistful near-miss.
function failedShort(e: MonotransitCurveEvent): string {
  return (e.failed_checks ?? []).map((f) => DISCRIMINATOR_LABEL[f]?.split(' ')[0] ?? f).join(' · ')
}

export default function MonotransitCurveChart({ curve }: { curve: MonotransitCurve }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container || curve.time.length === 0) return

    const points = curve.time.map((t, i) => ({ t, f: curve.flux[i] }))

    function draw() {
      const width = container!.clientWidth
      const innerW = width - MARGIN.left - MARGIN.right
      const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

      d3.select(svg).selectAll('*').remove()

      const xExtent = d3.extent(points, (d) => d.t) as [number, number]
      const yExtent = d3.extent(points, (d) => d.f) as [number, number]
      const yPad = (yExtent[1] - yExtent[0]) * 0.1 || 0.001

      const x = d3.scaleLinear().domain(xExtent).range([0, innerW])
      const y = d3
        .scaleLinear()
        .domain([yExtent[0] - yPad, yExtent[1] + yPad])
        .range([innerH, 0])

      const root = d3
        .select(svg)
        .attr('width', width)
        .attr('height', HEIGHT)
        .append('g')
        .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

      // baseline at flux = 1.0
      const yOne = y(1.0)
      if (yOne >= 0 && yOne <= innerH) {
        root
          .append('line')
          .attr('x1', 0).attr('x2', innerW).attr('y1', yOne).attr('y2', yOne)
          .attr('stroke', '#334155').attr('stroke-dasharray', '4,4')
      }

      // event markers — a band over the event's duration + a line at t0, coloured by fate
      for (const e of curve.events) {
        const cx = x(e.t0)
        const half = x(e.t0 + e.duration / 2) - cx
        const color = eventColor(e)
        root
          .append('rect')
          .attr('x', cx - Math.max(half, 1)).attr('y', 0)
          .attr('width', Math.max(half * 2, 2)).attr('height', innerH)
          .attr('fill', color).attr('fill-opacity', 0.12)
        root
          .append('line')
          .attr('x1', cx).attr('x2', cx).attr('y1', 0).attr('y2', innerH)
          .attr('stroke', color).attr('stroke-opacity', 0.7).attr('stroke-width', 1)
      }

      // x axis
      root
        .append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).ticks(6))
        .call((g) => g.select('.domain').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('.tick line').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('text').attr('fill', '#64748b').attr('font-size', '10px'))

      // y axis
      root
        .append('g')
        .call(d3.axisLeft(y).ticks(4))
        .call((g) => g.select('.domain').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('.tick line').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('text').attr('fill', '#64748b').attr('font-size', '10px'))

      // the curve itself — a faint scatter, so gaps and dips read honestly
      root
        .append('g')
        .selectAll<SVGCircleElement, { t: number; f: number }>('circle')
        .data(points)
        .join('circle')
        .attr('cx', (d) => x(d.t))
        .attr('cy', (d) => y(d.f))
        .attr('r', 0.9)
        .attr('fill', '#7c3aed')
        .attr('fill-opacity', 0.5)
    }

    draw()
    const obs = new ResizeObserver(draw)
    obs.observe(container)
    return () => {
      obs.disconnect()
      d3.select(svg).selectAll('*').remove()
    }
  }, [curve])

  return (
    <div ref={containerRef} className="relative">
      <svg ref={svgRef} className="w-full" />
      <p className="mt-1 font-mono text-[10px] text-cosmos-subtle">
        {curve.point_count.toLocaleString()}점 표시
        {curve.original_count !== curve.point_count && (
          <> · {curve.original_count.toLocaleString()}점에서 솎음</>
        )}{' '}
        · 세로선 = 검출기가 찾은 밝기 꺼짐 (초록 후보 · 빨강 기각 · 회색 잡음)
      </p>
      {curve.events.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {curve.events.map((e, i) => (
            <li key={i} className="flex items-baseline gap-1.5 font-mono text-[10px] text-cosmos-subtle">
              <span aria-hidden style={{ color: eventColor(e) }}>
                ●
              </span>
              <span>
                밝기 꺼짐 {curve.events.length > 1 ? i + 1 : ''} {e.significance != null ? `잡음의 ${e.significance.toFixed(2)}배` : '유의성 보류'} ·{' '}
                {eventFate(e)}
                {(e.failed_checks ?? []).length > 0 && <> · {failedShort(e)}에 걸림</>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
