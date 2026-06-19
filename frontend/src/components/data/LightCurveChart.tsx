import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import type { LightCurveData } from '../../lib/api/lightcurve'

interface Props {
  data: LightCurveData
}

const MARGIN = { top: 20, right: 24, bottom: 52, left: 64 }
const HEIGHT = 340

export default function LightCurveChart({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container || data.time.length === 0) return

    const points = data.time.map((t, i) => ({ t, f: data.flux[i] }))

    function draw() {
      const width = container!.clientWidth
      const innerW = width - MARGIN.left - MARGIN.right
      const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

      d3.select(svg).selectAll('*').remove()

      const xExtent = d3.extent(points, (d) => d.t) as [number, number]
      const yExtent = d3.extent(points, (d) => d.f) as [number, number]
      const yPad = (yExtent[1] - yExtent[0]) * 0.1

      const xScale = d3.scaleLinear().domain(xExtent).range([0, innerW])
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

      // clip path
      root
        .append('defs')
        .append('clipPath')
        .attr('id', 'lc-clip')
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

      // baseline at flux = 1.0
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
        .call(d3.axisBottom(xScale).ticks(6))
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
        .text(`Time (${data.mission === 'TESS' ? 'BTJD' : 'BKJD'} days)`)

      root
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text('Relative Brightness')

      // scatter plot (faster than line for 5k points with dips)
      const chartGroup = root.append('g').attr('clip-path', 'url(#lc-clip)')

      chartGroup
        .selectAll<SVGCircleElement, { t: number; f: number }>('circle')
        .data(points)
        .join('circle')
        .attr('cx', (d) => xScale(d.t))
        .attr('cy', (d) => yScale(d.f))
        .attr('r', 1.2)
        .attr('fill', '#7c3aed')
        .attr('fill-opacity', 0.55)

      // zoom + pan
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 40])
        .translateExtent([[0, 0], [innerW, innerH]])
        .extent([[0, 0], [innerW, innerH]])
        .on('zoom', (event) => {
          const zx = event.transform.rescaleX(xScale)
          chartGroup
            .selectAll<SVGCircleElement, { t: number; f: number }>('circle')
            .attr('cx', (d) => zx(d.t))
        })

      d3.select(svg!).call(zoom)
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
        {data.point_count.toLocaleString()} points shown
        {data.original_count !== data.point_count && (
          <> · decimated from {data.original_count.toLocaleString()}</>
        )}{' '}
        · scroll to zoom · drag to pan
      </p>
    </div>
  )
}
