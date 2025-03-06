/**
 * Word GPT Plus - Build Script
 * Automates the build process for production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const packageJson = require('../package.json');

// Configuration
const config = {
    buildDir: path.resolve(__dirname, '../dist'),
    srcDir: path.resolve(__dirname, '../src'),
    assetsDir: path.resolve(__dirname, '../assets'),
    tempDir: path.resolve(__dirname, '../.temp'),
    packageDir: path.resolve(__dirname, '../package'),
    version: packageJson.version,
    environment: process.env.NODE_ENV || 'development'
};

// Ensure directories exist
[config.buildDir, config.tempDir, config.packageDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Clean build directory
 */
function cleanBuildDir() {
    console.log('🧹 Cleaning build directory...');
    try {
        if (fs.existsSync(config.buildDir)) {
            fs.readdirSync(config.buildDir).forEach(file => {
                const filePath = path.join(config.buildDir, file);
                if (file !== '.gitkeep') {
                    fs.rmSync(filePath, { recursive: true, force: true });
                }
            });
        }
        console.log('✅ Build directory cleaned');
    } catch (error) {
        console.error('❌ Error cleaning build directory:', error);
        process.exit(1);
    }
}

/**
 * Build frontend assets
 */
function buildFrontendAssets() {
    console.log('🔧 Building frontend assets...');

    const webpackConfig = {
        mode: config.environment,
        entry: {
            'taskpane': path.resolve(config.srcDir, 'taskpane.js'),
            'intelligent-features': path.resolve(config.srcDir, 'intelligent-features.js'),
            'quality-manager': path.resolve(config.srcDir, 'quality-manager.js'),
            'document-manager': path.resolve(config.srcDir, 'document-manager.js'),
            'image-processor': path.resolve(config.srcDir, 'image-processor.js'),
            'compression-utils': path.resolve(config.srcDir, 'compression-utils.js'),
            'advanced-learning': path.resolve(config.srcDir, 'advanced-learning.js'),
            'performance-monitor': path.resolve(config.srcDir, 'performance-monitor.js')
        },
        output: {
            path: config.buildDir,
            filename: '[name].js',
            chunkFilename: '[name].[contenthash].js'
        },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: config.environment === 'production',
                        },
                        format: {
                            comments: false,
                        },
                    },
                    extractComments: false,
                }),
            ],
            splitChunks: {
                chunks: 'all',
                maxInitialRequests: Infinity,
                minSize: 0,
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name(module) {
                            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                            return `vendor.${packageName.replace('@', '')}`;
                        },
                    },
                },
            }
        },
        plugins: [
            new CleanWebpackPlugin(),
            new CopyPlugin({
                patterns: [
                    { from: path.resolve(config.srcDir, '*.html'), to: config.buildDir },
                    { from: path.resolve(config.srcDir, 'styles.css'), to: config.buildDir },
                    { from: config.assetsDir, to: path.join(config.buildDir, 'assets') },
                ],
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                            plugins: ['@babel/plugin-transform-runtime']
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                },
                {
                    test: /\.(png|svg|jpg|gif)$/,
                    use: ['file-loader']
                }
            ]
        },
        resolve: {
            extensions: ['.js', '.json']
        },
        devtool: config.environment === 'development' ? 'source-map' : false
    };

    return new Promise((resolve, reject) => {
        webpack(webpackConfig, (err, stats) => {
            if (err || stats.hasErrors()) {
                console.error('❌ Error building frontend assets:', err || stats.toString());
                reject(err || new Error(stats.toString()));
            } else {
                console.log('✅ Frontend assets built successfully');
                resolve();
            }
        });
    });
}

/**
 * Update manifest version
 */
function updateManifestVersion() {
    console.log('📝 Updating manifest version...');
    try {
        const manifestPath = path.join(__dirname, '../Manifest.xml');
        let manifestContent = fs.readFileSync(manifestPath, 'utf8');

        // Update version in manifest
        manifestContent = manifestContent.replace(
            /<Version>.*?<\/Version>/,
            `<Version>${config.version}</Version>`
        );

        fs.writeFileSync(manifestPath, manifestContent);
        fs.copyFileSync(manifestPath, path.join(config.buildDir, 'Manifest.xml'));

        console.log(`✅ Manifest updated to version ${config.version}`);
    } catch (error) {
        console.error('❌ Error updating manifest version:', error);
        process.exit(1);
    }
}

