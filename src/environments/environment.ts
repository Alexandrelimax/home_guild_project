export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000',
  authTokenKey: 'gf_token',
  game: {
    xpPerLevel: 1000,
    maxLevel: 15,
    totalBadgeCount: 24,
    milestoneLevels: { gold: 15, silver: 10 },
    eventLogMaxSize: 20,
  },
  ui: {
    successMessageTimeoutMs: 4000,
    defaultAvatarUrl: 'https://img.icons8.com/nolan/1200/adventure.png',
    avatarOptions: [
      'https://img.icons8.com/nolan/1200/adventure.png',
      'https://img.icons8.com/nolan/1200/student-male.png',
      'https://img.icons8.com/nolan/1200/wizard.png',
      'https://img.icons8.com/nolan/1200/ninja.png',
      'https://img.icons8.com/nolan/1200/knight.png',
    ],
    appVersion: '1.0.3',
  },
};
