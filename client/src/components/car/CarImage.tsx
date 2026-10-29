import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Line silhouette per body style, used when no photo exists or it fails to load. */
function Silhouette({ category }: { category: string }) {
  const tall = /suv|muv/i.test(category)
  const body = tall
    ? 'M20 70 L28 46 Q32 38 44 36 L132 34 Q150 34 160 46 L176 58 Q190 60 192 70 L192 82 L20 82 Z'
    : 'M16 72 L34 54 Q46 42 70 40 L126 40 Q144 40 160 54 L184 62 Q194 64 194 74 L194 82 L16 82 Z'
  return (
    <svg viewBox="0 0 210 100" className="h-full w-full text-steel" aria-hidden>
      <path d={body} fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="56" cy="82" r="11" fill="var(--odo-surface-alt)" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="156" cy="82" r="11" fill="var(--odo-surface-alt)" stroke="currentColor" strokeWidth="1.25" />
      <line x1="8" y1="94" x2="202" y2="94" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 4" />
    </svg>
  )
}

export function CarImage({
  src, alt, category, className, eager, grey,
}: { src?: string; alt: string; category: string; className?: string; eager?: boolean; grey?: boolean }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  if (!src || failed) {
    return (
      <div className={cn('flex items-center justify-center bg-surface-alt p-8', className)}>
        <Silhouette category={category} />
      </div>
    )
  }
  return (
    <div className={cn('relative overflow-hidden bg-surface-alt', className)}>
      <img
        src={src}
        alt={alt}
        width={640}
        height={400}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          'h-full w-full object-cover transition-[opacity,transform,filter] duration-[800ms] ease-odo',
          loaded ? 'opacity-100' : 'opacity-0',
          grey && 'grayscale',
        )}
      />
    </div>
  )
}

