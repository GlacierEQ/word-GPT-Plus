const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Word-GPT-Plus Simplified Setup');

// Install only core dependencies needed
const coreDeps = [
    'webpack@5.89.0',
    'webpack-cli@5.1.4',
    'webpack-dev-server@4.15.1',
    'html-webpack-plugin@5.5.3',
    'copy-webpack-plugin@11.0.0',
    'react@18.2.0',
    'react-dom@18.2.0',
    '@fluentui/react@8.112.9',
    'babel-loader@9.1.3',
    '@babel/core@7.22.9',
    '@babel/preset-env@7.22.9',
    '@babel/preset-react@7.22.5'
];

console.log('📦 Installing core dependencies...');
try {
    execSync(`npm install --save-dev ${coreDeps.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
} catch (error) {
    console.error('❌ Error installing dependencies:', error);
}

// Ensure we have a certificates directory
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
}

// Create a basic local registry entry script for add-in
const sideloadScriptPath = path.join(__dirname, 'register-addin.js');
const sideloadScript = `
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const manifestPath = path.resolve(__dirname, 'manifest.xml');
const addInName = "WordGPTPlus";

console.log('Registering add-in in Windows Registry...');

const psScript = \`
  $manifestPath = "${manifestPath.replace(/\\/g, '\\\\')}";
  $addInName = "${addInName}";
  $registryPath = "HKCU:\\\\Software\\\\Microsoft\\\\Office\\\\16.0\\\\WEF\\\\Developer\\\\";

  if (-not (Test-Path $registryPath)) {
      New-Item -Path $registryPath -Force | Out-Null;
      Write-Host "Created registry key for Office Add-ins";
  }

  New-ItemProperty -Path $registryPath -Name $addInName -Value $manifestPath -PropertyType String -Force | Out-Null;
  
  Write-Host "✅ Successfully registered Word-GPT-Plus for development";
  Write-Host "The add-in should now appear in the 'My Add-ins' section in Word";
\`;

fs.writeFileSync('register-addin.ps1', psScript);

try {
  execSync('powershell -ExecutionPolicy Bypass -File register-addin.ps1', { stdio: 'inherit' });
} catch (error) {
  console.error('Error registering add-in:', error);
  console.log('You may need to run this script as Administrator');
}
`;

fs.writeFileSync(sideloadScriptPath, sideloadScript);
console.log('✅ Created add-in registration script');

// Create a simple start script
const startScriptPath = path.join(__dirname, 'start-server.js');
const startServerScript = `
const { execSync } = require('child_process');
try {
  console.log('Starting development server...');
  execSync('npx webpack serve --mode development', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting server:', error);
}
`;

fs.writeFileSync(startScriptPath, startServerScript);
console.log('✅ Created server start script');

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Run "node register-addin.js" to register the add-in (as Administrator)');
console.log('2. Run "node start-server.js" to start the development server');
console.log('3. Open Word and look for Word-GPT-Plus in the My Add-ins section');
