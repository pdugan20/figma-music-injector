import esbuild from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'

const watch = process.argv.includes('--watch')

const pluginOpts = {
  entryPoints: ['src/plugin/index.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2017',
  outfile: 'dist/plugin.js',
}

async function buildUi() {
  const result = await esbuild.build({
    entryPoints: ['src/ui/main.ts'],
    bundle: true,
    format: 'iife',
    target: 'es2017',
    write: false,
  })
  const js = result.outputFiles[0].text
  const template = await readFile('src/ui/ui.html', 'utf8')
  const html = template.replace('<!-- BUNDLE -->', `<script>${js}</script>`)
  await mkdir('dist', { recursive: true })
  await writeFile('dist/ui.html', html)
}

if (watch) {
  const ctx = await esbuild.context(pluginOpts)
  await ctx.watch()
  await buildUi()
  console.log('[watch] built; rebuilding plugin on change (re-run for UI changes)')
} else {
  await esbuild.build(pluginOpts)
  await buildUi()
  console.log('[build] dist/plugin.js + dist/ui.html')
}
