import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import type { Car } from '@/api'
import { CarImage } from './CarImage'
import { StatusPill } from '@/components/ui/status-pill'
import { formatINR } from '@/lib/utils'

/**
 * Listing card: photo, name, category, price per day and the trip total.
 * Square corners, hairline border, no shadow. Image zooms slightly on hover.
 */
export function CarCard({ car, days, index = 0 }: { car: Car; days?: number; index?: number }) {
  const discount = Number(car.category.discountPercent) || 0
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: Math.min(index, 12) * 0.04 }}
      className="group relative flex flex-col border border-hairline bg-card transition-colors duration-200 hover:border-ink"
    >
      <Link to={`/fleet/${car.id}${days ? `?days=${days}` : ''}`} className="absolute inset-0 z-10" aria-label={`${car.name}, ${formatINR(car.pricePerDay)} per day`} />
      <div className="relative">
        <CarImage
          src={car.imageUrl}
          alt={car.name}
          category={car.category.name}
          grey={!car.available}
          className="aspect-[16/10] [&_img]:group-hover:scale-[1.04]"
        />
        <span className="mono-label absolute left-3 top-3 bg-card px-2 py-1">{car.category.name}</span>
        {discount > 0 && (
          <span className="mono-label absolute right-3 top-3 bg-primary px-2 py-1 text-primary-foreground">−{discount}%</span>
        )}
        {!car.available && (
          <span className="mono-label absolute inset-x-0 bottom-0 bg-ink/85 px-3 py-2 text-center text-paper">Out on the road</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="mono-label text-muted-foreground">{car.make}</p>
          <h3 className="display-condensed mt-1 text-3xl">{car.model}</h3>
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-hairline pt-4">
          <div>
            <p className="mono text-xl font-medium">{formatINR(car.pricePerDay)}<span className="text-sm text-muted-foreground"> / day</span></p>
            {days && days > 1 && (
              <p className="mono-label mt-1 text-muted-foreground">{formatINR(car.pricePerDay * days)} for {days} days</p>
            )}
          </div>
          {car.available ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-red-deep">
              Book <span aria-hidden className="transition-transform duration-200 ease-odo group-hover:translate-x-1">→</span>
            </span>
          ) : (
            <StatusPill status="out" />
          )}
        </div>
      </div>
    </motion.article>
  )
}

export function CarCardSkeleton() {
  return (
    <div className="flex flex-col border border-hairline bg-card" aria-hidden>
      <div className="skeleton aspect-[16/10]" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-7 w-40" />
        <div className="skeleton mt-6 h-5 w-28" />
      </div>
    </div>
  )
}

