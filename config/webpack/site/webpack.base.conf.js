const path = require('path')
const {VueLoaderPlugin} = require('vue-loader')
const HTMLWebpackPlugin = require('html-webpack-plugin');
const site = path.join(__dirname, '../../../site');

module.exports = {
  entry: path.join(site, 'main.ts'),
  output: {
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
      { test: /\.js$/, use: 'babel-loader', exclude: /node_modules/},
      { test: /\.jsx$/, use: 'babel-loader'},
      {
        test: /\.ts|\.tsx$/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              appendTsxSuffixTo: [/\.vue$/]
            }
          },
        ]
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader']},
      { test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader']},
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.vue', '.jsx'],
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
