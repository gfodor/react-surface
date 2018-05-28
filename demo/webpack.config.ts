import * as fs from 'fs';
import * as path from 'path';
import * as webpack from 'webpack';
import {HotModuleReplacementPlugin, LoaderOptionsPlugin, NamedModulesPlugin, NewModule} from 'webpack';
import {BuildOptions} from './BuildOptions';
import {without} from 'lodash';
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AutoDllPlugin = require('autodll-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// NOTE webpack requires a default export
export default async function webpackConfig (additionalOptions?: BuildOptions)  { // tslint:disable-line
  const options = {
    ...new BuildOptions(),
    ...additionalOptions
  };

  console.log('BuildOptions', JSON.stringify(options, null, 2));

  const sourceFolder = path.resolve(__dirname, 'src');

  const config: webpack.Configuration = {
    // What code to build and where to put it
    entry: compact<string>([
      path.join(sourceFolder, 'polyfills', 'index.ts'),
      options.hmr && 'react-hot-loader/patch',
      path.join(sourceFolder, 'main.tsx')
    ]),
    output: {
      filename: '[name].bundle.js',
      path: path.join(__dirname, options.outputFolder)
    },

    // Most webpack configs are controlled by our options
    stats: options.stats,
    cache: options.cache,
    devtool: options.sourceMaps ? 'source-map' : undefined,

    // Determine which extensions to lazy-load and how to look for sources
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },

    // Teach webpack how to load various modules
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: compact([
            options.hmr && 'react-hot-loader/webpack',
            {
              loader: 'ts-loader',
              query: {
                compilerOptions: {
                  sourceMap: options.sourceMaps,
                  module: 'esnext'
                }
              }
            }
          ])
        },
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader'
          })
        },
        {test: /\.(json|wav|svg|png|jpe?g)$/, use: 'file-loader'}
      ]
    },
    plugins: compact([
      new HtmlWebpackPlugin({filename: 'index.html', title: 'Surface Demo'}),

      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(options.environment)
        }
      }),

      new ExtractTextPlugin('styles.css'),

      new webpack.optimize.CommonsChunkPlugin({
        name: 'common',
        filename: 'common.js',
        minChunks: (module: any) => module.context && module.context.indexOf('node_modules') >= 0
      }),

      options.vendor && new AutoDllPlugin({
        inject: true,
        debug: true,
        filename: '[name].dll.js',
        entry: {
          vendor: without(
            Object.keys(JSON.parse(fs.readFileSync('./package.json', 'utf8')).dependencies),
            'react-hot-loader'
          )
        }
      }),

      options.hmr && new NamedModulesPlugin(),
      options.hmr && new HotModuleReplacementPlugin(),
      options.debug && new LoaderOptionsPlugin({debug: true}),
    ]),
    devServer: {
      hot: options.hmr,
      hotOnly: options.hmr
    },
  };

  // Loaders should only be applied to project sources
  for (const rule of (config.module as NewModule).rules) {
    rule.exclude = /node_modules/;
  }

  return config;
}

function compact <T> (array: Array<T | false>) {
  return array.filter((item) => !!item) as T[];
}
