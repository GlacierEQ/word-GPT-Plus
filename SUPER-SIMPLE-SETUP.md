# 🔥 SUPER SIMPLE WORD-GPT-PLUS SETUP 🔥

## Method 1: The Visual Studio Code Extension Method (EASIEST)

1. Install the "Office Addin Debugger" extension in VS Code
2. Open your project in VS Code
3. Right-click on the `manifest.xml` file
4. Select "Debug Office Add-in"
5. Select "Word" when prompted

This will:
- Start the server
- Register the add-in
- Open Word with the add-in loaded

## Method 2: The Command Line Method

Run these commands ONE AT A TIME:

```
npm install -g office-addin-dev-certs
office-addin-dev-certs install
npm run build
npx office-addin-debugging start manifest.xml
```

The last command should open Word with the add-in loaded.

## Method 3: "Brute Force" Method (When Nothing Else Works)

1. Run the server:
```
node basic-server.js
```

2. In a NEW PowerShell window (Run as Administrator):
```powershell
# Create temporary manifest file
$tempManifestPath = "$env:USERPROFILE\Desktop\test-manifest.xml"

@'
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp
    xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:type="TaskPaneApp">
    <Id>cf735245-102a-45fc-9c55-86a41692a2bf</Id>
    <Version>1.0.0</Version>
    <ProviderName>Test</ProviderName>
    <DefaultLocale>en-US</DefaultLocale>
    <DisplayName DefaultValue="TEST-ADDIN-FINDME" />
    <Description DefaultValue="Test Add-in"/>
    <DefaultSettings>
        <SourceLocation DefaultValue="https://localhost:3000/taskpane.html" />
    </DefaultSettings>
    <Hosts>
        <Host Name="Document" />
    </Hosts>
    <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>
'@ | Out-File -FilePath $tempManifestPath -Encoding UTF8

# Register in registry directly
$regPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer\"
if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
New-ItemProperty -Path $regPath -Name "TEST-ADDIN-FINDME" -Value $tempManifestPath -PropertyType String -Force | Out-Null

Write-Host "Add-in registered! Now close and restart Word" -ForegroundColor Green
```

3. COMPLETELY CLOSE WORD if it's open
4. Open Word and create a new document
5. Go to Insert tab
6. Find "Add-ins" or "My Add-ins" dropdown (look for puzzle piece icon)
7. Select "My Add-ins"
8. Look for "TEST-ADDIN-FINDME" tab in the dialog

## Method 4: The Sideload Method

1. Create a file called `manifest.xml` on your Desktop with this content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp
    xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:type="TaskPaneApp">
    <Id>cf735245-102a-45fc-9c55-86a41692a2bf</Id>
    <Version>1.0.0</Version>
    <ProviderName>Test</ProviderName>
    <DefaultLocale>en-US</DefaultLocale>
    <DisplayName DefaultValue="TEST-ADDIN-DESKTOP" />
    <Description DefaultValue="Test Add-in"/>
    <DefaultSettings>
        <SourceLocation DefaultValue="https://appsforoffice.microsoft.com/lib/1.1/hosted/office.js" />
    </DefaultSettings>
    <Hosts>
        <Host Name="Document" />
    </Hosts>
    <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>
```

2. Start the server:
```
node basic-server.js
```

3. In Word:
   - Go to Insert tab
   - Click "Add-ins" dropdown
   - Click "Upload Add-in"
   - Browse to the manifest.xml on your Desktop
   - Click "Upload"

## Method 5: The "I Don't Care About Local Development" Method

If you just want to use a pre-built version:

1. Download the Word-GPT-Plus add-in from the Microsoft AppSource:
   - [https://appsource.microsoft.com/en-us/product/office/WA200002589](https://appsource.microsoft.com/en-us/product/office/WA200002589)

2. Install it directly from AppSource and forget about local development

## 🚨 WHEN ALL ELSE FAILS 🚨

If nothing works, try this nuclear option:

1. Close Word completely

2. Run this in PowerShell as Administrator:
```powershell
# Clear Office cache
Remove-Item "$env:LOCALAPPDATA\Microsoft\Office\16.0\Wef\" -Recurse -Force -ErrorAction SilentlyContinue
```

3. Try Method 3 again

Still having issues? [Create an issue on GitHub](https://github.com/yourusername/word-gpt-plus/issues)
