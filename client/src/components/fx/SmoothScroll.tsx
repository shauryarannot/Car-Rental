import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.1 })
    let raf = requestAnimationFrame(function tick(t) {
      lenis.raf(t)
      raf = requestAnimationFrame(tick)
    })
    return () => { cancelAnimationFrame(raf); lenis.destroy() }
  }, [])
  return <>{children}</>
}

