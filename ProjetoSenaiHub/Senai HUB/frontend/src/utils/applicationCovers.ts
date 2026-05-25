import coverConnect from '../assets/hub/cover-connect.png'
import coverGrid from '../assets/hub/cover-grid.png'

const covers: Record<string, string> = {
  connect: coverConnect,
  grid: coverGrid,
}

export function getApplicationCover(slug: string): string {
  return covers[slug] ?? coverConnect
}
