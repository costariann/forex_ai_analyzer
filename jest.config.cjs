// jest.config.cjs
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest', // Use Babel to transform ESM to CommonJS
  },
  moduleFileExtensions: ['js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!(node-fetch)/)', // Transform node-fetch
  ],
};
