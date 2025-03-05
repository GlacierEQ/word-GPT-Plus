/**
 * Creates self-signed SSL certificates for development
 * Required for Office Add-ins to work with HTTPS
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const forge = require('node-forge');

// Project root directory
const rootDir = path.resolve(__dirname, '..');
const certsDir = path.join(rootDir, 'certs');
const certPath = path.join(certsDir, 'localhost.crt');
const keyPath = path.join(certsDir, 'localhost.key');
const pfxPath = path.join(certsDir, 'localhost.pfx');

// Create certificates directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
}

/**
 * Generate certificates using node-forge
 */
function generateCertificates() {
    console.log('Generating SSL certificates...');

    try {
        // Generate a key pair
        const keys = forge.pki.rsa.generateKeyPair(2048);

        // Create a certificate
        const cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = '01';
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

        // Set certificate attributes
        const attrs = [
            { name: 'commonName', value: 'localhost' },
            { name: 'countryName', value: 'US' },
            { name: 'stateOrProvinceName', value: 'Hawaii' },
            { name: 'localityName', value: 'Honolulu' },
            { name: 'organizationName', value: 'Word-GPT-Plus' },
            { name: 'organizationalUnitName', value: 'Development' }
        ];
        cert.setSubject(attrs);
        cert.setIssuer(attrs);

        // Set certificate extensions
        cert.setExtensions([
            {
                name: 'basicConstraints',
                cA: false
            },
            {
                name: 'keyUsage',
                digitalSignature: true,
                keyEncipherment: true,
                dataEncipherment: true
            },
            {
                name: 'subjectAltName',
                altNames: [
                    { type: 2, value: 'localhost' },
                    { type: 7, ip: '127.0.0.1' }
                ]
            }
        ]);

        // Sign the certificate
        cert.sign(keys.privateKey, forge.md.sha256.create());

        // Convert to PEM format
        const certPem = forge.pki.certificateToPem(cert);
        const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

        // Write files
        fs.writeFileSync(certPath, certPem);
        fs.writeFileSync(keyPath, keyPem);

        console.log(`Certificates created: ${certPath}, ${keyPath}`);

        // Create PFX file for Windows
        createPfxFile(certPem, keyPem);

        // Trust the certificate on appropriate platform
        trustCertificate();

        return true;
    } catch (error) {
        console.error('Error generating certificates:', error);
        return false;
    }
}

/**
 * Create PFX file from cert and key for Windows
 */
function createPfxFile(certPem, keyPem) {
    try {
        // Parse the certificate and private key
        const cert = forge.pki.certificateFromPem(certPem);
        const key = forge.pki.privateKeyFromPem(keyPem);

        // Create PKCS12 (PFX)
        const pkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
            key,
            [cert],
            'password', // Password for the PFX
            { generateLocalKeyId: true, friendlyName: 'localhost' }
        );

        // Convert to binary
        const pkcs12Der = forge.asn1.toDer(pkcs12Asn1).getBytes();

        // Write PFX file
        fs.writeFileSync(pfxPath, Buffer.from(pkcs12Der, 'binary'));

        console.log(`PFX file created: ${pfxPath}`);
        return true;
    } catch (error) {
        console.error('Error creating PFX file:', error);
        return false;
    }
}

/**
 * Trust the certificate on the current platform
 */
function trustCertificate() {
    const platform = process.platform;

    try {
        if (platform === 'win32') {
            console.log('Trusting certificate on Windows...');
            // PowerShell command to import and trust the certificate
            const psCommand = `
        $pfxPath = "${pfxPath.replace(/\\/g, '\\\\')}";
        $pfxPassword = ConvertTo-SecureString -String "password" -Force -AsPlainText;
        
        # Import to trusted root
        Import-PfxCertificate -FilePath $pfxPath -CertStoreLocation Cert:\\LocalMachine\\Root -Password $pfxPassword;
        
        Write-Host "Certificate trusted successfully";
      `;

            // Execute PowerShell command with elevation
            const result = execSync(`powershell -Command "Start-Process powershell -ArgumentList '-Command ${psCommand.replace(/\n/g, ' ').replace(/"/g, '\\"')}' -Verb RunAs -Wait"`);
            console.log(result.toString());

        } else if (platform === 'darwin') {
            console.log('Trusting certificate on macOS...');
            // macOS command to add certificate to keychain
            execSync(`sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${certPath}"`);
            console.log('Certificate trusted successfully');

        } else {
            console.log(`Certificate trust not implemented for platform: ${platform}`);
            console.log('You may need to manually trust the certificate');
        }

        return true;
    } catch (error) {
        console.error(`Error trusting certificate on ${platform}:`, error.message);
        console.log('You may need to manually trust the certificate');
        return false;
    }
}

// Run the certificate generation
generateCertificates();