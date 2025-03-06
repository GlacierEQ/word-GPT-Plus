# Word GPT Plus - Installation Guide

This guide will help you install and set up Word GPT Plus, the advanced AI assistant for Microsoft Word.

## System Requirements

- **Microsoft Word**: Office 2016 or later (Windows/macOS)
- **Operating System**: Windows 10/11 or macOS 10.14+
- **Internet Connection**: Required for API communication
- **Node.js**: v12.0.0 or later (for development and custom installation)

## Installation Methods

Choose one of the following installation methods:

### Method 1: Automated Installation (Recommended)

1. **Download the Installation Package**
   - Download the latest release package from the [Releases Page](https://github.com/username/word-GPT-Plus/releases)
   - Extract the ZIP file to a location of your choice

2. **Run the Installation Script**
   - Windows: Right-click on `install.bat` and select "Run as Administrator"
   - macOS: Open Terminal, navigate to the extracted folder, and run `sudo bash install.sh`

3. **Follow On-Screen Instructions**
   - Enter your API key when prompted (you can skip this step and configure later)
   - The installation script will automatically:
     - Install required dependencies
     - Configure API settings
     - Register the add-in with Microsoft Word
     - Create necessary shortcuts

4. **Verify Installation**
   - Open Microsoft Word
   - You should see Word GPT Plus in the ribbon under the "Home" tab

### Method 2: Manual Installation

#### Windows

1. **Enable Developer Mode in Word**
   - Open Word > File > Options > Trust Center > Trust Center Settings
   - Click "Trust Access to the VBA Project Object Model"
   - Click "Enable all macros"
   - Click "Trust access to the Office object model"

2. **Install the Add-In**
   - Navigate to File > Options > Add-ins
   - At the bottom, change the dropdown to "COM Add-ins" and click "Go..."
   - Click "Add..." and browse to the location of `WordGPTPlus.dll`
   - Check the box next to "Word GPT Plus" and click OK

#### macOS

1. **Enable Developer Mode in Word**
   - Open Word > Tools > Templates and Add-ins
   - Check "Trust access to the VBA project object model"
   - Click OK

2. **Install the Add-In**
   - Open Word > Insert > Add-ins > My Add-ins
   - Click "Manage Add-ins" and select "Add Custom Add-in"
   - Browse to the location of the extracted files and select `Manifest.xml`
   - Click "Open" and then "Trust This Add-in"

### Method 3: Developer Installation

For developers who want to customize or extend the add-in:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/username/word-GPT-Plus.git
   cd word-GPT-Plus
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

4. **Install for Development**
   ```bash
   npm run dev-install
   ```

## API Configuration

Word GPT Plus requires an API key to access AI services.

1. **Get an API Key**
   - Sign up at [API Provider Website](https://api-provider.com)
   - Navigate to your account dashboard
   - Generate a new API key for Word GPT Plus

2. **Configure the API Key**
   - Open Word GPT Plus in Microsoft Word
   - Click the "Settings" button in the bottom panel
   - Enter your API key in the "API Configuration" section
   - Click "Save Settings"

## Troubleshooting

### Common Issues

1. **Add-in Not Appearing in Word**
   - Ensure Word is completely closed and restarted after installation
   - Check if the add-in is disabled: File > Options > Add-ins > Manage: COM Add-ins > Go
   - Try reinstalling the add-in

2. **API Connection Errors**
   - Verify your API key is correctly entered in Settings
   - Check your internet connection
   - Ensure firewall settings allow the add-in to connect to the API

3. **Performance Issues**
   - Check if you have sufficient memory available
   - Close unused applications and Word documents
   - Restart Word and try again

### Installation Logs

If you encounter issues during installation, check the logs:

- Windows: `C:\Users\[Username]\AppData\Local\WordGPTPlus\logs\install.log`
- macOS: `/Users/[Username]/Library/Logs/WordGPTPlus/install.log`

### Getting Support

If you need additional help, please:

1. Check our [Troubleshooting Guide](https://example.com/troubleshooting)
2. Visit our [Support Forum](https://example.com/forum)
3. Contact our support team: support@wordgptplus.com

## Uninstallation

### Windows

1. Open Control Panel > Programs > Programs and Features
2. Select "Word GPT Plus" and click "Uninstall"
3. Follow the uninstallation wizard

### macOS

1. Open Word > Insert > My Add-ins
2. Right-click on Word GPT Plus and select "Remove Add-in"
3. Delete the application folder from your Applications directory

## Next Steps

After installation:

1. Review the [Quick Start Guide](./quick-start-guide.md)
2. Explore [Advanced Features](./advanced-features.md)
3. Check out [Integration Options](./integration-options.md)

Thank you for installing Word GPT Plus!
