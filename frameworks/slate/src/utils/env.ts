// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Get the hosting environment, default to development
const NODE_ENV: string = process.env.NODE_ENV || 'development';

const env = {
    NODE_ENV, // The hosting environment

    // Retrieve environment variable or use default value
    get: (key: string, defaultValue?: string): string => process.env[key] || defaultValue || '',

    isDevelopment: NODE_ENV === 'development',   // Check if the environment is development
    isProduction: NODE_ENV === 'production',     // Check if the environment is production
    isTest: NODE_ENV === 'test'                  // Check if the environment is test
};

export default env;
