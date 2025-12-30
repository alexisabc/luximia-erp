const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
})

// Add any custom config to be passed to Jest
const config = {
    coverageProvider: 'v8',
    testEnvironment: 'jsdom',

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Module paths
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    // Test match patterns
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'services/**/*.{js,jsx,ts,tsx}',
        'hooks/**/*.{js,jsx,ts,tsx}',
        'utils/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
        '!**/coverage/**',
    ],

    // Coverage thresholds (start low, increase over time)
    coverageThreshold: {
        global: {
            branches: 30,
            functions: 30,
            lines: 30,
            statements: 30,
        },
    },

    // Transform files
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest', {
            jsc: {
                transform: {
                    react: {
                        runtime: 'automatic',
                    },
                },
            },
        }],
    },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config)
