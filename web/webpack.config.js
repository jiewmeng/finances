const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const ENV = process.env.NODE_ENV || ''
const devMode = !ENV.match(/^staging|production$/)

module.exports = {
  mode: ENV.match(/^staging|production$/) ? 'production' : 'development',
  devtool: 'source-map',
  entry: {
    app: [
      '@babel/polyfill',
      'react-hot-loader/patch',
      './js/app.js'
    ]
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: '[name].js',
    publicPath: '/'
  },
  resolve: {
    alias: {
      app: path.resolve(__dirname)
    },
    extensions: ['.js', '.jsx', '.json']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }]
      },
      {
        test: /\.css$/,
        loaders: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ]
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
      inject: 'body'
    }),
    new MiniCssExtractPlugin({
      filename: devMode ? '[name].css' : '[name].[hash].css',
      chunkFilename: devMode ? '[id].css' : '[id].[hash].css'
    }),
    new CopyWebpackPlugin([
      {
        from: 'assets',
        to: '.'
      }
    ]),
  ],
  devServer: {
    contentBase: './assets',
    historyApiFallback: true
  }
}
