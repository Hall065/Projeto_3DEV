/** Confirmação simples para ações destrutivas (excluir). */
export function confirmDelete(entityLabel: string): boolean {
  return window.confirm(`Tem certeza que deseja excluir ${entityLabel}? Esta ação não pode ser desfeita.`)
}
