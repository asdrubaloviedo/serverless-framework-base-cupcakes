// jest.config.js
module.exports = {
  verbose: true,
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@environment/(.*)$': '<rootDir>/environment/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@category/(.*)$': '<rootDir>/src/category/$1',
    '^@cupcake/(.*)$': '<rootDir>/src/cupcake/$1',
    '^@festivity/(.*)$': '<rootDir>/src/festivity/$1',
    '^@ingredient/(.*)$': '<rootDir>/src/ingredient/$1',
    '^@package/(.*)$': '<rootDir>/src/package/$1',
    '^@recipe/(.*)$': '<rootDir>/src/recipe/$1',
    '^@user/(.*)$': '<rootDir>/src/user/$1',
    '^@db$': '<rootDir>/db',
    '^@db/(.*)$': '<rootDir>/db/$1'
  },
  setupFiles: ['<rootDir>/test/setup-db-mock.js'],
  collectCoverage: true,
  // Llimita la cobertura a estas carpetas
  collectCoverageFrom: [
    'src/category/**/*.js',
    'src/category/handlers/helloWord.js',
    'src/festivity/**/*.js',
    'src/ingredient/**/*.js'
  ],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: { statements: 95, branches: 90, functions: 95, lines: 95 }
  }
};
