import * as path from "path";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (argv) => {
    const isDevelopment = argv.mode === 'development';
    // Use dynamic import for package.json since we're using ES modules
    const packageVersion = process.env.npm_package_version || '1.0.0';

    return {
        entry: {
            taskpane: './src/index.js',
            commands: './src/commands.js'
        },
        output: {
            clean: true,
            filename: 'scripts/[name].js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: '/'
        },
        devServer: {
            static: {
                directory: path.join(__dirname, 'dist'),
            },
            compress: true,
            port: 3000,
            hot: true,
            https: true,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
        },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.html', '.css'],
            alias: {
                '@core': path.resolve(__dirname, 'src/core/'),
                '@api': path.resolve(__dirname, 'src/api/'),
                '@ui': path.resolve(__dirname, 'src/ui/'),
                '@utils': path.resolve(__dirname, 'src/utils/'),
                '@models': path.resolve(__dirname, 'src/models/'),
                '@security': path.resolve(__dirname, 'src/security/')
            }
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
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/[name][ext]'
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
            new CleanWebpackPlugin(),
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
                            if (isDevelopment) {
                                return content;
                            } else {
                                return content
                                    .toString()
                                    .replace(new RegExp('https://localhost:3000', 'g'), 'https://yourproductionurl.com');
                            }
                        }
                    },
                    {
                        from: 'src/ui/styles.css',
                        to: 'styles/main.css'
                    }
                ]
            }),
            new HtmlWebpackPlugin({
                filename: 'enhanced-taskpane.html',
                template: './src/ui/taskpane.html',
                chunks: ['taskpane']
            }),
            new HtmlWebpackPlugin({
                filename: 'commands.html',
                template: './src/taskpane/commands.html',
                chunks: ['commands']
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(argv.mode),
                'process.env.BUILD_TYPE': JSON.stringify(isDevelopment ? 'dev' : 'prod'),
                'process.env.VERSION': JSON.stringify(packageVersion)
            })
        ],
        devtool: isDevelopment ? 'source-map' : false,
    };
};
