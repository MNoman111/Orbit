/**
 * Access token lives in memory (cleared on tab close); the long-lived refresh
 * token is an httpOnly cookie the JS never touches. The active org id is
 * persisted so a reload keeps the user in the same tenant.
 */
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (t: string | null) => {
    accessToken = t;
  },
  getOrgId: () => localStorage.getItem('orbit_org'),
  setOrgId: (id: string | null) => {
    if (id) localStorage.setItem('orbit_org', id);
    else localStorage.removeItem('orbit_org');
  },
};
