import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Counter } from '@/components/fx/Counter'

export default function NotFound() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-24">
      <p className="serif-italic text-5xl">Wrong turn.</p>
      <Counter value={404} className="display-xl block text-[clamp(6rem,28vw,24rem)] leading-none" />
      <Button asChild variant="secondary" className="mt-8"><Link to="/">Back to the lot</Link></Button>
    </section>
  )
}

