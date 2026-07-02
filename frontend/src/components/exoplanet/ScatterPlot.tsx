import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import type { Planet } from '../../lib/api/exoplanet'
import { getMethodColor } from './methodColor'

interface Props {
  planets: Planet[]
  selectedPlanet: Planet | null
  onSelect: (planet: Planet | null) => void
}

type PlottablePlanet = Planet & { pl_orbper: number; pl_rade: number }

const MARGIN = { top: 20, right: 20, bottom: 50, left: 60 }
const HEIGHT = 480

export default function ScatterPlot({ planets, selectedPlanet, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const data = planets.filter(
    (p): p is PlottablePlanet =>
      p.pl_orbper !== null && p.pl_orbper > 0 && p.pl_rade !== null && p.pl_rade > 0
  )

  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container || data.length === 0) return

    function draw() {
      const width = container!.clientWidth
      const innerW = width - MARGIN.left - MARGIN.right
      const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

      d3.select(svg).selectAll('*').remove()

      const root = d3
        .select(svg)
        .attr('width', width)
        .attr('height', HEIGHT)
        .append('g')
        .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

      const xScale = d3
        .scaleLog()
        .domain([
          d3.min(data, (d) => d.pl_orbper)! * 0.8,
          d3.max(data, (d) => d.pl_orbper)! * 1.2,
        ])
        .range([0, innerW])
        .clamp(true)

      const yScale = d3
        .scaleLog()
        .domain([
          d3.min(data, (d) => d.pl_rade)! * 0.8,
          d3.max(data, (d) => d.pl_rade)! * 1.2,
        ])
        .range([innerH, 0])
        .clamp(true)

      // Grid
      root
        .append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(xScale).tickSize(-innerH).tickFormat(() => ''))
        .call((g) => g.selectAll('line').attr('stroke', '#1e293b'))
        .call((g) => g.select('.domain').remove())

      root
        .append('g')
        .call(d3.axisLeft(yScale).tickSize(-innerW).tickFormat(() => ''))
        .call((g) => g.selectAll('line').attr('stroke', '#1e293b'))
        .call((g) => g.select('.domain').remove())

      // X axis
      root
        .append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(xScale).ticks(6, ',.1r'))
        .call((g) => g.select('.domain').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('.tick line').attr('stroke', '#1e293b'))
        .call((g) =>
          g.selectAll('text').attr('fill', '#64748b').attr('font-size', '11px')
        )

      // Y axis
      root
        .append('g')
        .call(d3.axisLeft(yScale).ticks(6, ',.1r'))
        .call((g) => g.select('.domain').attr('stroke', '#1e293b'))
        .call((g) => g.selectAll('.tick line').attr('stroke', '#1e293b'))
        .call((g) =>
          g.selectAll('text').attr('fill', '#64748b').attr('font-size', '11px')
        )

      // Axis labels
      root
        .append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH + 42)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text('Orbital Period (days)')

      root
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -46)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text('Radius (R⊕)')

      const tooltip = d3.select(tooltipRef.current)

      root
        .selectAll<SVGCircleElement, PlottablePlanet>('circle')
        .data(data, (d) => d.pl_name)
        .join('circle')
        .attr('cx', (d) => xScale(d.pl_orbper))
        .attr('cy', (d) => yScale(d.pl_rade))
        .attr('r', (d) => (selectedPlanet?.pl_name === d.pl_name ? 6 : 3))
        .attr('fill', (d) => getMethodColor(d.discoverymethod))
        .attr('fill-opacity', (d) =>
          selectedPlanet && selectedPlanet.pl_name !== d.pl_name ? 0.15 : 0.7
        )
        .attr('stroke', (d) =>
          selectedPlanet?.pl_name === d.pl_name ? '#fff' : 'none'
        )
        .attr('stroke-width', 1.5)
        .attr('cursor', 'pointer')
        .on('mouseover', (_event, d) => {
          tooltip.style('opacity', '1').html(
            `<span class="text-cosmos-text font-mono text-xs">${d.pl_name}</span>` +
              `<br/><span class="text-cosmos-muted font-mono text-xs">${d.pl_orbper.toFixed(2)}d · ${d.pl_rade.toFixed(2)} R⊕</span>`
          )
        })
        .on('mousemove', (event) => {
          const rect = container!.getBoundingClientRect()
          tooltip
            .style('left', `${event.clientX - rect.left + 12}px`)
            .style('top', `${event.clientY - rect.top - 8}px`)
        })
        .on('mouseleave', () => tooltip.style('opacity', '0'))
        .on('click', (_event, d) => {
          onSelect(selectedPlanet?.pl_name === d.pl_name ? null : d)
        })
    }

    draw()

    const obs = new ResizeObserver(draw)
    obs.observe(container)

    return () => {
      obs.disconnect()
      d3.select(svg).selectAll('*').remove()
    }
  }, [data, selectedPlanet, onSelect])

  return (
    <div className="relative" ref={containerRef}>
      <svg ref={svgRef} className="w-full" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-10 rounded border border-cosmos-border bg-cosmos-elevated px-2 py-1.5 opacity-0 transition-opacity"
        style={{ top: 0, left: 0 }}
      />
      <p className="mt-1 font-mono text-xs text-cosmos-muted">
        {data.length.toLocaleString()} planets plotted · click a dot to select
      </p>
    </div>
  )
}
