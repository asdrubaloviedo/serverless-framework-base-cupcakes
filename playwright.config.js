
const { defineConfig } = require('@playwright/test');
const { baseURL } = require('./playwright-api/config/environments');

module.exports = defineConfig({
  testDir: './playwright-api',
  testMatch: '**/*.api.spec.js',

  timeout: 30000,
  retries: 0,
  workers: 6,
  fullyParallel: true,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
});
