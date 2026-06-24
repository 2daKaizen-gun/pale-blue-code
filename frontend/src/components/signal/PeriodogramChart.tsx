import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import type { BLSData } from '../../lib/api/bls'

interface Props {
  data: BLSData
}

const MARGIN = { top: 20, right: 32, bottom: 52, left: 64 }
const HEIGHT = 340

export default function PeriodogramChart({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container || data.periods.length === 0) return

    const points = data.periods.map((p, i) => ({ p, w: data.powers[i] }))
    const bestPeriod = data.best.period
    const maxPower = d3.max(points, (d) => d.w) ?? 1

    function draw() {
      const width = container!.clientWidth
      const innerW = width - MARGIN.left - MARGIN.right
      const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

      d3.select(svg).selectAll('*').remove()

      const xScale = d3.scaleLog().domain([1, 500]).range([0, innerW])
      const yScale = d3.scaleLinear().domain([0, maxPower * 1.1]).range([innerH, 0])

      const root = d3
        .select(svg)
        .attr('width', width)
        .attr('height', HEIGHT)
        .append('g')
        .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

      // clip path
      root
        .append('defs')
        .append('clipPath')
        .attr('id', 'pg-clip')
        .append('rect')
        .attr('width', innerW)
        .attr('height', innerH)

      // grid
      root
        .append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(xScale).tickSize(-innerH).tickFormat(() => ''))
        .call((g) => g.selectAll('line').attr('stroke', '#1e293b').attr('stroke-dasharray', '2,3'))
        .call((g) => g.select('.domain').remove())

      root
        .append('g')
        .call(d3.axisLeft(yScale).tickSize(-innerW).tickFormat(() => ''))
        .call((g) => g.selectAll('line').attr('stroke', '#1e293b').attr('stroke-dasharray', '2,3'))
        .call((g) => g.select('.domain').remove())

      // x axis (log ticks: 1, 2, 5, 10, 20, 50, 100, 200, 500)
      root
        .append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(
          d3
            .axisBottom(xScale)
            .tickValues([1, 2, 5, 10, 20, 50, 100, 200, 500])
            .tickFormat((d) => `${d}`),
        )
        .call((g) => g.select('.domain').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('.tick line').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('text').attr('fill', '#64748b').attr('font-size', '11px'))

      // y axis
      root
        .append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .call((g) => g.select('.domain').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('.tick line').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('text').attr('fill', '#64748b').attr('font-size', '11px'))

      // axis labels
      root
        .append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH + 42)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text('Period (days)')

      root
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text('BLS Power')

      // periodogram line
      const line = d3
        .line<{ p: number; w: number }>()
        .x((d) => xScale(d.p))
        .y((d) => yScale(d.w))
        .defined((d) => d.p >= 1 && d.p <= 500)

      const chartGroup = root.append('g').attr('clip-path', 'url(#pg-clip)')

      chartGroup
        .append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', '#7c3aed')
        .attr('stroke-width', 1.2)
        .attr('d', line)

      // peak marker
      const xPeak = xScale(bestPeriod)
      if (xPeak >= 0 && xPeak <= innerW) {
        chartGroup
          .append('line')
          .attr('x1', xPeak).attr('x2', xPeak)
          .attr('y1', 0).attr('y2', innerH)
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,3')

        root
          .append('text')
          .attr('x', Math.min(xPeak + 6, innerW - 90))
          .attr('y', 14)
          .attr('fill', '#f59e0b')
          .attr('font-size', '11px')
          .attr('font-family', 'monospace')
          .text(`peak ${bestPeriod.toFixed(2)} days`)
      }
    }

    draw()
    const obs = new ResizeObserver(draw)
    obs.observe(container)
    return () => {
      obs.disconnect()
      d3.select(svg).selectAll('*').remove()
    }
  }, [data])

  return (
    <div ref={containerRef} className="relative">
      <svg ref={svgRef} className="w-full" />
      <p className="mt-1 font-mono text-xs text-cosmos-muted">
        {data.periods.length.toLocaleString()} period grid points · log scale · peak at{' '}
        {data.best.period.toFixed(3)} days
      </p>
    </div>
  )
}
