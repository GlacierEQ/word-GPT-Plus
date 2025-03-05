const { exec } = require('child_process');

console.log('Running the installer...');

// Install dependencies
console.log('Installing dependencies...');
exec('npm install', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error installing dependencies: ${error}`);
        return;
    }
    console.log(`Dependencies installed successfully:\n${stdout}`);

    // Build the project
    console.log('Building the project...');
    exec('npm run build', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error building the project: ${error}`);
            return;
        }
        console.log(`Project built successfully:\n${stdout}`);

        console.log('Installation complete!');
    });
});
