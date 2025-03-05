const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, options) => {
    const dev = options.mode === 'development';
    const buildType = dev ? 'dev' : 'prod';
    const version = require('./package.json').version;

    return {
        entry: {
            taskpane: './src/index.js',
            commands: './src/commands.js'
        },
        output: {
            clean: true,
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
            publicPath: '/'
        },
        devServer: {
            static: {
                directory: path.join(__dirname, 'dist'),
                publicPath: '/',
            },
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            server: {
                type: 'https',
                options: {
                    key: path.join(__dirname, 'certs', 'localhost.key'),
                    cert: path.join(__dirname, 'certs', 'localhost.crt')
                }
            },
            port: 3000,
            hot: true,
        },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.html', '.css']
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env', '@babel/preset-react']
                        }
                    }
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: 'ts-loader'
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                },
                {
                    test: /\.(png|jpg|jpeg|gif|ico|svg)$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            name: './assets/[name].[ext]',
                        }
                    }
                },
                {
                    test: /\.html$/,
                    exclude: /node_modules/,
                    use: 'html-loader'
                }
            ]
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'assets/*',
                        to: 'assets/[name][ext]',
                        noErrorOnMissing: true
                    },
                    {
                        from: 'manifest*.xml',
                        to: '[name]' + '[ext]',
                        transform(content) {
                            if (dev) {
                                return content;
                            } else {
                                return content
                                    .toString()
                                    .replace(new RegExp('https://localhost:3000', 'g'), 'https://yourproductionurl.com');
                            }
                        }
                    }
                ]
            }),
            new HtmlWebpackPlugin({
                filename: 'taskpane.html',
                template: './src/taskpane/taskpane.html',
                chunks: ['taskpane']
            }),
            new HtmlWebpackPlugin({
                filename: 'commands.html',
                template: './src/taskpane/commands.html',
                chunks: ['commands']
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(options.mode),
                'process.env.BUILD_TYPE': JSON.stringify(buildType),
                'process.env.VERSION': JSON.stringify(version)
            })
        ],
        devtool: dev ? 'source-map' : false,
    };
};
