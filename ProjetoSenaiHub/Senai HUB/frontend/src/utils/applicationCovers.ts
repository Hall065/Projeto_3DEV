import coverConnect from '../assets/hub/cover-connect.png'
import coverGrid from '../assets/hub/cover-grid.png'
import coverSafe from '../assets/hub/cover-safe.png'

const covers: Record<string, string> = {
  connect: coverConnect,
  grid: coverGrid,
  safe: coverSafe,
}

export function getApplicationCover(slug: string): string {
  return covers[slug] ?? coverConnect
}
