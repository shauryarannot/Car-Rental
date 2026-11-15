import images from '@/data/carImages.json'

/** Photo for a vehicle name, from the local image lookup. Undefined = use silhouette. */
export function carImage(name) {
  return images[name]
}
