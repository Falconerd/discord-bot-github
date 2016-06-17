module.exports = function(config) {
  config.set({
    preprocessors: {
      '**/*.ts': ['typescript']
    },

    typescriptPreprocessor: {
      options: {
        sourceMap: false,
        target: 'ES5',
        module: 'amd',
        noImplicitAny: true,
        noResolve: true,
        removeComments: true,
        concatenateOutput: false
      },
      
      transformPath: function(path) {
        return path.replace(/\.ts$/, '.js');
      }
    }
  });
};
