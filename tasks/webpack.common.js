const webpack = require('webpack');

module.exports = {
  entry: [
    './origofilteretuna.js'
  ],
  module: {
    rules: [{
      test: /\.(js)$/,
      exclude: /node_modules/
    }]
  },
  externals: ['Origo'],
  resolve: {
    extensions: ['*', '.js', '.scss']
  }
};
