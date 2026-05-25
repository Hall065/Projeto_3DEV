export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(typeof date === 'string' ? new Date(date) : date)
}
