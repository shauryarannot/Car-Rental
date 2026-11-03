import images from '@/data/carImages.json'

const map = images as Record<string, string>

/** Photo for a vehicle name, from the local image lookup. Undefined = use silhouette. */
export function carImage(name: string): string | undefined {
  return map[name]
}
