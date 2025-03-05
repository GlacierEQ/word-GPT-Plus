# Troubleshooting Word Add-in Errors

## Common Add-in Loading Errors

### 1. CORS (Cross-Origin Resource Sharing) Errors

**Symptoms:** Add-in loads but shows error messages about CORS policies or "Access denied"

**Fix:**
- Ensure your server is properly configured to send CORS headers
- Add this to your server response headers:
  ```
  Access-Control-Allow-Origin: *
  ```

### 2. SSL Certificate Errors

**Symptoms:** Add-in fails to load with security errors

**Fix:**
- Make sure to visit https://localhost:3000/ in your browser first and accept the certificate
- Try creating new SSL certificates using this script:
  ```
  node create-cert.js
  ```
- Install certificates into your trusted root store:
  ```powershell
  Import-Certificate -FilePath "certs\localhost.crt" -CertStoreLocation Cert:\LocalMachine\Root
  ```

### 3. Registry Registration Issues

**Symptoms:** Add-in doesn't appear in the list or shows error when loading

**Fix:**
- Re-register with elevated permissions:
  ```powershell
  powershell -ExecutionPolicy Bypass -File register-simple.ps1 -RunAsAdmin
  ```
- Check your registry keys:
  ```powershell
  Get-ItemProperty -Path "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\"
  ```

### 4. HTML/JavaScript Errors

**Symptoms:** Add-in loads but doesn't function or shows blank page

**Fix:** Let's try a super simple HTML file that's guaranteed to work:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Minimal Add-in Test</title>
  <script src="https://appsforoffice.microsoft.com/lib/1.1/hosted/office.js"></script>
  <script>
    Office.onReady(function(info) {
      document.getElementById('status').textContent = 'Office is ready!';
      document.getElementById('platform').textContent = info.host + ' on ' + info.platform;
    });
    
    function insertText() {
      try {
        Office.context.document.setSelectedDataAsync('Hello from minimal add-in!',
          function(result) {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
              document.getElementById('result').textContent = 'Success!';
            } else {
              document.getElementById('result').textContent = 'Error: ' + result.error.message;
            }
          }
        );
      } catch(e) {
        document.getElementById('result').textContent = 'Exception: ' + e.message;
      }
    }
  </script>
</head>
<body style="padding:20px; font-family:Arial;">
  <h1>Minimal Add-in Test</h1>
  <div>Status: <span id="status">Loading Office.js...</span></div>
  <div>Platform: <span id="platform">Unknown</span></div>
  <button onclick="insertText()" style="margin-top:20px; padding:10px;">Insert Text</button>
  <div id="result" style="margin-top:10px;"></div>
</body>
</html>
```

## Office.js API Errors

If you see errors related to Office.js APIs:

1. Ensure you're using supported methods for your Office version
2. Check the permissions in your manifest.xml (should be ReadWriteDocument)
3. Check browser console for specific JavaScript errors

## Next Steps If Still Failing

1. Try with an incognito/private window in your browser
2. Reset Internet Explorer settings (Office uses IE components)
3. Clear Office cache and reinstall Office Add-ins
