# DEAD SIMPLE SETUP - NO TECHNICAL KNOWLEDGE REQUIRED

## Follow these steps EXACTLY:

### Step 1: Create the setup script
1. Open Notepad or any text editor
2. Copy this ENTIRE block of code:

```javascript
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

console.log('\n🚀 SETTING UP WORD ADD-IN\n');

// Create folders
if (!fs.existsSync('./dist')) fs.mkdirSync('./dist', { recursive: true });
if (!fs.existsSync('./certs')) fs.mkdirSync('./certs', { recursive: true });

// Create certificates
const keyPath = './certs/server.key';
const certPath = './certs/server.crt';
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
fs.writeFileSync(keyPath, privateKey);
fs.writeFileSync(certPath, publicKey);
console.log('✅ Created certificates');

// Create HTML file
const htmlContent = `<!DOCTYPE html>
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
      Office.context.document.setSelectedDataAsync('Hello from the add-in!',
        function(result) {
          document.getElementById('result').textContent = 
            result.status === Office.AsyncResultStatus.Succeeded ? 
            'Text inserted!' : 'Error: ' + result.error.message;
        }
      );
    }
  </script>
  <style>
    body { font-family: Arial; margin: 20px; }
    button { padding: 10px; background: blue; color: white; border: none; }
  </style>
</head>
<body>
  <h1>Test Add-in</h1>
  <p>Status: <span id="status">Loading...</span></p>
  <button onclick="insertText()">Test: Insert Text</button>
  <p id="result"></p>
</body>
</html>`;
fs.writeFileSync('./dist/taskpane.html', htmlContent);
console.log('✅ Created HTML file');

// Create manifest
const manifestContent = `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp
    xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:type="TaskPaneApp">
    <Id>12345678-1234-1234-1234-123456789012</Id>
    <Version>1.0.0</Version>
    <ProviderName>Test</ProviderName>
    <DefaultLocale>en-US</DefaultLocale>
    <DisplayName DefaultValue="Test Word Add-in" />
    <Description DefaultValue="Simple test add-in"/>
    <Hosts>
        <Host Name="Document" />
    </Hosts>
    <DefaultSettings>
        <SourceLocation DefaultValue="https://localhost:3000/taskpane.html" />
    </DefaultSettings>
    <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>`;
fs.writeFileSync('./manifest.xml', manifestContent);
console.log('✅ Created manifest');

// Create PS1 script
const psScript = `
$manifestPath = "${path.resolve('./manifest.xml').replace(/\\/g, '\\\\')}";
$registryPath = "HKCU:\\Software\\Microsoft\\Office\\16.0\\WEF\\Developer\\";
if (-not (Test-Path $registryPath)) {
    New-Item -Path $registryPath -Force | Out-Null;
}
New-ItemProperty -Path $registryPath -Name "TestAddin" -Value $manifestPath -PropertyType String -Force | Out-Null;
Write-Host "Add-in registered in registry!";
`;
fs.writeFileSync('./register.ps1', psScript);
console.log('✅ Created registration script');

// Start server
console.log('\nStarting server...');
const server = https.createServer({
  key: privateKey,
  cert: publicKey
}, (req, res) => {
  console.log(`Request: ${req.url}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  let filePath = req.url === '/' ? '/taskpane.html' : req.url;
  filePath = './dist' + filePath;
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200);
    res.end(content);
  });
});

server.listen(3000, () => {
  console.log('\n✅ SERVER RUNNING!');
  console.log('\n👉 DO THESE STEPS NOW:');
  console.log('1. Open your browser to https://localhost:3000');
  console.log('2. Accept the security warning');
  console.log('3. Run this command: powershell -ExecutionPolicy Bypass -File ./register.ps1');
  console.log('4. COMPLETELY close and restart Word');
  console.log('5. In Word: Insert tab > Add-ins > My Add-ins > Look for "Test Word Add-in"');
});
```

3. Save this file as `setup.js` in your folder at:
   `C:\Users\casey\OneDrive\Documents\GitHub\word-GPT-Plus\setup.js`

### Step 2: Run the script
1. Press `Windows + R` keys
2. Type `cmd` and press Enter
3. In the command prompt, type:
```
cd C:\Users\casey\OneDrive\Documents\GitHub\word-GPT-Plus
node setup.js
```

### Step 3: Accept the certificate
1. Open your web browser
2. Go to `https://localhost:3000`
3. You'll see a security warning - click "Advanced" and then "Proceed to localhost (unsafe)"
4. You should see a simple webpage that says "Test Add-in"

### Step 4: Register the add-in
1. Open a new PowerShell window (right-click Start > Windows PowerShell)
2. Type this command:
```
cd C:\Users\casey\OneDrive\Documents\GitHub\word-GPT-Plus
powershell -ExecutionPolicy Bypass -File ./register.ps1
```
3. You should see "Add-in registered in registry!"

### Step 5: Open Word and add the add-in
1. Close Word completely if it's open
2. Open Word again (start fresh)
3. Click the Insert tab at the top
4. Click Add-ins (or My Add-ins)
5. Look for "Test Word Add-in" in the list
6. Click on it to add it

### If it doesn't work:
1. Make sure Word is COMPLETELY closed (check Task Manager)
2. Make sure the server is still running (the command prompt from Step 2)
3. Try running PowerShell as administrator and repeat Step 4
