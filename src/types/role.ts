export enum Role {
  Admin = 1,
  Publisher = 2,
}

export type RoleLike = Role | number | string | null | undefined;

export function isAdmin(role: RoleLike): boolean {
  if (role === null || role === undefined) return false;
  if (typeof role === 'number') return role === Role.Admin;
  if (typeof role === 'string') {
    if (role === '1' || role.toLowerCase() === 'admin') return true;
    if (!isNaN(Number(role))) return Number(role) === Role.Admin;
    return false;
  }
  return role === Role.Admin;
}

export function isPublisher(role: RoleLike): boolean {
  if (role === null || role === undefined) return false;
  if (typeof role === 'number') return role === Role.Publisher;
  if (typeof role === 'string') {
    if (role === '2' || role.toLowerCase() === 'publisher') return true;
    if (!isNaN(Number(role))) return Number(role) === Role.Publisher;
    return false;
  }
  return role === Role.Publisher;
}

export default Role;
