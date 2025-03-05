/**
 * ONE-STEP WORD ADD-IN SETUP
 * This file creates everything needed and starts the server
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

console.log('\n🚀 SUPER SIMPLE ONE-STEP WORD ADD-IN SETUP 🚀\n');

// Create necessary folders
const DIST_DIR = path.join(__dirname, 'dist');
const CERTS_DIR = path.join(__dirname, 'certs');
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true });

// STEP 1: Create certificates using Node.js crypto
console.log('Step 1: Creating SSL certificates...');
const crypto = require('crypto');

const keyPath = path.join(CERTS_DIR, 'server.key');
const certPath = path.join(CERTS_DIR, 'server.crt');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    // Generate a simple self-signed certificate
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    fs.writeFileSync(keyPath, privateKey);
    fs.writeFileSync(certPath, publicKey);
    console.log('✅ Created SSL certificates');
} else {
    console.log('✅ Using existing SSL certificates');
}

// STEP 2: Create a minimal HTML file
console.log('\nStep 2: Creating minimal HTML file...');
const htmlPath = path.join(DIST_DIR, 'taskpane.html');
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Word Add-in Test</title>
  <script src="https://appsforoffice.microsoft.com/lib/1.1/hosted/office.js"></script>
  <script>
    // Initialize Office
    Office.onReady(function() {
      document.getElementById('status').textContent = 'Office.js is ready!';
    });
    
    // Simple function to insert text
    function insertText() {
      Office.context.document.setSelectedDataAsync(
        'Hello from the add-in! It works!',
        function(result) {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            document.getElementById('result').textContent = 'Text inserted! Success!';
          } else {
            document.getElementById('result').textContent = 'Error: ' + result.error.message;
          }
        }
      );
    }
  </script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    button { padding: 10px; background: blue; color: white; border: none; cursor: pointer; }
    .success { color: green; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Simple Word Add-in</h1>
  <p>Status: <span id="status">Loading...</span></p>
  <button onclick="insertText()">Insert Text</button>
  <p id="result"></p>
</body>
</html>`;

fs.writeFileSync(htmlPath, htmlContent);
console.log(`✅ Created ${htmlPath}`);

// STEP 3: Create a manifest file
console.log('\nStep 3: Creating manifest file...');
const manifestPath = path.join(__dirname, 'manifest.xml');
const manifestContent = `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp
    xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:type="TaskPaneApp">
    <Id>12345678-1234-1234-1234-123456789012</Id>
    <Version>1.0.0</Version>
    <ProviderName>Simple Provider</ProviderName>
    <DefaultLocale>en-US</DefaultLocale>
    <DisplayName DefaultValue="Simple Word Add-in" />
    <Description DefaultValue="A simple Word add-in"/>
    <Hosts>
        <Host Name="Document" />
    </Hosts>
    <DefaultSettings>
        <SourceLocation DefaultValue="https://localhost:3000/taskpane.html" />
    </DefaultSettings>
    <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>`;

fs.writeFileSync(manifestPath, manifestContent);
console.log(`✅ Created ${manifestPath}`);

// STEP 4: Register the add-in in Windows Registry
console.log('\nStep 4: Registering add-in in Windows Registry...');
const registryPs1 = `
$manifestPath = "${manifestPath.replace(/\\/g, '\\\\')}";
$registryPath = "HKCU:\\Software\\Microsoft\\Office\\16.0\\WEF\\Developer\\";

# Create the registry path if it doesn't exist
if (-not (Test-Path $registryPath)) {
    New-Item -Path $registryPath -Force | Out-Null;
}

# Register with a very obvious name
New-ItemProperty -Path $registryPath -Name "SimpleWordAddin" -Value $manifestPath -PropertyType String -Force | Out-Null;

Write-Host "Add-in registered successfully!";
`;

const psPath = path.join(__dirname, 'register.ps1');
fs.writeFileSync(psPath, registryPs1);

try {
    console.log('Registering add-in...');
    execSync('powershell -ExecutionPolicy Bypass -File register.ps1', { stdio: 'inherit' });
} catch (error) {
    console.error('Error registering add-in. Try running this as Administrator.');
    console.log('You can manually register by running: powershell -ExecutionPolicy Bypass -File register.ps1');
}

// STEP 5: Start the server
console.log('\nStep 5: Starting HTTPS server...');
const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
};

const server = https.createServer(options, (req, res) => {
    console.log(`Request: ${req.url}`);

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let filePath = req.url;
    if (filePath === '/' || filePath === '/index.html') {
        filePath = '/taskpane.html';
    }

    filePath = path.join(DIST_DIR, filePath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end(`File not found: ${req.url}`);
            return;
        }

        let contentType = 'text/html';
        const ext = path.extname(filePath);
        if (ext === '.js') contentType = 'text/javascript';
        if (ext === '.css') contentType = 'text/css';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(3000, () => {
    console.log('\n✅ SERVER RUNNING AT https://localhost:3000');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Open your browser and go to https://localhost:3000 to accept the security warning');
    console.log('2. COMPLETELY CLOSE WORD (all instances) if it\'s open');
    console.log('3. Open Word');
    console.log('4. Go to Insert tab > Add-ins > My Add-ins');
    console.log('5. Look for "Simple Word Add-in" in the list');
    console.log('\nIf you don\'t see it:');
    console.log('- Make sure Word is completely closed and restarted');
    console.log('- Try running this script as Administrator');
    console.log('\n(Keep this terminal window open while using the add-in)');
});
