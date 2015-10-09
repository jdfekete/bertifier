var path = require('path');
var webpack = require('webpack');

var ROOT_PATH = path.resolve(__dirname);
var APP_PATH = path.resolve(ROOT_PATH, 'entry.js');
var SOURCE_PATH = path.resolve(ROOT_PATH, 'js');
var BUILD_PATH = path.resolve(ROOT_PATH, 'build');

module.exports = {
  resolve: {
    extensions: ['', '.js']
  },
  entry: APP_PATH,
  output: {
    path: BUILD_PATH,
    filename: 'bertifier.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        include: [APP_PATH, SOURCE_PATH]
      }
    ]
  },
  devServer: {
    historyApiFallback: true,
    hot: true,
    inline: true,
    progress: true,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ]  
};
