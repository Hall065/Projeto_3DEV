import { useId, useMemo } from 'react'

interface ConnectKpiSparklineProps {
  data: number[]
  className?: string
  height?: number
}

function buildSparklinePaths(
  values: number[],
  width: number,
  height: number,
): { line: string; area: string } {
  if (values.length === 0) {
    return { line: '', area: '' }
  }

  const padY = 6
  const innerH = height - padY * 2
  const step = values.length <= 1 ? width : width / (values.length - 1)

  const min = Math.min(...values)
  const max = Math.max(...values)
  let scaleMin = min
  let scaleMax = max
  if (min === max) {
    const pad = Math.max(1, Math.abs(max) * 0.25)
    scaleMin = min - pad
    scaleMax = max + pad
  }
  const scaleRange = scaleMax - scaleMin || 1
  const coords = values.map((v, i) => {
    const x = i * step
    const y = padY + innerH - ((v - scaleMin) / scaleRange) * innerH
    return [x, y] as const
  })

  const line = coords.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ')
  const last = coords[coords.length - 1]
  const area = `${line} L ${last[0]} ${height} L 0 ${height} Z`

  return { line, area }
}

const strokeProps = {
  fill: 'none' as const,
  stroke: '#ffffff',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  vectorEffect: 'non-scaling-stroke' as const,
}

export function ConnectKpiSparkline({ data, className = '', height = 52 }: ConnectKpiSparklineProps) {
  const gradientId = useId().replace(/:/g, '')
  const width = 280
  const safeData = useMemo(() => {
    if (data.length >= 2) return data
    if (data.length === 1) return [data[0], data[0]]
    return [0, 0]
  }, [data])

  const { line, area } = useMemo(
    () => buildSparklinePaths(safeData, width, height),
    [safeData, height],
  )

  const gridLines = useMemo(() => {
    const count = 7
    return Array.from({ length: count }, (_, i) => ((i + 1) / (count + 1)) * width)
  }, [])

  if (!line) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`w-full ${className}`}
        preserveAspectRatio="none"
        aria-hidden
      />
    )
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.04} />
        </linearGradient>
      </defs>
      {gridLines.map((x) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1={0}
          y2={height}
          stroke="#ffffff"
          strokeOpacity={0.12}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path d={area} fill={`url(#${gradientId}-fill)`} />
      {/* Halo suave (sem feDropShadow — em stroke-only o filtro SVG some com a linha) */}
      <path d={line} {...strokeProps} strokeOpacity={0.35} strokeWidth={5} />
      <path d={line} {...strokeProps} strokeWidth={2.5} />
    </svg>
  )
}
