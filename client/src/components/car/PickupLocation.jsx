import { BRANCH, BRANCH_DIRECTIONS, BRANCH_MAP_EMBED } from '@/lib/location'

export function PickupLocation() {
  return (
    <div className="ticks grid border border-hairline bg-card md:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col justify-between gap-6 p-5 sm:p-8">
        <div>
          <p className="mono-label text-red-deep">Pick-up & drop-off</p>
          <p className="mt-3 text-2xl font-semibold sm:text-3xl">{BRANCH.name}</p>
          <p className="mt-1 text-muted-foreground">{BRANCH.address}</p>
          <p className="mono-label mt-4 text-muted-foreground">{BRANCH.hours}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Collect your car here and bring it back to the same spot when your trip ends.
        </p>
        <a
          href={BRANCH_DIRECTIONS}
          target="_blank"
          rel="noreferrer"
          className="mono-label text-red-deep underline-offset-4 hover:underline"
        >
          Get directions →
        </a>
      </div>
      <iframe
        title={`Map of ${BRANCH.address}`}
        src={BRANCH_MAP_EMBED}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-64 w-full border-t border-hairline sm:h-80 md:h-full md:min-h-80 md:border-l md:border-t-0"
      />
    </div>
  )
}
