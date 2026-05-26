export type WallpaperId =
  | 'senai-classic'
  | 'senai-dawn'
  | 'senai-cool'
  | 'senai-warm'
  | 'senai-minimal'

export interface WallpaperPreset {
  id: WallpaperId
  name: string
  description: string
  baseColor: string
  /** Gradientes radiais em camadas (mesh) */
  mesh: string
  blobs: string[]
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'senai-classic',
    name: 'Clássico SENAI',
    description: 'Neutro com orbes navy, vermelho e azul suave.',
    baseColor: '#e8edf4',
    mesh: `
      radial-gradient(ellipse 90% 70% at 8% 15%, rgba(2, 26, 58, 0.22), transparent 55%),
      radial-gradient(ellipse 75% 60% at 92% 8%, rgba(227, 6, 19, 0.2), transparent 50%),
      radial-gradient(ellipse 65% 55% at 55% 95%, rgba(91, 141, 239, 0.28), transparent 52%),
      radial-gradient(ellipse 50% 45% at 30% 55%, rgba(168, 197, 255, 0.2), transparent 48%)
    `,
    blobs: [
      'absolute -left-32 -top-20 h-[32rem] w-[32rem] rounded-full bg-[#021a3a]/28 blur-[90px]',
      'absolute -right-24 top-[12%] h-[34rem] w-[34rem] rounded-full bg-[#e30613]/22 blur-[100px]',
      'absolute bottom-[-8rem] left-[20%] h-[28rem] w-[28rem] rounded-full bg-[#7ba3f0]/30 blur-[85px]',
    ],
  },
  {
    id: 'senai-dawn',
    name: 'Amanhecer',
    description: 'Pêssego e azul claro — estilo vidro da referência.',
    baseColor: '#f2e6df',
    mesh: `
      radial-gradient(ellipse 85% 65% at 5% 20%, rgba(255, 178, 150, 0.55), transparent 55%),
      radial-gradient(ellipse 80% 60% at 95% 5%, rgba(168, 197, 255, 0.5), transparent 52%),
      radial-gradient(ellipse 70% 50% at 70% 85%, rgba(227, 6, 19, 0.12), transparent 50%),
      radial-gradient(ellipse 55% 45% at 40% 45%, rgba(255, 220, 200, 0.35), transparent 48%)
    `,
    blobs: [
      'absolute -left-20 top-0 h-[36rem] w-[36rem] rounded-full bg-[#ffb4a2]/45 blur-[95px]',
      'absolute right-[-6rem] top-[-4rem] h-[38rem] w-[38rem] rounded-full bg-[#a8c5ff]/42 blur-[100px]',
      'absolute bottom-[-6rem] left-[25%] h-96 w-96 rounded-full bg-[#e8b4ff]/25 blur-[80px]',
      'absolute top-[45%] right-[28%] h-72 w-72 rounded-full bg-[#021a3a]/12 blur-[70px]',
    ],
  },
  {
    id: 'senai-cool',
    name: 'Industrial',
    description: 'Azuis e cinzas com destaque técnico.',
    baseColor: '#dce6f2',
    mesh: `
      radial-gradient(ellipse 90% 70% at 0% 0%, rgba(2, 26, 58, 0.35), transparent 55%),
      radial-gradient(ellipse 75% 65% at 100% 30%, rgba(74, 124, 201, 0.4), transparent 52%),
      radial-gradient(ellipse 60% 50% at 45% 100%, rgba(168, 197, 255, 0.32), transparent 50%)
    `,
    blobs: [
      'absolute left-[-8rem] top-[-6rem] h-[36rem] w-[36rem] rounded-full bg-[#021a3a]/32 blur-[95px]',
      'absolute right-[-5rem] bottom-[-4rem] h-[30rem] w-[30rem] rounded-full bg-[#4a7cc9]/38 blur-[90px]',
      'absolute top-[40%] left-[45%] h-80 w-80 rounded-full bg-[#a8c5ff]/28 blur-[75px]',
    ],
  },
  {
    id: 'senai-warm',
    name: 'Energia',
    description: 'Vermelho SENAI, âmbar e navy suave.',
    baseColor: '#f5ebe6',
    mesh: `
      radial-gradient(ellipse 80% 65% at 90% 10%, rgba(227, 6, 19, 0.38), transparent 52%),
      radial-gradient(ellipse 70% 55% at 10% 80%, rgba(245, 158, 11, 0.35), transparent 50%),
      radial-gradient(ellipse 65% 50% at 35% 25%, rgba(2, 26, 58, 0.18), transparent 48%)
    `,
    blobs: [
      'absolute -right-16 -top-16 h-[34rem] w-[34rem] rounded-full bg-[#e30613]/35 blur-[95px]',
      'absolute left-[-4rem] bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#f59e0b]/32 blur-[85px]',
      'absolute top-1/2 left-[30%] h-80 w-80 rounded-full bg-[#ffb4a2]/28 blur-[80px]',
    ],
  },
  {
    id: 'senai-minimal',
    name: 'Minimal',
    description: 'Mais suave, ainda com cor perceptível.',
    baseColor: '#eef1f5',
    mesh: `
      radial-gradient(ellipse 70% 55% at 85% 15%, rgba(168, 197, 255, 0.28), transparent 50%),
      radial-gradient(ellipse 65% 50% at 15% 75%, rgba(227, 6, 19, 0.14), transparent 48%)
    `,
    blobs: [
      'absolute right-0 top-0 h-96 w-96 rounded-full bg-[#021a3a]/18 blur-[80px]',
      'absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#e30613]/14 blur-[75px]',
    ],
  },
]

export const DEFAULT_WALLPAPER_ID: WallpaperId = 'senai-dawn'

export function getWallpaperPreset(id: string): WallpaperPreset {
  return WALLPAPER_PRESETS.find((p) => p.id === id) ?? WALLPAPER_PRESETS[0]
}
