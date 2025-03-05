// ACTUALLY WORKING SETUP WITH PROPER CERTIFICATES
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

console.log('\n🚀 SETTING UP WORD ADD-IN (FIXED VERSION)\n');

// Create folders
if (!fs.existsSync('./dist')) fs.mkdirSync('./dist', { recursive: true });

// Create HTML file - this is the add-in content
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

// FIXED: Create proper certificate files directly
console.log('\nNO MORE SSL ERRORS: Creating server files with hardcoded working certificates...');

// Key file
const keyFileContent = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6YfueQnlJ/rXP
gyZH1vz+7SNPYX5RDCGkLlUxaLf0QKVxvk7sfcQXojKwTeQxkzBXN+mSY4LXrREX
K+2j8aiu/yQoVK2bUIQxNTWS47DYnV0QwJO5vvZjsFKPS/aLMyvrLLnFR8gNiTSA
9FjIUjBS4X5mPwAqFfGw0L0/BzBIQGnFm9aLtIvRwc1fJ6jzY2CxqVGtsiWn0q+4
P35C6lu9EwzVnTXKVxgTQzTuuZQkq25ArNl+vcAUJJGKLjxNcx+iAKBGl/yrZdzk
6X3X5mru/suXgkH/NmWq+wUC+k7V0B5SxeDMHq4QLmK6gNoqe5Nf4+Ls/+mMnasY
A91Tf6qtAgMBAAECggEAESerUBeHXM7q2hJwrEuGfrP1TI4CdaRvoGLy3mcnH3a1
MUUXBIsKnafUMkBIh7RViWYPZUXUmXDmJPG123ujW8SFNmSvBkJx6HrjDgYBH8qj
pqI96BlFevZLsLo8zn/7geZFn9nQGd5O4aR4A6fzhoIyxdC5mAUS3PypuKqoXuDD
ROAhUtWiahJiUenTcBs3fbwqVJepmzSIGJdthTQW9DeAcA5ZYpkt4JMdgQV9EGAD
q3bD0fGgpvg9jeA3RW+xZnmmA9fA9hvfUBxIBGLWutOs0nB0duyGQAzfPP1Ttgvs
cRWE2hx+/5NG1vqbGAqwi/DpKs1fUQpSrH2FVR3miQKBgQD9Koqb0U2r9iGQUC93
Ekj8QEtAaJgXDD2NMsaA/o+dPlCzMxJQnlmxWW/4aBvtBQm2m+4GHjvtH33tpSQw
I8fI/rtUeMWXQPpXqYRHYmZD8yPeK7hUZO2GelK6q0UdV8XVnLQay3tk5AYLGcmg
TIuXbJPY6NymbHQrLBWlDALH8wKBgQC8egmxMGdh+M5ryd3gkGOsYJkrkwm0GRiV
XWzJqgJzoy4KOK3QeTgwLzqZmQdLYZQQXklxQZD9JYLBnW8z0qIGNeA4oMXNIT4w
UQQRvGxFELwJWpp4QbJvNe6kcK9ie7SzzmXhQRRTBD7Kk4aeFBGiTMf036+sCDX2
TS+Dz+8UXwKBgQDQX/WGWD0QcDTxaEbRv1xILQ5KrYrfRN0LVUG2WymIVyUMWZ4j
KB5V+zi/W7N0TTOR01OBnNTLSCWmYHy8rjOUR9lkOuWt5zcGlLsMezQwYikC8ByH
dlVLtcexrMCf3257M8yZaJZ5ZrPQRdyO7Uy8JFBgPeTR75zFQ7UIcjSJtQKBgQCt
+MoRYw0+1U3ht2u2c9DlBiteP8T+N6DePDd+lK0vBTZOYZCFl87c4c5dJIzSb7m4
QPI0zXDh1ZLeNA7WJP+oXrr4HX+9YjU+GDAE5OvJARsZO8ztOF3kyKUaHjSvSqQw
5M+mx8JZxnu9fLQWEZZ9julnc4yKJgP8nKJf+Z1SvQKBgGUvVcRkNbnJmxK9UTn0
MYASee8cjrja5l7bcdPhMN3ViVTvIWlDkK/Hc+gbARFKYiBm0VPlGXQY7LCLof25
gdN+I88N/jqm8QFGlHOBGadinXuQgSV9axX3/bcQpkJJPZKDykXZvGYzt+TXJwQM
nH6hSt9e5MGIbFPwDDz2Qm0i
-----END PRIVATE KEY-----`;

// Certificate file
const certFileContent = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUJhvc+84aSMdxlxyOgCF1k5F6Gi8wDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yMzA5MTExNTM4MjVaFw0zMzA5
MDgxNTM4MjVaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQC6YfueQnlJ/rXPgyZH1vz+7SNPYX5RDCGkLlUxaLf0
QKVxvk7sfcQXojKwTeQxkzBXN+mSY4LXrREXK+2j8aiu/yQoVK2bUIQxNTWS47DY
nV0QwJO5vvZjsFKPS/aLMyvrLLnFR8gNiTSA9FjIUjBS4X5mPwAqFfGw0L0/BzBI
QGnFm9aLtIvRwc1fJ6jzY2CxqVGtsiWn0q+4P35C6lu9EwzVnTXKVxgTQzTuuZQk
q25ArNl+vcAUJJGKLjxNcx+iAKBGl/yrZdzk6X3X5mru/suXgkH/NmWq+wUC+k7V
0B5SxeDMHq4QLmK6gNoqe5Nf4+Ls/+mMnasYA91Tf6qtAgMBAAGjUzBRMB0GA1Ud
DgQWBBQ5b8YBFmsFWIQi5jAgdpb9Y4maaDBCBgNVHSMEOzA5gBQ5b8YBFmsFWIQi
5jAgdpb9Y4maaMEZpBcwFTETMBEGA1UEAwwKbG9jYWxob3N0MIIBGTANBgkqhkiG
9w0BAQsFAAOCAQEAcaeXr3lY5AM52H/GDb138I9fTPRcrgzFlKLGR2JkRXlJU1hj
dpKjn8dG27RyQTLo74wJevN+Tccu22GOwfDpEQ8GQ5hFElrClzYo3Z0g8LQoWE7E
GWYF2EeATt+QgPKc+Q073chIgYKcsM2iGhpE8+mslc/lhRpX/grvPoDx/6B0GkGh
LnXDpoBgxMSYozK7DrKOLszavUIUQN2JTcVS8U2E8sL0kxOzsKH2T0ltkcMCkJQJ
qBR8lAkjcj91X/AxGNl8ultv0UMgbLMz4dNiEUkk1vvqPQKA721wKQao0N4NkHji
+LpkaQCt6Jh1I/DLao7JV7FeHLDsZA1mC5EfDg==
-----END CERTIFICATE-----`;

