import { terser } from 'rollup-plugin-terser';

export default {
  input: 'aura-cards.js', // Main file that imports and registers all your cards
  output: {
    file: 'dist/aura-cards.min.js',
    format: 'esm',
    sourcemap: true // optional for debugging
  },
  plugins: [terser()]
};
