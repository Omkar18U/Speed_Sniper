// packages/ui/webpack.standalone.js
// Standalone webpack config that bypasses NxAppWebpackPlugin for the dev server.
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  devtool: false,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.[tj]s$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', decorators: true },
              target: 'es2017',
            },
            module: { type: 'es6' },
            sourceMaps: false,
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      scriptLoading: 'module',
    }),
  ],
  devServer: {
    port: 8081,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
  experiments: {
    outputModule: true,
  },
};
