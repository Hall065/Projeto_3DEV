function escapeCsvCell(value: unknown): string {
  const text = value == null ? '' : String(value)
  if (/[;"\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): void {
  const lines = [headers.map(escapeCsvCell).join(';'), ...rows.map((row) => row.map(escapeCsvCell).join(';'))]
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
