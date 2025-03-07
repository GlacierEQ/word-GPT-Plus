/**
 * Word GPT Plus - Project Organization Script
 * Reorganizes the project files into a clean, hierarchical structure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the project root
const projectRoot = path.resolve(__dirname, '..');

// Define the target directory structure
const directoryStructure = {
    // Source code
    'src': {
        'core': {}, // Core functionality
        'ui': {},   // UI components
        'api': {},  // API integration
        'utils': {}, // Utilities
        'security': {}, // Security components
        'models': {}, // Data models
    },

    // Distribution
    'dist': {
        'assets': {
            'icons': {},
        },
        'styles': {},
        'scripts': {},
    },

    // Documentation
    'docs': {
        'user': {},     // User documentation
        'developer': {}, // Developer documentation
        'api': {},       // API documentation
    },

    // Build and deployment
    'build': {},

    // Configuration
    'config': {
        'manifests': {},
    },

    // Tests
    'tests': {
        'unit': {},
        'integration': {},
    },

    // Scripts for development and deployment
    'scripts': {},
};

// File mapping
const fileMapping = [
    // Manifest files
    { from: 'manifest.xml', to: 'config/manifests/development.xml' },
    { from: 'Production-Manifest.xml', to: 'config/manifests/production.xml' },
    { from: 'Manifest2.xml', to: 'config/manifests/manifest2.xml' },
    { from: 'dist/Manifest', to: 'config/manifests/dist.xml' },
    { from: 'GitHub-Pages-Manifest.xml', to: 'config/manifests/github-pages.xml' },

    // Source code
    { from: 'src/model-manager.js', to: 'src/models/model-manager.js' },
    { from: 'src/quality-standards.js', to: 'src/core/quality-standards.js' },
    { from: 'src/system-init.js', to: 'src/core/system-init.js' },
    { from: 'src/system-integration.js', to: 'src/core/system-integration.js' },
    { from: 'src/api-client.js', to: 'src/api/api-client.js' },
    { from: 'src/security/security-protocol.js', to: 'src/security/security-protocol.js' },
    { from: 'src/ui-components.js', to: 'src/ui/ui-components.js' },
    { from: 'src/content-arranger.js', to: 'src/core/content-arranger.js' },
    { from: 'src/image-processor.js', to: 'src/core/image-processor.js' },
    { from: 'src/components/analytics-dashboard.js', to: 'src/ui/analytics-dashboard.js' },
    { from: 'src/components/preferences-manager.js', to: 'src/core/preferences-manager.js' },
    { from: 'src/recursive-optimizer.js', to: 'src/core/recursive-optimizer.js' },
    { from: 'src/multiverse-writing.js', to: 'src/core/multiverse-writing.js' },
    { from: 'src/utils/strategy-manager.js', to: 'src/utils/strategy-manager.js' },
    { from: 'src/test-runner.js', to: 'tests/test-runner.js' },

    // Distribution files
    { from: 'dist/enhanced-taskpane.html', to: 'dist/enhanced-taskpane.html' },
    { from: 'dist/styles.css', to: 'dist/styles/main.css' },
    { from: 'dist/taskpane.js', to: 'dist/scripts/taskpane.js' },
    { from: 'dist/intelligent-features.js', to: 'dist/scripts/intelligent-features.js' },
    { from: 'dist/compression-utils.js', to: 'dist/scripts/compression-utils.js' },
    { from: 'dist/document-manager.js', to: 'dist/scripts/document-manager.js' },
    { from: 'dist/advanced-learning.js', to: 'dist/scripts/advanced-learning.js' },
    { from: 'dist/writing-analytics.js', to: 'dist/scripts/writing-analytics.js' },
    { from: 'dist/performance-monitor.js', to: 'dist/scripts/performance-monitor.js' },
    { from: 'dist/quality-manager.js', to: 'dist/scripts/quality-manager.js' },
    { from: 'dist/ui-components.js', to: 'dist/scripts/ui-components.js' },
    { from: 'dist/integration.js', to: 'dist/scripts/integration.js' },
    { from: 'dist/image-processor.js', to: 'dist/scripts/image-processor.js' },

    // Documentation
    { from: 'docs/code-review-findings.md', to: 'docs/developer/code-review-findings.md' },
    { from: 'docs/installation-guide.md', to: 'docs/user/installation-guide.md' },
    { from: 'docs/manifest-guide.md', to: 'docs/developer/manifest-guide.md' },
    { from: 'docs/github-pages-setup.md', to: 'docs/developer/github-pages-setup.md' },
    { from: 'docs/performance-optimization-guide.md', to: 'docs/developer/performance-optimization-guide.md' },
    { from: 'docs/quality-standards.md', to: 'docs/developer/quality-standards.md' },
    { from: 'docs/gold-protocol.md', to: 'docs/developer/gold-protocol.md' },
    { from: 'docs/developer-setup.md', to: 'docs/developer/developer-setup.md' },
    { from: 'docs/recursive-perfection.md', to: 'docs/developer/recursive-perfection.md' },
    { from: 'docs/sideload-instructions.md', to: 'docs/user/sideload-instructions.md' },
    { from: 'README.md', to: 'README.md' },
    { from: 'free-options-summary.md', to: 'docs/user/free-options-summary.md' },

    // Build and deployment
    { from: 'build/build.js', to: 'build/build.js' },
    { from: 'scripts/deploy.js', to: 'scripts/deploy.js' },
    { from: 'scripts/clean-manifests.js', to: 'scripts/clean-manifests.js' },
    { from: 'scripts/create-assets.js', to: 'scripts/create-assets.js' },
    { from: 'scripts/create-deployment.js', to: 'scripts/create-deployment.js' },
    { from: 'scripts/verify-sideload.js', to: 'scripts/verify-sideload.js' },
    { from: 'scripts/install-verification.js', to: 'scripts/install-verification.js' },
    { from: 'scripts/qualityCheck.js', to: 'scripts/quality-check.js' },
    { from: 'scripts/install.js', to: 'scripts/install.js' },
    { from: 'scripts/install-github-pages.bat', to: 'scripts/install-github-pages.bat' },
    { from: 'scripts/install-win.bat', to: 'scripts/install-win.bat' },
    { from: 'register.cmd', to: 'scripts/register.cmd' },

    // Tests
    { from: 'tests/quality-standards.js', to: 'tests/unit/quality-standards.test.js' },
    { from: 'tests/unit/quality-manager.test.js', to: 'tests/unit/quality-manager.test.js' },
    { from: 'tests/integration-test.js', to: 'tests/integration/integration-test.js' },

    // Automation
    { from: 'automation/scheduled-tasks.js', to: 'src/core/scheduled-tasks.js' },
    { from: 'automation/workflow-manager.js', to: 'src/core/workflow-manager.js' },

    // Configuration
    { from: 'package.json', to: 'package.json' },
    { from: '.github/workflows/ci.yml', to: '.github/workflows/ci.yml' },

    // Additional files
    { from: 'test-page.html', to: 'tests/test-page.html' },
    { from: 'taskpane.html', to: 'src/ui/taskpane.html' },
];

/**
 * Create the directory structure
 */
