module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    testPathIgnorePatterns: ['/node_modules/', 'app.spec.js'],
    collectCoverageFrom: ['js/**/*.js', '!js/lang/**'],
    coverageDirectory: 'coverage',
    verbose: true
};
