export function canAccessHubArchive(
  isAdmin: boolean,
  canAny: (...permissions: string[]) => boolean,
): boolean {
  return (
    isAdmin ||
    canAny('connect.classes.view', 'connect.classes.manage') ||
    canAny('grid.tickets.view', 'grid.tickets.manage') ||
    canAny('safe.access', 'safe.authorizations.manage', 'safe.approve', 'safe.portaria')
  )
}
