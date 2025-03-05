const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing dependencies for Word-GPT-Plus...');

// Save current directory
const currentDir = process.cwd();

// Ensure we're in the project directory
try {
    process.chdir(path.resolve(__dirname));
    console.log(`Working directory: ${process.cwd()}`);
} catch (err) {
    console.error(`Could not change to project directory: ${err}`);
    process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('node_modules directory not found. Installing dependencies...');
}

// Install core development dependencies explicitly
console.log('Installing essential build dependencies...');
const coreDeps = [
    'webpack@5.89.0',
    'webpack-cli@5.1.4',
    'webpack-dev-server@4.15.1',
    'html-webpack-plugin@5.5.3',
    'copy-webpack-plugin@11.0.0',
    'babel-loader@9.1.3',
    '@babel/core@7.22.9',
    '@babel/preset-env@7.22.9',
    '@babel/preset-react@7.22.5',
    'ts-loader@9.5.1',
    'css-loader@6.8.1',
    'style-loader@3.3.3',
    'file-loader@6.2.0',
    'html-loader'
];

try {
    execSync(`npm install --save-dev ${coreDeps.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Core build dependencies installed successfully');
} catch (error) {
    console.error('⚠️ Error installing core dependencies');
    console.error(error);
}

// Install React dependencies explicitly
console.log('\nInstalling React dependencies...');
const reactDeps = [
    'react@18.2.0',
    'react-dom@18.2.0',
    '@fluentui/react@8.112.9'
];

try {
    execSync(`npm install --save ${reactDeps.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ React dependencies installed successfully');
} catch (error) {
    console.error('⚠️ Error installing React dependencies');
    console.error(error);
}

// Create a simple npm script to help in the future
console.log('\nUpdating package.json scripts...');
try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = require(packageJsonPath);

    // Add or update helpful scripts
    packageJson.scripts = {
        ...(packageJson.scripts || {}),
        "fix-deps": "node fix-dependencies.js",
        "dev": "webpack serve --mode development",
        "build": "webpack --mode production",
        "validate": "office-addin-manifest validate manifest.xml",
        "setup": "node setup-project.js"
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json updated with helpful scripts');
} catch (error) {
    console.error('⚠️ Error updating package.json');
    console.error(error);
}

console.log('\n🎉 Dependency fixes complete! Try running "npm run dev" again.');
