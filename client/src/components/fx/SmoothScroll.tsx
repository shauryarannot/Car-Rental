import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import Lenis from 'lenis'

/**
 * Smooth inertia scrolling (Lenis) + a subtle right-edge instrument gauge
 * that replaces the native browser scrollbar.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [scrolling, setScrolling] = useState(false)
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.25 })
  const thumbTop = useTransform(smooth, [0, 1], ['0%', '88%'])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.95,
    })
    let timer: ReturnType<typeof setTimeout> | undefined
    lenis.on('scroll', () => {
      setScrolling(true)
      clearTimeout(timer)
      timer = setTimeout(() => setScrolling(false), 700)
    })
    let raf = requestAnimationFrame(function tick(t) {
      lenis.raf(t)
      raf = requestAnimationFrame(tick)
    })
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      {children}
      {/* Subtle instrument scroll indicator on the right edge (replaces native scrollbar) */}
      <div
        aria-hidden
        className="no-print pointer-events-none fixed bottom-6 right-1.5 top-20 z-40 hidden w-1 transition-opacity duration-500 sm:block"
        style={{ opacity: scrolling ? 0.85 : 0.2 }}
      >
        <div className="relative h-full w-px bg-hairline">
          <motion.span
            style={{ top: thumbTop }}
            className="absolute -left-[1.5px] block h-10 w-1 bg-signal"
          />
        </div>
      </div>
    </>
  )
}
