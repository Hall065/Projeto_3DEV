import { useCallback, useEffect, useRef, useState } from 'react'

const SCROLL_SPEED = 0.55
const DRAG_THRESHOLD_PX = 4

type HorizontalAutoCarouselProps = {
  children: React.ReactNode
  className?: string
  loop?: boolean
  speed?: number
}

export function HorizontalAutoCarousel({
  children,
  className = '',
  loop = true,
  speed = SCROLL_SPEED,
}: HorizontalAutoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const isHoveredRef = useRef(false)
  const isDraggingRef = useRef(false)
  const pointerActiveRef = useRef(false)
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const syncLoopBoundary = useCallback(() => {
    const el = scrollRef.current
    if (!el || !loop) return

    const half = el.scrollWidth / 2
    if (half <= el.clientWidth) return

    if (el.scrollLeft >= half) {
      el.scrollLeft -= half
    } else if (el.scrollLeft < 0) {
      el.scrollLeft += half
    }
  }, [loop])

  const tick = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    const paused = isHoveredRef.current || isDraggingRef.current
    if (!paused) {
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll > 0) {
        if (loop) {
          const half = el.scrollWidth / 2
          if (half > el.clientWidth) {
            el.scrollLeft += speed
            if (el.scrollLeft >= half) {
              el.scrollLeft -= half
            }
          } else {
            el.scrollLeft = el.scrollLeft >= maxScroll ? 0 : el.scrollLeft + speed
          }
        } else {
          el.scrollLeft = el.scrollLeft >= maxScroll ? 0 : el.scrollLeft + speed
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [loop, speed])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [tick])

  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    Boolean(target.closest('button, a, input, textarea, select, [role="menu"], [data-no-carousel-drag]'))

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || isInteractiveTarget(e.target)) return
    const el = scrollRef.current
    if (!el) return

    pointerActiveRef.current = true
    dragStartRef.current = { x: e.clientX, scrollLeft: el.scrollLeft }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current) return
    const el = scrollRef.current
    if (!el) return

    const delta = e.clientX - dragStartRef.current.x
    if (!isDraggingRef.current && Math.abs(delta) < DRAG_THRESHOLD_PX) return

    if (!isDraggingRef.current) {
      isDraggingRef.current = true
      setIsDragging(true)
      el.setPointerCapture(e.pointerId)
    }

    e.preventDefault()
    el.scrollLeft = dragStartRef.current.scrollLeft - delta
    syncLoopBoundary()
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerActiveRef.current = false
    const el = scrollRef.current
    if (isDraggingRef.current && el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }
    isDraggingRef.current = false
    setIsDragging(false)
    syncLoopBoundary()
  }

  return (
    <div
      ref={scrollRef}
      className={`carousel-scroll-hidden touch-pan-x select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      onMouseEnter={() => {
        isHoveredRef.current = true
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false
        pointerActiveRef.current = false
        isDraggingRef.current = false
        setIsDragging(false)
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      aria-roledescription="carrossel"
    >
      <div className="inline-block w-max">{children}</div>
    </div>
  )
}
