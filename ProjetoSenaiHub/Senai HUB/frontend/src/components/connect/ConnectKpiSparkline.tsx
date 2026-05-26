import { useId, useMemo } from 'react'

interface ConnectKpiSparklineProps {
  data: number[]
  className?: string
  height?: number
}

function buildSparklinePath(values: number[], width: number, height: number): string {
  if (values.length === 0) return ''
  if (values.length === 1) {
    const y = height / 2
    return `M 0 ${y} L ${width} ${y}`
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const padY = 4
  const innerH = height - padY * 2
  const step = width / (values.length - 1)

  const coords = values.map((v, i) => {
    const x = i * step
    const y = padY + innerH - ((v - min) / range) * innerH
    return [x, y] as const
  })

  return coords.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ')
}

export function ConnectKpiSparkline({ data, className = '', height = 52 }: ConnectKpiSparklineProps) {
  const filterId = useId().replace(/:/g, '')
  const width = 280
  const safeData = data.length >= 2 ? data : data.length === 1 ? [data[0], data[0]] : [0, 0]
  const path = useMemo(() => buildSparklinePath(safeData, width, height), [safeData, height])

  const gridLines = useMemo(() => {
    const count = 7
    return Array.from({ length: count }, (_, i) => ((i + 1) / (count + 1)) * width)
  }, [])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <filter id={`${filterId}-shadow`} x="-10%" y="-20%" width="120%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>
      {gridLines.map((x) => (
        <line key={x} x1={x} x2={x} y1={0} y2={height} stroke="white" strokeOpacity={0.12} strokeWidth={1} />
      ))}
      <path
        d={path}
        fill="none"
        stroke="white"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${filterId}-shadow)`}
        className="origin-bottom scale-y-100 transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  )
}
