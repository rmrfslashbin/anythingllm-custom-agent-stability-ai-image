// file: jest.config.js

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('jest').Config} */
const config = {
    verbose: true,
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]sx?$': 'babel-jest'
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(node-fetch|formdata-node|fetch-blob|data-uri-to-buffer|formdata-polyfill|web-streams-polyfill)/)'
    ],
    moduleDirectories: ['node_modules', 'src'],
    setupFilesAfterEnv: [
        fileURLToPath(new URL('jest.setup.js', import.meta.url))
    ]
};

export default config;