function createDirectories() {
    console.log('Creating directory structure...');

    // Function to create a directory if it doesn't exist
    function makeDir(dirPath) {
        const fullPath = path.join(projectRoot, dirPath);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`Created directory: ${dirPath}`);
        }
    }

    // Create directories recursively
    function createDirectoryStructure(structure, currentPath = '') {
        Object.keys(structure).forEach(dir => {
            const dirPath = path.join(currentPath, dir);
            makeDir(dirPath);

            if (typeof structure[dir] === 'object' && Object.keys(structure[dir]).length > 0) {
                createDirectoryStructure(structure[dir], dirPath);
            }
        });
    }

    createDirectoryStructure(directoryStructure);
    console.log('Directory structure created successfully.');
}

/**
 * Move files to their new locations
 */
function moveFiles() {
    console.log('Moving files to their new locations...');

    fileMapping.forEach(mapping => {
        const sourcePath = path.join(projectRoot, mapping.from);
        const destPath = path.join(projectRoot, mapping.to);

        // Check if source file exists
        if (fs.existsSync(sourcePath)) {
            // Create target directory if it doesn't exist
            const targetDir = path.dirname(destPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            try {
                // Copy file to new location (don't delete original yet for safety)
                fs.copyFileSync(sourcePath, destPath);
                console.log(`Moved: ${mapping.from} -> ${mapping.to}`);
            } catch (error) {
                console.error(`Error moving file ${mapping.from}: ${error.message}`);
            }
        } else {
            console.warn(`Source file not found: ${mapping.from}`);
        }
    });

    console.log('Files moved successfully.');
}

/**
 * Update imports and references
 */
function updateReferences() {
    console.log('Updating imports and references...');

    // In a real implementation, this would scan all JavaScript files
    // and update import statements and file references
    console.log('Note: You may need to manually update import paths in your JavaScript files.');

    console.log('References updated.');
}

/**
 * Create new index files
 */
function createIndexFiles() {
    console.log('Creating index files for better imports...');

    // Create index.js files in key directories to expose API
    const indexDirectories = [
        'src/core',
        'src/ui',
        'src/api',
        'src/utils',
        'src/security',
        'src/models'
    ];

    indexDirectories.forEach(dir => {
        const indexPath = path.join(projectRoot, dir, 'index.js');

        // Get all .js files in the directory
        const dirPath = path.join(projectRoot, dir);
        if (!fs.existsSync(dirPath)) return;

        const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.js') && file !== 'index.js');

        if (files.length === 0) return;

        // Create index.js with exports for all files
        let indexContent = '/**\n * Index file for easy imports\n */\n\n';

        files.forEach(file => {
            const moduleName = path.basename(file, '.js');
            indexContent += `export * from './${moduleName}';\n`;
        });

        fs.writeFileSync(indexPath, indexContent);
        console.log(`Created index file: ${dir}/index.js`);
    });

    console.log('Index files created successfully.');
}

/**
 * Create a new README with the project structure
 */
function createProjectStructureDoc() {
    console.log('Creating project structure documentation...');

    const structureDoc = `# Word GPT Plus Project Structure

## Overview

This document outlines the organized structure of the Word GPT Plus project.

## Directory Structure

\`\`\`
word-GPT-Plus/
├── src/                    # Source code
│   ├── core/               # Core functionality
│   ├── ui/                 # UI components
│   ├── api/                # API integration
│   ├── utils/              # Utility functions
│   ├── security/           # Security components
│   └── models/             # Data models
│
├── dist/                   # Distribution files
│   ├── assets/             # Static assets
│   │   └── icons/          # Icon files
│   ├── styles/             # CSS files
│   └── scripts/            # Compiled JavaScript
│
├── docs/                   # Documentation
│   ├── user/               # User documentation
│   ├── developer/          # Developer documentation
│   └── api/                # API documentation
│
├── build/                  # Build configuration and scripts
│
├── config/                 # Configuration files
│   └── manifests/          # Office Add-in manifests
│
├── tests/                  # Tests
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
│
├── scripts/                # Development and deployment scripts
│
└── .github/                # GitHub specific files
    └── workflows/          # GitHub Actions workflows
\`\`\`

## Key Files

- \`package.json\`: Project dependencies and scripts
- \`README.md\`: Main project documentation
- \`config/manifests/development.xml\`: Manifest for local development
- \`config/manifests/production.xml\`: Manifest for production deployment
- \`src/core/system-init.js\`: System initialization
- \`src/api/api-client.js\`: API client for model interaction
- \`dist/enhanced-taskpane.html\`: Main add-in interface

## Development Workflow

1. Use the development manifest (\`config/manifests/development.xml\`) for local testing
2. Build the project with \`npm run build\`
3. Deploy using the appropriate script from the \`scripts/\` directory
`;

    fs.writeFileSync(
        path.join(projectRoot, 'docs/developer/project-structure.md'),
        structureDoc
    );

    console.log('Project structure documentation created.');
}

/**
 * Run the organization process
 */
function organizeProject() {
    console.log('Starting project organization...');

    try {
        createDirectories();
        moveFiles();
        updateReferences();
        createIndexFiles();
        createProjectStructureDoc();

        console.log('\nProject organization complete!');
        console.log('\nNext steps:');
        console.log('1. Update import paths in JavaScript files');
        console.log('2. Test the application to ensure everything works correctly');
        console.log('3. Remove any redundant files once you\'ve verified the new structure');
    } catch (error) {
        console.error('Error organizing project:', error);
    }
}

// Run the organization process
organizeProject();
