import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import globals from 'globals';

export default [
  // Global Ignores
  {
    ignores: ['dist/**', 'node_modules/**', '.next/**', 'out/**', 'build/**'],
  },
  
  // Base JS recommendation
  js.configs.recommended,
  
  // TypeScript recommendation
  ...tseslint.configs.recommended,

  // App Code configuration
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Standard app rules
    },
  },

  // Firebase Rules configuration
  firebaseRulesPlugin.configs['flat/recommended'],
  
  // Custom Firebase Rules override (optional)
  {
    files: ['**/*.rules'],
    rules: {
      // In SignalSlides, public reading of topics/claims is intended
      'firebase-rules/no-open-reads': 'warn',
    }
  }
];