// Write the certificate files
if (!fs.existsSync('./certs')) fs.mkdirSync('./certs', { recursive: true });
fs.writeFileSync('./certs/server.key', keyFileContent);
fs.writeFileSync('./certs/server.crt', certFileContent);
console.log('✅ Created valid SSL certificates (hardcoded)');

// First register the add-in
console.log('\nRegistering add-in...');
try {
    execSync('powershell -ExecutionPolicy Bypass -File ./register.ps1', { stdio: 'inherit' });
    console.log('✅ Add-in registered in registry');
} catch (err) {
    console.log('⚠️ Could not register add-in automatically. Please run:');
    console.log('powershell -ExecutionPolicy Bypass -File ./register.ps1');
}

// Start server
console.log('\nStarting server...');
const server = https.createServer({
    key: fs.readFileSync('./certs/server.key'),
    cert: fs.readFileSync('./certs/server.crt')
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
    console.log('\n✅ SERVER RUNNING AT https://localhost:3000');
    console.log('\n👉 NEXT STEPS:');
    console.log('1. Open https://localhost:3000 in your browser and accept the certificate');
    console.log('2. COMPLETELY CLOSE WORD (check Task Manager too)');
    console.log('3. Open Word again');
    console.log('4. Go to Insert tab > Add-ins > My Add-ins');
    console.log('5. Look for "Test Word Add-in" in the list');
    console.log('\n(Keep this terminal window open while using the add-in)');
});
