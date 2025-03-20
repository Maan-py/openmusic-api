import globals from 'globals';
import pluginJs from '@eslint/js';
import dicodingAcademyConfig from 'eslint-config-dicodingacademy';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
  pluginJs.configs.recommended,
  dicodingAcademyConfig, // Menambahkan konfigurasi Dicoding Academy langsung
];
