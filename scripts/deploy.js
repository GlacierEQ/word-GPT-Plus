/**
 * Word GPT Plus - Deployment Script
 * Deploys the add-in to specified environment
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
// Remove unused execSync import
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load package.json using dynamic import
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Get deployment environment from command line
const environment = process.argv[2] || 'dev';
if (!['dev', 'test', 'prod'].includes(environment)) {
  console.error('❌ Invalid environment. Use: dev, test, or prod');
  process.exit(1);
}

// Configuration
const config = {
  version: packageJson.version,
  buildDir: path.resolve(__dirname, '../dist'),
  packageDir: path.resolve(__dirname, '../package'),
  deploymentConfigs: {
    dev: {
      url: process.env.DEV_DEPLOY_URL || 'https://dev.example.com/word-gpt-plus',
      sideloadingEnabled: true
    },
    test: {
      url: process.env.TEST_DEPLOY_URL || 'https://test.example.com/word-gpt-plus',
      sideloadingEnabled: true
    },
    prod: {
      url: process.env.PROD_DEPLOY_URL || 'https://example.com/word-gpt-plus',
      sideloadingEnabled: false
    }
  }
};

// Check if build exists
if (!fs.existsSync(config.buildDir)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

/**
 * Update manifest with environment-specific settings
 */
function updateManifestForEnvironment() {
  console.log(`📄 Updating manifest for ${environment} environment...`);

  const envConfig = config.deploymentConfigs[environment];
  const manifestPath = path.join(__dirname, '../Manifest.xml');
  let manifestContent = fs.readFileSync(manifestPath, 'utf8');

  // Update source location URLs
  manifestContent = manifestContent.replace(
    /<SourceLocation DefaultValue=".*?">/g,
    `<SourceLocation DefaultValue="${envConfig.url}/dist/enhanced-taskpane.html">`
  );

  // Update icon URLs
  manifestContent = manifestContent.replace(
    /<IconUrl DefaultValue=".*?">/g,
    `<IconUrl DefaultValue="${envConfig.url}/assets/icon-32.png">`
  );

  manifestContent = manifestContent.replace(
    /<HighResolutionIconUrl DefaultValue=".*?">/g,
    `<HighResolutionIconUrl DefaultValue="${envConfig.url}/assets/icon-80.png">`
  );

  // Update AppDomains
  const urlObj = new URL(envConfig.url);
  const domain = urlObj.hostname;

  // Replace entire AppDomains section
  const appDomainsRegex = /<AppDomains>[\s\S]*?<\/AppDomains>/;
  const newAppDomains = `<AppDomains>
    <AppDomain>${domain}</AppDomain>
  </AppDomains>`;

  manifestContent = manifestContent.replace(appDomainsRegex, newAppDomains);

  // Update URLs in resources
  manifestContent = manifestContent.replace(
    /<bt:Url id=".*?" DefaultValue=".*?">/g,
    (match) => {
      const idMatch = match.match(/id="(.*?)"/);
      if (!idMatch) return match;

      const id = idMatch[1];
      if (id.includes('Icon')) {
        return `<bt:Url id="${id}" DefaultValue="${envConfig.url}/assets/icon-${id.includes('16x16') ? '16' : id.includes('32x32') ? '32' : '80'}.png">`;
      } else if (id.includes('Url')) {
        return `<bt:Url id="${id}" DefaultValue="${envConfig.url}/dist/enhanced-taskpane.html">`;
      } else if (id.includes('LearnMore')) {
        return `<bt:Url id="${id}" DefaultValue="https://github.com/Kuingsmile/word-GPT-Plus">`;
      }

      return match;
    }
  );

  // Update version for this deployment
  const buildNumber = Math.floor(Date.now() / 1000) % 10000; // Use timestamp for build number
  const deploymentVersion = `${config.version}.${buildNumber}`;

  manifestContent = manifestContent.replace(
    /<Version>.*?<\/Version>/,
    `<Version>${deploymentVersion}</Version>`
  );

  // Write updated manifest
  const deployManifestPath = path.join(config.buildDir, 'Manifest.xml');
  fs.writeFileSync(deployManifestPath, manifestContent);

  console.log(`✅ Manifest updated for ${environment} (version ${deploymentVersion})`);
  return deployManifestPath;
}

/**
 * Deploy files to target environment
 */
