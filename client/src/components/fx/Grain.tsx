/** Fixed ~5% SVG noise overlay. Decorative: aria-hidden, no pointer events. */
const svg =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

export function Grain() {
  return <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[100] opacity-[0.05]" style={{ backgroundImage: svg }} />
}

