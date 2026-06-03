/** Fallbacks locais (espelham config/inventory_images.php) quando a API ainda não persistiu URL */

const LEGACY_BROKEN_FRAGMENTS = [
  'Crystal_Project_mouse.png',
  'Incandescent_light_bulb.png',
  '/8/8d/Air_filter.jpg',
  '/9/9f/HDMI_connector.jpg',
  'Silicone-glue.jpg',
  'OOjs_UI_icon_package.svg',
  '/7/7f/Keyboard.png',
  'Ethernet_cable.jpg',
  'Screw_head.jpg',
  'Paint_roller.jpg',
  'AC_power_plugs_and_sockets.jpg',
  'Miniature_circuit_breaker.jpg',
  'Fan_rotating.gif',
  'PVC_pipe.jpg',
  'Ball_valve.jpg',
]

const CATEGORY_FALLBACKS: Record<string, string> = {
  Informática:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg/330px-2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg',
  Elétrica:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg/330px-Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg',
  Climatização:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/2014_Filtr_powietrza_DEMCiflex.jpg/330px-2014_Filtr_powietrza_DEMCiflex.jpg',
  Hidráulica:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg/330px-Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg',
}

const KEYWORD_FALLBACKS: [string, string][] = [
  [
    'mouse',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg/330px-2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg',
  ],
  [
    'lampada',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg/330px-Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg',
  ],
  [
    'lâmpada',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg/330px-Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg',
  ],
  [
    'filtro',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/2014_Filtr_powietrza_DEMCiflex.jpg/330px-2014_Filtr_powietrza_DEMCiflex.jpg',
  ],
  [
    'hdmi',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/HDMI_Cable_1.JPG/330px-HDMI_Cable_1.JPG',
  ],
  [
    'selante',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg/330px-Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg',
  ],
]

const DEFAULT =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Gnome-emblem-package.svg/330px-Gnome-emblem-package.svg.png'

export function isLegacyBrokenInventoryImageUrl(url?: string | null): boolean {
  if (!url?.trim()) return false

  const lower = url.toLowerCase()
  if (LEGACY_BROKEN_FRAGMENTS.some((fragment) => lower.includes(fragment.toLowerCase()))) {
    return true
  }

  return lower.includes('upload.wikimedia.org/wikipedia/commons/') && !lower.includes('/thumb/')
}

export function resolveInventoryImageFallback(title: string, category?: string): string {
  if (category && CATEGORY_FALLBACKS[category]) {
    return CATEGORY_FALLBACKS[category]
  }

  const lower = title.toLowerCase()
  for (const [key, url] of KEYWORD_FALLBACKS) {
    if (lower.includes(key)) {
      return url
    }
  }

  return DEFAULT
}

export function normalizeInventoryImageUrl(url?: string | null): string | null {
  if (!url?.trim()) return null

  if (url.includes('/512px-')) {
    return url.replace('/512px-', '/330px-')
  }

  if (isLegacyBrokenInventoryImageUrl(url)) {
    return null
  }

  return url
}

export function inventoryDisplayImageUrl(title: string, imageUrl?: string | null, category?: string): string {
  const normalized = normalizeInventoryImageUrl(imageUrl)
  if (normalized) {
    return normalized
  }

  return resolveInventoryImageFallback(title, category)
}
