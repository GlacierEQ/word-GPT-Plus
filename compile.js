const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparing to compile Word GPT Plus installer...');

// Check if pkg is installed
try {
    console.log('Checking for pkg compiler...');
    execSync('npm list -g pkg', { stdio: 'ignore' });
} catch (error) {
    console.log('Installing pkg compiler...');
    execSync('npm install -g pkg', { stdio: 'inherit' });
}

// Create a package.json for compilation
const pkgConfig = {
    name: "word-gpt-plus-installer",
    version: "1.0.0",
    description: "Installer for Word GPT Plus",
    main: "install.js",
    bin: "install.js",
    pkg: {
        targets: ["node18-win-x64"],
        outputPath: "dist"
    }
};

fs.writeFileSync('pkg-config.json', JSON.stringify(pkgConfig, null, 2));
console.log('Created temporary package configuration');

// Compile the executable
try {
    console.log('Compiling installer to executable...');
    execSync('pkg -c pkg-config.json install.js', { stdio: 'inherit' });

    // Move the executable to the main directory
    fs.copyFileSync(
        path.join(__dirname, 'dist', 'install-win-x64.exe'),
        path.join(__dirname, 'Word GPT Plus Installer.exe')
    );

    console.log('✅ Created "Word GPT Plus Installer.exe"');
} catch (error) {
    console.error('Failed to compile:', error.message);
} finally {
    // Clean up
    fs.unlinkSync('pkg-config.json');
}

// Create a ZIP file with essential files
console.log('Creating installation package...');
try {
    // We would typically use a library like AdmZip, but to keep dependencies minimal:
    const zipFiles = [
        'manifest.xml',
        'register-addin.ps1',
        'Install Word GPT Plus.bat',
        'Word GPT Plus Installer.exe',
        'dist/taskpane.html'
    ];

    console.log('Files to include in distribution:');
    zipFiles.forEach(file => console.log(`- ${file}`));

    console.log('\nTo create a ZIP distribution, you can manually zip these files or use a tool like 7-Zip.');
} catch (error) {
    console.error('Error preparing distribution:', error.message);
}

console.log('\n✅ Setup complete! You can distribute the installer in the following ways:');
console.log('1. Share "Word GPT Plus Installer.exe" directly');
console.log('2. Share "Install Word GPT Plus.bat" and the supporting files');
console.log('3. Create a ZIP file with all the files for complete distribution');
