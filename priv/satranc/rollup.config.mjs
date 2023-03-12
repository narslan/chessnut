import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/app.ts',
  output: [
    {
      file: 'dist/app.js',
      format: 'iife',
      name: 'Satranc',
    },
    // {
    //   file: 'dist/chessground-examples.min.js',
    //   format: 'iife',
    //   name: 'ChessgroundExamples',
    // },
  ],
  plugins: [resolve(), typescript(), commonjs()],
};
