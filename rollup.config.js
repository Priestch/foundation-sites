var rollupBabel = require('@rollup/plugin-babel').babel;

var baseConfig = {
  external: ['jquery'],
  plugins: [
    rollupBabel({
      presets: [
        // JS dist stays ES5 (decision D3); targets are pinned explicitly so the
        // CSS-side ".browserslistrc" baseline does not loosen JS transpilation.
        ["@babel/preset-env", { modules: false, targets: { ie: '11' } }]
      ],
    }),
  ],
};

module.exports = [

  // UMD
  // Compatible with most environments and tools (AMD, CJS, ESM...),
  // > Generated with Webpack. See the "javascript:foundation" gulp task.
  // > TODO: factorize the assets generation.

  // CommonJS
  // For older bundlers like Browserify or Webpack 1.
  Object.assign({}, baseConfig, {
    input: './js/foundation.js',
    output: {
      exports: 'named',
      format: 'cjs',
      file: './dist/js/foundation.cjs.js',
      sourcemap: true,
    }
  }),

  // ES Modules
  // For modern bundlers like Webpack 2+ or Rollup that will use ES Modules
  // via static analysis to make some tree shaking.
  Object.assign({}, baseConfig, {
    input: './js/foundation.js',
    output: {
      exports: 'named',
      format: 'es',
      file: './dist/js/foundation.esm.js',
      sourcemap: true,
    }
  }),

  // ES6
  // Non-transpiled ES modules for those who want to transpile their code with
  // their own configuration (e.g. for custom targets).
  Object.assign({}, baseConfig, {
    input: './js/foundation.js',
    plugins: [], // No babel transpilation
    output: {
      exports: 'named',
      format: 'es',
      file: './dist/js/foundation.es6.js',
      sourcemap: true,
    }
  }),

];
