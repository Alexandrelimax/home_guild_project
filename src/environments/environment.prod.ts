export const environment = {
  production: true,
  // TODO: substituir pela URL real antes do deploy em produção
  apiBaseUrl: 'https://api.seudominio.com',
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
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTf4aIfEE0iDs9Qm4qsRBFKBTALtCWh6m3LCA&s',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSujBhxt6_yZiOO_stoUBev3Xa5NfyK3iQ9Dw&s',
    ],
    appVersion: '1.0.3',
  },
};
