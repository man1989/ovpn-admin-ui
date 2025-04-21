// webpack.config.js (AT ROOT)
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development', // change to 'production' for builds
  entry: './client/src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build/ui'),
    filename: 'bundle.js',
    publicPath: '/', // needed for React Router
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './client/public/index.html',
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'build/ui'),
    },
    historyApiFallback: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
};
