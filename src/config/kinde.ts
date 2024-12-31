export const KINDE_CONFIG = {
  domain: 'https://micdrop.kinde.com',
  clientId: '670e40f3a9c34ff682fca53099b5d84d',
  redirectUri: `${window.location.origin}/callback`,
  logoutUri: window.location.origin,
  scope: 'openid profile email',
  isDangerouslyUseLocalStorage: true
} as const; 