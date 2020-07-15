const path = require('path')
const {VueLoaderPlugin} = require('vue-loader')
const HTMLWebpackPlugin = require('html-webpack-plugin');
const site = path.join(__dirname, '../../../site');

module.exports = {
  entry: path.join(site, 'main.ts'),
  module: {
    rules: [
      { test: /\.js$/, use: 'babel-loader', exclude: /node_modules/},
      { test: /\.jsx$/, use: 'babel-loader'},
      { test: /\.vue$/, use: 'vue-loader' },
      { test: /\.tsx$/, use: ['babel-loader','ts-loader']},
      {
        test: /\.ts$/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              appendTsSuffixTo: [/\.vue$/],
            }
          },
        ]
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader']},
      { test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader']},
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.vue'],
    alias: {
      // this isn't technically needed, since the default `vue` entry for bundlers
      // is a simple `export * from '@vue/runtime-dom`. However having this
      // extra re-export somehow causes webpack to always invalidate the module
      // on the first HMR update and causes the page to reload.
      'vue': '@vue/runtime-dom'
    }
  },
  plugins: [
    new VueLoaderPlugin(),
    new HTMLWebpackPlugin({
      template: path.resolve(site, './public/index.html')
    })
  ],
};
