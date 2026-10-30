import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import type { Car } from '@/api'
import { CarImage } from './CarImage'
import { StatusPill } from '@/components/ui/status-pill'
import { formatINR } from '@/lib/utils'

/**
 * Listing card: photo, name, category, price per day and the trip total.
 * Fixed internal row heights so every card in a grid has the exact same length.
 */
export function CarCard({ car, days, index = 0 }: { car: Car; days?: number; index?: number }) {
  const discount = Number(car.category.discountPercent) || 0
  const tripDays = days && days > 1 ? days : 1

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: Math.min(index % 3, 2) * 0.06 }}
      className="group relative flex h-full flex-col border border-hairline bg-card transition-colors duration-200 hover:border-ink"
    >
      <Link
        to={`/fleet/${car.id}${tripDays > 1 ? `?days=${tripDays}` : ''}`}
        className="absolute inset-0 z-10"
        aria-label={`${car.name}, ${formatINR(car.pricePerDay)} per day`}
      />
      <div className="relative w-full shrink-0">
        <CarImage
          src={car.imageUrl}
          alt={car.name}
          category={car.category.name}
          grey={!car.available}
          className="aspect-[16/10] w-full [&_img]:group-hover:scale-[1.04]"
        />
        <span className="mono-label absolute left-3 top-3 bg-card px-2 py-1 text-ink">{car.category.name}</span>
        {discount > 0 && (
          <span className="mono-label absolute right-3 top-3 bg-primary px-2 py-1 text-primary-foreground">−{discount}%</span>
        )}
        {!car.available && (
          <span className="mono-label absolute inset-x-0 bottom-0 bg-ink/85 px-3 py-2 text-center text-paper">Out on the road</span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="min-h-[4.25rem]">
          <p className="mono-label truncate text-muted-foreground">{car.make}</p>
          <h3 className="display-condensed mt-1 truncate text-3xl leading-tight" title={car.model}>
            {car.model}
          </h3>
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-hairline pt-4">
          <div>
            <p className="mono text-xl font-medium">
              {formatINR(car.pricePerDay)}
              <span className="text-sm text-muted-foreground"> / day</span>
            </p>
            <p className="mono-label mt-1 text-muted-foreground">
              {tripDays > 1 ? `${formatINR(car.pricePerDay * tripDays)} for ${tripDays} days` : 'Unlimited km · taxes incl.'}
            </p>
          </div>
          {car.available ? (
            <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-red-deep">
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
    <div className="flex h-full flex-col border border-hairline bg-card" aria-hidden>
      <div className="skeleton aspect-[16/10] w-full shrink-0" />
      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="min-h-[4.25rem] space-y-2">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-8 w-40" />
        </div>
        <div className="border-t border-hairline pt-4">
          <div className="skeleton h-6 w-28" />
          <div className="skeleton mt-2 h-3 w-36" />
        </div>
      </div>
    </div>
  )
}
