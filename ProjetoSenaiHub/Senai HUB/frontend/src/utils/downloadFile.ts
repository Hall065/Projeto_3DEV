export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  downloadTextFile(filename, `\uFEFF${csv}`, 'text/csv;charset=utf-8')
}

export function printHtmlDocument(title: string, bodyHtml: string) {
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; color: #0a2540; }
  h1 { font-size: 1.25rem; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 14px; }
  th { background: #f3f4f6; }
  .muted { color: #6b7280; font-size: 12px; }
</style></head><body>${bodyHtml}</body></html>`
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!win) {
    throw new Error('Permita pop-ups para exportar em PDF.')
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}
