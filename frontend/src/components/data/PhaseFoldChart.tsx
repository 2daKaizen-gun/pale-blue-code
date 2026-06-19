import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import type { PhaseFoldData } from '../../lib/api/lightcurve'

interface Props {
  data: PhaseFoldData
}

const MARGIN = { top: 20, right: 24, bottom: 52, left: 64 }
const HEIGHT = 300

export default function PhaseFoldChart({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container || data.phase.length === 0) return

    const points = data.phase
      .map((ph, i) => ({ ph, f: data.flux[i] }))
      .filter((d) => !isNaN(d.f))

    function draw() {
      const width = container!.clientWidth
      const innerW = width - MARGIN.left - MARGIN.right
      const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

      d3.select(svg).selectAll('*').remove()

      const yExtent = d3.extent(points, (d) => d.f) as [number, number]
      const yPad = (yExtent[1] - yExtent[0]) * 0.12

      const xScale = d3.scaleLinear().domain([-0.5, 0.5]).range([0, innerW])
      const yScale = d3
        .scaleLinear()
        .domain([yExtent[0] - yPad, yExtent[1] + yPad])
        .range([innerH, 0])

      const root = d3
        .select(svg)
        .attr('width', width)
        .attr('height', HEIGHT)
        .append('g')
        .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

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

      // baseline at 1.0
      const yOne = yScale(1.0)
      if (yOne >= 0 && yOne <= innerH) {
        root
          .append('line')
          .attr('x1', 0).attr('x2', innerW)
          .attr('y1', yOne).attr('y2', yOne)
          .attr('stroke', '#334155')
          .attr('stroke-dasharray', '4,4')
      }

      // x axis
      root
        .append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(xScale).ticks(5))
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
        .text('Orbital Phase')

      root
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text('Relative Brightness')

      // folded line
      const line = d3
        .line<{ ph: number; f: number }>()
        .x((d) => xScale(d.ph))
        .y((d) => yScale(d.f))
        .curve(d3.curveMonotoneX)

      root
        .append('path')
        .datum(points.sort((a, b) => a.ph - b.ph))
        .attr('fill', 'none')
        .attr('stroke', '#7c3aed')
        .attr('stroke-width', 2)
        .attr('d', line)

      // transit depth annotation
      if (data.transit_depth != null && data.transit_depth > 0) {
        const minFlux = d3.min(points, (d) => d.f)!
        const yMin = yScale(minFlux)
        const xCenter = xScale(0)
        const depthPct = (data.transit_depth * 100).toFixed(3)

        // vertical line at transit center
        root
          .append('line')
          .attr('x1', xCenter).attr('x2', xCenter)
          .attr('y1', yOne).attr('y2', yMin)
          .attr('stroke', '#f59e0b')
          .attr('stroke-dasharray', '3,3')
          .attr('stroke-width', 1.5)

        // label
        root
          .append('text')
          .attr('x', xCenter + 6)
          .attr('y', yMin - 6)
          .attr('fill', '#f59e0b')
          .attr('font-size', '11px')
          .attr('font-family', 'monospace')
          .text(`depth ${depthPct}%`)
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
      {data.transit_depth != null && (
        <p className="mt-1 font-mono text-xs text-cosmos-muted">
          Transit depth: {(data.transit_depth * 100).toFixed(3)}% · period: {data.period.toFixed(3)} days
        </p>
      )}
    </div>
  )
}
