import images from '@/data/carImages.json'

const map = images as Record<string, { src: string; page?: string }>

/** Photo for a vehicle name, from the generated Wikipedia lookup. Undefined = use silhouette. */
export function carImage(name: string): string | undefined {
  return map[name]?.src
}

