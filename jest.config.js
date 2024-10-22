// file: jest.config.js

/** @type {import('jest').Config} */
const config = {
    verbose: true,
    testEnvironment: 'node',
    transform: {},
    moduleDirectories: ['node_modules', 'src'],
    transformIgnorePatterns: [
        '/node_modules/(?!(node-fetch|formdata-node|fetch-blob|data-uri-to-buffer|formdata-polyfill|web-streams-polyfill)/)'
    ],
    testMatch: [
        "**/__tests__/**/*.js",
        "**/?(*.)+(spec|test).js"
    ]
};

module.exports = config;