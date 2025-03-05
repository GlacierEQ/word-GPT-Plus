# Word-GPT-Plus Build Guide

## Development Build

For development and testing:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Production Build

For production deployment:

```bash
# Build for production
npm run build

# Package for distribution
npm run package
```

The production build will be in the `dist` directory.

## Docker Build

A Docker build is also available:

```bash
# Build Docker image
docker build -t word-gpt-plus .

# Run Docker container
docker run -p 3000:80 word-gpt-plus
```

## Manifest Configuration

Before deploying or sideloading, update the `manifest.xml` file:

1. Set your add-in ID
2. Configure proper icon paths
3. Update permissions as needed
4. Set appropriate endpoint URLs

## Sideloading in Word Online

1. Open Word Online
2. Go to Insert > Add-ins > Manage My Add-ins > Upload My Add-in
3. Upload the manifest.xml file

## Office Store Submission

For Office Store submission:

1. Run validation checks:
   ```
   npm run validate
   ```

2. Package the add-in:
   ```
   npm run package
   ```

3. Submit the package to the Office Store through the Partner Center

## Troubleshooting Build Issues

### Node Version Issues
Ensure you're using Node.js 18.x or higher. Use nvm to manage Node versions:

```bash
nvm install 18
nvm use 18
```

### Dependency Issues
If you encounter dependency issues:

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Build Failures
If build fails with TypeScript errors:

```bash
# Run type checking separately
npm run typecheck

# Force build (ignore type errors)
npm run build:force
```
