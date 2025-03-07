# Word GPT Plus Initial Setup Guide

This guide covers how to set up your development environment and start working with Word GPT Plus.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 14.x or later)
- npm (usually comes with Node.js)
- Git
- Visual Studio Code (recommended) or your preferred code editor
- Microsoft Office (Word) installed locally

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/casey/word-GPT-Plus.git
cd word-GPT-Plus
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Development Certificates

Office Add-ins require HTTPS, even during development. Generate the necessary certificates:

```bash
npm run certificates
```

This will create:
- `localhost.crt` - The certificate
- `localhost.key` - The private key

If prompted to install the certificate, follow the instructions to add it to your trusted certificates.

### 4. Start the Development Server

```bash
npm run dev
```

This will:
- Build the project in development mode
- Start a local HTTPS server on port 3000
- Watch for file changes

### 5. Sideload the Add-in in Word

To test the add-in in Word, you need to sideload it:

#### Option A: Using the Sideloading Script (Recommended)

```bash
npm run sideload
```

This script will register the add-in in Word.

#### Option B: Manual Sideloading

1. Open Word
2. Go to Insert > Add-ins > My Add-ins > Manage My Add-ins > Upload My Add-in
3. Browse to the project folder and select `manifest.xml`
4. Click "Open"

### 6. Project Organization

The project follows this structure:

- `src/` - Source code
  - `core/` - Core functionality
  - `api/` - API integration
  - `ui/` - User interface components
  - `models/` - Data models
  - `utils/` - Utilities
  - `security/` - Security components
- `dist/` - Build output (generated)
- `tests/` - Test files
- `config/` - Configuration files
- `docs/` - Documentation
- `scripts/` - Development scripts

### 7. Running Tests

```bash
npm test
```

This will run all Jest tests in the `tests/` directory.

### 8. Building for Production

```bash
npm run build
```

This creates a production build in the `dist/` directory.

### 9. Creating a Deployment Package

```bash
npm run deploy
```

This creates a deployment package in the `deployment/` directory.

## Troubleshooting

### Certificate Issues

If you see certificate warnings:

1. Make sure you ran `npm run certificates`
2. Check if the certificate was properly installed in your trusted root certificates
3. Try running:
   ```
   npx office-addin-dev-certs verify
   ```

### Add-in Not Loading

If the add-in doesn't appear in Word:

1. Check that the development server is running (`npm run dev`)
2. Verify the manifest is properly sideloaded
3. Look for errors in the browser console (F12 in Word Online)
4. Try clearing the Office cache:
   - On Windows: Delete the contents of `%LOCALAPPDATA%\Microsoft\Office\16.0\Wef\`
   - On Mac: Delete the contents of `~/Library/Containers/com.microsoft.Word/Data/Library/Caches/`
   
### Build Errors

If you encounter build errors:

1. Make sure you have the correct Node.js version
2. Delete `node_modules` folder and run `npm install` again
3. Check for syntax errors in your code

## Next Steps

Once your environment is set up:

1. Review the Component Integration documentation to understand how the system fits together
2. Look at the existing code in `src/` to get familiar with the architecture
3. Try modifying a component and see your changes in Word
