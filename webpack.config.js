const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;

const webpack = require('webpack');

// const fs = require('fs');

const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    R4AW: [path.resolve(__dirname, "src", "r4aw.js")],
  },
  externals: {
    // 'fs': 'fs',
    // 'window': 'window'
  },
  watchOptions: {
    ignored: /node_modules/,
    poll: 1000,
    aggregateTimeout: 300
  },
  output: {
    publicPath: '',
    clean: true,
    libraryTarget: 'umd',
    globalObject: 'this',
    path: path.resolve(__dirname, "dist"),
    library: 'r4awExports'
  },
  devServer: {
    // static: path.resolve(__dirname, "dist"),
    open: true,
    liveReload: true,
  },
  node: {
    __dirname: false,   // this configuration ensures you get the actual directory path
    __filename: false,  // this configuration ensures you get the actual file path
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      title: 'R4AW',
      metaDesc: 'R4AW',
      template: path.resolve(__dirname, "src/index.ejs"),
      filename: 'index.html',
      inject: false,
      minify: true,
      templateParameters: (compilation, assets, options) => {
        // const fs = require('fs');
        // const p5Content = fs.readFileSync('./public/p5.min.js', 'utf-8');
        return {
          compilation,
          webpackConfig: options.webpackConfig,
          assets,
          options,
          // fs,
          // p5Content,
        };
      },
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'R4AW',
      metaDesc: 'R4AW',
      template: path.resolve(__dirname, "src/nft.ejs"),
      filename: 'nft.html',
      inject: false,
      minify: false,
      templateParameters: (compilation, assets, options) => {
        // const fs = require('fs');
        // const p5Content = fs.readFileSync('./public/p5.min.js', 'utf-8');
        return {
          compilation,
          webpackConfig: options.webpackConfig,
          assets,
          options,
          // fs,
          // p5Content,
        };
      },
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'R4AW',
      metaDesc: 'R4AW',
      template: path.resolve(__dirname, "src/gif.ejs"),
      filename: 'gif.html',
      inject: false,
      minify: false,
      templateParameters: (compilation, assets, options) => {
        // const fs = require('fs');
        // const p5Content = fs.readFileSync('./public/p5.min.js', 'utf-8');
        return {
          compilation,
          webpackConfig: options.webpackConfig,
          assets,
          options,
          // fs,
          // p5Content,
        };
      },
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public' }
      ]
    }),
    new LicenseWebpackPlugin({
      outputFilename: 'licenses.txt',
      perChunkOutput: false,
      licenseType: 'allow',
      licenseTextOverrides: {
        '@ethersproject/logger': 'unknown',
        'hash.js': 'unknown',
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|svg|ttf)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: true,
            },
          },
        ],
      },
    ]
  }
}