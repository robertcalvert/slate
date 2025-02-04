import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,             // Recommended for JavaScript
    tseslint.configs.recommended,           // Recommended for TypeScript
    {
        rules: {
            'semi': ['warn', 'always'],     // Warn if semi-colons are missing
            'quotes': ['warn', 'single'],   // Enforces consistent quote style
            'eqeqeq': ['warn', 'always'],   // Require strict equality
        }
    }
);