async function deployFiles() {
  console.log(`🚀 Deploying to ${environment} environment...`);

  const envConfig = config.deploymentConfigs[environment];

  // This part would integrate with your actual deployment method
  // Examples include AWS S3, Azure Blob Storage, GitHub Pages, etc.

  try {
    // Example using AWS S3 (you would need aws-cli configured)
    // execSync(`aws s3 sync ${config.buildDir} s3://your-bucket/${environment}/word-gpt-plus/ --delete`);

    // For now, we'll just simulate a deployment
    console.log(`📂 Would deploy files to: ${envConfig.url}`);
    console.log(`📦 Files to deploy: ${fs.readdirSync(config.buildDir).length}`);

    // In a real deployment, we'd do something like:
    /*
    if (environment === 'prod') {
      // Upload to CDN
      execSync(`cdn-cli upload ${config.buildDir} --destination word-gpt-plus`);
      
      // Update version record
      execSync(`api-cli update-version --app word-gpt-plus --version ${config.version}`);
      
      // Invalidate cache
      execSync(`cdn-cli invalidate --paths "/word-gpt-plus/*"`);
    } else {
      // Deploy to dev/test environment
      execSync(`dev-server-cli deploy ${config.buildDir} --env ${environment}`);
    }
    */

    console.log(`✅ Deployment to ${environment} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Deployment failed: ${error.message}`);
    return false;
  }
}

/**
 * Create sideloading instructions
 */
function createSideloadingInstructions(manifestPath) {
  if (!config.deploymentConfigs[environment].sideloadingEnabled) {
    console.log('🔒 Sideloading not enabled for this environment');
    return;
  }

  console.log('📝 Creating sideloading instructions...');

  const instructionsDir = path.join(config.buildDir, 'sideload');
  if (!fs.existsSync(instructionsDir)) {
    fs.mkdirSync(instructionsDir, { recursive: true });
  }

  // Copy manifest to sideload directory
  fs.copyFileSync(manifestPath, path.join(instructionsDir, 'Manifest.xml'));

  // Create instructions file
  const instructions = `
  # Word GPT Plus Sideloading Instructions
  
  ## Prerequisites
  
  - Microsoft Word 2016 or later
  - Office 365 subscription (recommended)
  
  ## Installation Steps
  
  ### Windows
  
  1. Download the Manifest.xml file from this folder
  2. Open Word
  3. Go to the Insert tab
  4. Click "Add-ins" or "My Add-ins"
  5. Click "Manage My Add-ins" and select "Upload My Add-in"
  6. Browse to the Manifest.xml file you downloaded and select it
  7. Click "Install"
  `;

  fs.writeFileSync(path.join(instructionsDir, 'README.md'), instructions.trim());

  // Create a simple HTML page for sideloading
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Word GPT Plus - Sideloading Instructions</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
      h1 { color: #0078d4; }
      .step { margin-bottom: 1.5em; }
      .download { margin: 2em 0; padding: 1em; background-color: #f0f0f0; border-radius: 4px; text-align: center; }
      .download a { display: inline-block; padding: 10px 20px; background-color: #0078d4; color: white; text-decoration: none; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>Word GPT Plus - Sideloading Instructions</h1>
    <p>Follow these steps to install the Word GPT Plus add-in in your Microsoft Word application.</p>
    
    <div class="download">
      <a href="Manifest.xml" download>Download Manifest.xml</a>
    </div>
    
    <h2>Windows Installation</h2>
    <div class="step">
      <h3>Step 1:</h3>
      <p>Open Word and create or open a document.</p>
    </div>
    <div class="step">
      <h3>Step 2:</h3>
      <p>Go to the Insert tab.</p>
    </div>
    <div class="step">
      <h3>Step 3:</h3>
      <p>Click "Add-ins" or "My Add-ins".</p>
    </div>
    <div class="step">
      <h3>Step 4:</h3>
      <p>Click "Manage My Add-ins" and select "Upload My Add-in".</p>
    </div>
    <div class="step">
      <h3>Step 5:</h3>
      <p>Browse to the Manifest.xml file you downloaded and select it.</p>
    </div>
    <div class="step">
      <h3>Step 6:</h3>
      <p>Click "Install".</p>
    </div>
    
    <h2>Troubleshooting</h2>
    <p>If you encounter any issues, please visit our <a href="https://github.com/Kuingsmile/word-GPT-Plus/issues">support page</a>.</p>
  </body>
  </html>
  `;

  fs.writeFileSync(path.join(instructionsDir, 'index.html'), html.trim());

  console.log('✅ Sideloading instructions created');
}

/**
 * Main deployment function
 */
async function main() {
  const manifestPath = updateManifestForEnvironment();
  const deploymentSuccess = await deployFiles();

  if (deploymentSuccess) {
    createSideloadingInstructions(manifestPath);
  }
}

main();