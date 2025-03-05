const https = require('https');
const fs = require('fs');
const path = require('path');

// Check for certificates, create if not existing
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
}

const keyPath = path.join(certsDir, 'localhost.key');
const certPath = path.join(certsDir, 'localhost.crt');

// Generate self-signed cert if needed
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('Generating self-signed certificate...');

    const { execSync } = require('child_process');
    try {
        execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`, { stdio: 'inherit' });
    } catch (error) {
        console.error('Failed to generate certificates:', error);
        console.log('Please install OpenSSL and try again or manually create certificates');
        process.exit(1);
    }
}

// Create a minimal taskpane.html file
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

const taskpanePath = path.join(distDir, 'taskpane.html');
if (!fs.existsSync(taskpanePath)) {
    const taskpaneContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
  <title>Word-GPT-Plus Basic Test</title>
  <script src="https://appsforoffice.microsoft.com/lib/1.1/hosted/office.js"></script>
  <script>
    Office.onReady(function() {
      document.getElementById('status').textContent = 'Office.js is loaded!';
    });
    
    function insertText() {
      Office.context.document.setSelectedDataAsync(
        'Hello from Word-GPT-Plus!',
        function (asyncResult) {
          if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
            document.getElementById('result').textContent = 'Text inserted successfully!';
          } else {
            document.getElementById('result').textContent = 'Error: ' + asyncResult.error.message;
          }
        }
      );
    }
  </script>
  <style>
    body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
    button { padding: 10px; margin-top: 20px; }
    .success { color: green; }
    .status { margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>Word-GPT-Plus</h1>
  <div class="status">Status: <span id="status">Office.js not loaded yet</span></div>
  <button onclick="insertText()">Test: Insert Text</button>
  <div id="result"></div>
</body>
</html>`;

    fs.writeFileSync(taskpanePath, taskpaneContent);
}

// Create commands.html
const commandsPath = path.join(distDir, 'commands.html');
if (!fs.existsSync(commandsPath)) {
    const commandsContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
  <title>Commands</title>
  <script src="https://appsforoffice.microsoft.com/lib/1.1/hosted/office.js"></script>
  <script>
    Office.onReady(function() {
      // Register command handlers
    });
    
    function showTaskpane(event) {
      Office.addin.showAsTaskpane();
      event.completed();
    }
    
    // Add command handlers
    Office.actions.associate("showTaskpane", showTaskpane);
  </script>
</head>
<body>
  <!-- Commands are handled via JavaScript -->
</body>
</html>`;

    fs.writeFileSync(commandsPath, commandsContent);
}

// Create the server
const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
};

const server = https.createServer(options, (req, res) => {
    console.log(`${new Date().toISOString()} - Request for ${req.url}`);

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './dist/taskpane.html';
    } else {
        filePath = './dist' + req.url;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.ico': 'image/x-icon'
    };

    const contentType = contentTypes[extname] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found: ' + filePath);
            } else {
                res.writeHead(500);
                res.end('500 Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\n✅ Server running at https://localhost:${PORT}/`);
    console.log('\nYou can now:');
    console.log('1. Run "node register-addin.js" to register the add-in in Word');
    console.log('2. Open Word and check for Word-GPT-Plus in the My Add-ins section\n');
});
