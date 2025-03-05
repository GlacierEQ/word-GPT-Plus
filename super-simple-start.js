/**
 * Super simple starter script for Word-GPT-Plus
 * This will get everything working with minimal dependencies
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

console.log('\n🔥 SUPER SIMPLE WORD ADD-IN SETUP 🔥\n');

// Create necessary directories
const DIST_DIR = path.join(__dirname, 'dist');
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
  console.log('Created dist directory');
}

// Create a minimal HTML file
const taskpaneHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Word Add-in Test</title>
  <script src="https://appsforoffice.microsoft.com/lib/1.1/hosted/office.js"></script>
  <script>
    Office.onReady(function() {
      document.getElementById('status').textContent = 'Connected to Word!';
    });
    
    function insertText() {
      Office.context.document.setSelectedDataAsync(
        'Hello from Word Add-in!',
        function(result) {
          document.getElementById('result').textContent = 
            result.status === Office.AsyncResultStatus.Succeeded ? 
            'Text inserted successfully!' : 
            'Error: ' + result.error.message;
        }
      );
    }
  </script>
  <style>
    body { font-family: sans-serif; margin: 20px; background: #f0f0f0; }
    h1 { color: #2b579a; }
    button { padding: 10px 15px; margin-top: 20px; background: #2b579a; color: white; border: none; cursor: pointer; }
    .success { color: green; }
  </style>
</head>
<body>
  <h1>Super Simple Word Add-in</h1>
  <div>Status: <span id="status">Waiting to connect...</span></div>
  <button onclick="insertText()">Insert Text</button>
  <div id="result"></div>
</body>
</html>`;

const taskpanePath = path.join(DIST_DIR, 'taskpane.html');
fs.writeFileSync(taskpanePath, taskpaneHtml);
console.log('Created taskpane.html');

// Create a minimal manifest
const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp 
  xmlns="http://schemas.microsoft.com/office/appforoffice/1.1" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xsi:type="TaskPaneApp">
  <Id>12345678-1234-1234-1234-123456789012</Id>
  <Version>1.0.0</Version>
  <ProviderName>Simple Add-in Provider</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="Super Simple Add-in" />
  <Description DefaultValue="A super simple Word add-in"/>
  <Hosts>
    <Host Name="Document" />
  </Hosts>
  <DefaultSettings>
    <SourceLocation DefaultValue="https://localhost:3000/taskpane.html" />
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>`;

const manifestPath = path.join(__dirname, 'manifest.xml');
fs.writeFileSync(manifestPath, manifestXml);
console.log('Created manifest.xml');

// Create a simple start script
console.log('\nCreating registry script...');
const psScript = `
$manifestPath = "${manifestPath.replace(/\\/g, '\\\\')}";
$registryPath = "HKCU:\\Software\\Microsoft\\Office\\16.0\\WEF\\Developer\\";

if (-not (Test-Path $registryPath)) {
    New-Item -Path $registryPath -Force | Out-Null;
}

New-ItemProperty -Path $registryPath -Name "SimpleSuperAddin" -Value $manifestPath -PropertyType String -Force | Out-Null;

Write-Host "✅ Add-in registered in registry. Now:";
Write-Host "1. Start the server with: node super-simple-start.js --serve";
Write-Host "2. Open Word, go to Insert tab > Add-ins > My Add-ins";
Write-Host "3. Look for 'Super Simple Add-in'";
`;

const scriptPath = path.join(__dirname, 'register-simple.ps1');
fs.writeFileSync(scriptPath, psScript);
console.log('Created registration script');

// If --serve flag is passed, start an HTTPS server
if (process.argv.includes('--serve')) {
  // Create or load certificates
  const CERTS_DIR = path.join(__dirname, 'certs');
  const KEY_PATH = path.join(CERTS_DIR, 'localhost.key');
  const CERT_PATH = path.join(CERTS_DIR, 'localhost.crt');
  
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(KEY_PATH) || !fs.existsSync(CERT_PATH)) {
    console.log('\nGenerating SSL certificates...');
    try {
      execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${KEY_PATH}" -out "${CERT_PATH}" -days 365 -nodes -subj "/CN=localhost"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to generate certificates. Make sure OpenSSL is installed.');
      process.exit(1);
    }
  }
  
  // Start the server
  console.log('\nStarting HTTPS server...');
  const server = https.createServer({
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH)
  }, (req, res) => {
    console.log(`${new Date().toISOString()} - Request: ${req.url}`);
    
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'taskpane.html' : req.url);
    
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end(`File not found: ${req.url}`);
        return;
      }
      
      let contentType = 'text/html';
      const ext = path.extname(filePath);
      
      switch (ext) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
  
  server.listen(3000, () => {
    console.log('\n✅ Server running at https://localhost:3000/');
    console.log('Visit https://localhost:3000/ in your browser to verify it works');
    console.log('\nNow register the add-in by running:');
    console.log('powershell -ExecutionPolicy Bypass -File register-simple.ps1');
    console.log('\nThen open Word and look for "Super Simple Add-in" in Insert tab > Add-ins > My Add-ins');
    console.log('\nPress Ctrl+C to stop the server');
  });
} else {
  // Just print instructions
  console.log('\n✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Register the add-in:');
  console.log('   powershell -ExecutionPolicy Bypass -File register-simple.ps1');
  console.log('2. Start the server:');
  console.log('   node super-simple-start.js --serve');
  console.log('3. Open Word, go to Insert tab > Add-ins > My Add-ins');
  console.log('4. Look for "Super Simple Add-in"');
}
