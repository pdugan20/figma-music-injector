import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import figma from '@figma/eslint-plugin-figma-plugins'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { '@figma/figma-plugins': figma },
    rules: { ...figma.configs.recommended.rules },
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier
)
