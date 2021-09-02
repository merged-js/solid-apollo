import { execSync } from 'child_process'
import fs from 'fs'

import babel from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'
import del from 'rollup-plugin-delete'

const yalcPublisher = () =>
  process.argv.includes('--yalc')
    ? {
        writeBundle: () => {
          execSync('yalc publish --push', {
            stdio: 'inherit',
          })
        },
      }
    : {}

export default {
  input: 'src/index.ts',
  external: id => !(id.startsWith('.') || id.startsWith('/')),
  output: [
    {
      dir: './dist',
      format: 'es',
      preserveModules: true,
      entryFileNames: 'es/[name].js',
    },
    {
      dir: './dist',
      format: 'cjs',
      preserveModules: true,
      entryFileNames: 'cjs/[name].js',
    },
  ],
  plugins: [
    del({ runOnce: true, targets: ['./dist/**/*'] }),
    typescript(),
    babel({
      extensions: ['.ts', '.tsx'],
      babelHelpers: 'bundled',
      presets: ['solid'],
    }),
    {
      writeBundle() {
        fs.writeFileSync('./dist/es/package.json', JSON.stringify({ type: 'module' }, null, '  '))
      },
    },
    yalcPublisher(),
  ],
}