/**
 * Validate the manifest
 */
function validateManifest() {
    console.log('🔍 Validating manifest...');
    try {
        // Use Office Add-in validator if available
        try {
            execSync('npx office-addin-manifest validate -m Manifest.xml', { stdio: 'inherit' });
        } catch {
            console.warn('⚠️ Office Add-in validator not available, skipping detailed validation');
            // Basic XML validation
            const manifestPath = path.join(__dirname, '../Manifest.xml');
            const manifestContent = fs.readFileSync(manifestPath, 'utf8');

            // Check for essential elements
            if (!manifestContent.includes('<ProviderName>')) {
                throw new Error('Manifest missing ProviderName element');
            }
            if (!manifestContent.includes('<DisplayName DefaultValue=')) {
                throw new Error('Manifest missing DisplayName element');
            }
            if (!manifestContent.includes('<Host Name="Document"')) {
                throw new Error('Manifest missing Document host definition');
            }
        }

        console.log('✅ Manifest validation successful');
    } catch (error) {
        console.error('❌ Manifest validation failed:', error);
        process.exit(1);
    }
}

/**
 * Create a package for deployment
 */
function createPackage() {
    console.log('📦 Creating package...');
    try {
        // Clear package directory
        if (fs.existsSync(config.packageDir)) {
            fs.rmSync(config.packageDir, { recursive: true, force: true });
        }
        fs.mkdirSync(config.packageDir, { recursive: true });

        // Copy build files to package
        fs.cpSync(config.buildDir, path.join(config.packageDir, 'dist'), { recursive: true });

        // Copy manifest
        fs.copyFileSync(path.join(__dirname, '../Manifest.xml'), path.join(config.packageDir, 'Manifest.xml'));

        // Copy readme and license
        const filesToCopy = ['README.md', 'LICENSE'];
        filesToCopy.forEach(file => {
            if (fs.existsSync(path.join(__dirname, '..', file))) {
                fs.copyFileSync(path.join(__dirname, '..', file), path.join(config.packageDir, file));
            }
        });

        // Create package.json for the package
        const packageConfig = {
            name: packageJson.name,
            version: packageJson.version,
            description: packageJson.description,
            author: packageJson.author,
            license: packageJson.license,
            repository: packageJson.repository
        };
        fs.writeFileSync(
            path.join(config.packageDir, 'package.json'),
            JSON.stringify(packageConfig, null, 2)
        );

        // Create zip archive
        const archiveName = `${packageJson.name}-${packageJson.version}.zip`;
        const archivePath = path.join(__dirname, '..', archiveName);

        if (fs.existsSync(archivePath)) {
            fs.unlinkSync(archivePath);
        }

        execSync(`cd "${config.packageDir}" && zip -r "${archivePath}" ./*`, { stdio: 'inherit' });
        console.log(`✅ Package created: ${archiveName}`);
    } catch (error) {
        console.error('❌ Error creating package:', error);
        process.exit(1);
    }
}

/**
 * Run tests
 */
async function runTests() {
    console.log('🧪 Running tests...');
    try {
        execSync('npm test', { stdio: 'inherit' });
        console.log('✅ Tests passed');
    } catch (error) {
        console.error('❌ Tests failed:', error);
        process.exit(1);
    }
}

/**
 * Main build function
 */
async function build() {
    console.log(`📣 Building Word GPT Plus v${config.version} (${config.environment} mode)`);

    // Start the build steps
    cleanBuildDir();
    await buildFrontendAssets();
    updateManifestVersion();
    validateManifest();

    // Run tests if not in quick mode
    if (!process.argv.includes('--quick')) {
        await runTests();
    }

    createPackage();

    console.log('✨ Build completed successfully!');
}

// Run the build
build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
