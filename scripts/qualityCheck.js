/**
 * Word GPT Plus - Quality Check Script
 * Performs comprehensive quality checks before release
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ESLint } = require('eslint');
const chalk = require('chalk');

// Import quality standards
const qualityStandards = require('../tests/quality-standards');

// Configuration
const config = {
    buildDir: path.resolve(__dirname, '../dist'),
    srcDir: path.resolve(__dirname, '../src'),
    docsDir: path.resolve(__dirname, '../docs'),
    manifestPath: path.resolve(__dirname, '../Manifest.xml'),
    packageJson: require('../package.json'),
    thresholds: {
        eslintErrorsMax: 0,
        eslintWarningsMax: 5,
        bundleSizeMax: 500 * 1024, // 500KB
        testCoverageMin: 60, // 60%
        documentationCoverageMin: 70 // 70%
    }
};

// Results summary
const results = {
    passed: true,
    summary: {
        eslint: { errors: 0, warnings: 0 },
        tests: { passed: 0, failed: 0, coverage: 0 },
        bundle: { size: 0, maxSize: config.thresholds.bundleSizeMax },
        documentation: { coverage: 0 },
        accessibility: { violations: 0, warnings: 0 }
    },
    details: {}
};

/**
 * Run all quality checks
 */
async function runQualityChecks() {
    console.log(chalk.blue('🔍 Running quality checks for Word GPT Plus...'));

    try {
        // Run checks in sequence
        await lintCode();
        await checkTests();
        await analyzeBundleSize();
        await checkDocumentation();
        await validateManifest();
        await checkAccessibility();

        // Output results
        outputResults();

        if (!results.passed) {
            process.exit(1);
        }
    } catch (error) {
        console.error(chalk.red('❌ Quality check failed with an error:'));
        console.error(error);
        process.exit(1);
    }
}

/**
 * Run ESLint on source code
 */
async function lintCode() {
    console.log(chalk.blue('\n📊 Checking code quality with ESLint...'));

    const eslint = new ESLint();
    const resultData = await eslint.lintFiles([`${config.srcDir}/**/*.js`]);

    let errors = 0;
    let warnings = 0;
    let issues = [];

    resultData.forEach(result => {
        result.messages.forEach(msg => {
            if (msg.severity === 2) errors++;
            if (msg.severity === 1) warnings++;

            issues.push({
                filePath: path.relative(process.cwd(), result.filePath),
                line: msg.line,
                column: msg.column,
                severity: msg.severity === 2 ? 'error' : 'warning',
                message: msg.message,
                rule: msg.ruleId
            });
        });
    });

    results.summary.eslint.errors = errors;
    results.summary.eslint.warnings = warnings;
    results.details.eslint = { issues };

    // Check against thresholds
    if (errors > config.thresholds.eslintErrorsMax) {
        results.passed = false;
        console.log(chalk.red(`❌ ESLint check failed: ${errors} error(s) found (threshold: ${config.thresholds.eslintErrorsMax})`));
    } else if (warnings > config.thresholds.eslintWarningsMax) {
        console.log(chalk.yellow(`⚠️ ESLint warnings exceeded: ${warnings} warnings found (threshold: ${config.thresholds.eslintWarningsMax})`));
    } else {
        console.log(chalk.green(`✅ ESLint check passed: ${errors} error(s), ${warnings} warning(s)`));
    }
}

/**
 * Check test results and coverage
 */
async function checkTests() {
    console.log(chalk.blue('\n🧪 Checking test results and coverage...'));

    try {
        // Run tests
        execSync('npm test -- --silent', { stdio: 'pipe' });

        // Parse coverage report
        const coveragePath = path.resolve(__dirname, '../coverage/coverage-summary.json');
        if (fs.existsSync(coveragePath)) {
            const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
            const totalCoverage = coverageData.total.lines.pct;

            results.summary.tests.coverage = totalCoverage;
            results.details.tests = { coverage: coverageData };

            if (totalCoverage < config.thresholds.testCoverageMin) {
                console.log(chalk.yellow(`⚠️ Test coverage below threshold: ${totalCoverage}% (threshold: ${config.thresholds.testCoverageMin}%)`));
            } else {
                console.log(chalk.green(`✅ Test coverage meets threshold: ${totalCoverage}% (threshold: ${config.thresholds.testCoverageMin}%)`));
            }
        } else {
            console.log(chalk.yellow('⚠️ Could not find coverage report'));
        }

        console.log(chalk.green('✅ All tests passed'));
    } catch (error) {
        results.passed = false;
        results.summary.tests.failed = 1;
        console.log(chalk.red('❌ Some tests failed'));
    }
}

/**
 * Analyze bundle size
 */
async function analyzeBundleSize() {
    console.log(chalk.blue('\n📦 Analyzing bundle size...'));

    const bundleDir = config.buildDir;

    if (!fs.existsSync(bundleDir)) {
        console.log(chalk.yellow('⚠️ Build directory not found, skipping bundle analysis'));
        return;
    }

    let totalSize = 0;
    const fileSizes = [];

    // Get JavaScript files
    const files = fs.readdirSync(bundleDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(bundleDir, file));

    // Calculate size
    for (const file of files) {
        const stats = fs.statSync(file);
        totalSize += stats.size;

        fileSizes.push({
            name: path.basename(file),
            size: stats.size,
            sizeKB: Math.round(stats.size / 1024 * 10) / 10
        });
    }

    results.summary.bundle.size = totalSize;
    results.details.bundle = { files: fileSizes };

    if (totalSize > config.thresholds.bundleSizeMax) {
        results.passed = false;
        console.log(chalk.red(`❌ Bundle size exceeds maximum: ${Math.round(totalSize / 1024)}KB (max: ${Math.round(config.thresholds.bundleSizeMax / 1024)}KB)`));
    } else {
        console.log(chalk.green(`✅ Bundle size within limits: ${Math.round(totalSize / 1024)}KB (max: ${Math.round(config.thresholds.bundleSizeMax / 1024)}KB)`));
    }

    // Log largest files
    fileSizes.sort((a, b) => b.size - a.size);
    console.log(chalk.blue('  Largest files:'));
    fileSizes.slice(0, 5).forEach(file => {
        console.log(chalk.blue(`  - ${file.name}: ${file.sizeKB}KB`));
    });
}

/**
 * Check documentation coverage
 */
async function checkDocumentation() {
    console.log(chalk.blue('\n📝 Checking documentation coverage...'));

    const docsDir = config.docsDir;
    const srcFiles = glob(path.join(config.srcDir, '**', '*.js'));

    if (!fs.existsSync(docsDir)) {
        console.log(chalk.yellow('⚠️ Documentation directory not found'));
        return;
    }

    // Check essential documentation files
    const essentialDocs = [
        'installation-guide.md',
        'quality-standards.md',
        'README.md'
    ];

    const missingDocs = essentialDocs.filter(doc =>
        !fs.existsSync(path.join(docsDir, doc)) &&
        !fs.existsSync(path.join(__dirname, '..', doc))
    );

    if (missingDocs.length > 0) {
        console.log(chalk.yellow(`⚠️ Missing essential documentation: ${missingDocs.join(', ')}`));
    }

    // Check if source files have JSDoc comments
    let docCount = 0;
    let totalFunctions = 0;

    for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const docResult = qualityStandards.checkDocumentation(content);
        docCount += docResult.documentedFunctions;
        totalFunctions += docResult.totalFunctions;
    }

    const docPercentage = totalFunctions ? Math.round((docCount / totalFunctions) * 100) : 100;
    results.summary.documentation.coverage = docPercentage;

    if (docPercentage < config.thresholds.documentationCoverageMin) {
        console.log(chalk.yellow(`⚠️ Documentation coverage below threshold: ${docPercentage}% (threshold: ${config.thresholds.documentationCoverageMin}%)`));
    } else {
        console.log(chalk.green(`✅ Documentation coverage meets threshold: ${docPercentage}% (threshold: ${config.thresholds.documentationCoverageMin}%)`));
    }
}

/**
 * Validate manifest
 */
async function validateManifest() {
    console.log(chalk.blue('\n📋 Validating manifest...'));

    if (!fs.existsSync(config.manifestPath)) {
        console.log(chalk.yellow('⚠️ Manifest file not found'));
        return;
    }

    try {
        // Use office-addin-manifest validator if available
        execSync('npx office-addin-manifest validate -m Manifest.xml', { stdio: 'pipe' });
        console.log(chalk.green('✅ Manifest validation passed'));
    } catch (error) {
        // If validator fails, perform basic checks
        const manifestContent = fs.readFileSync(config.manifestPath, 'utf8');

        const requiredElements = [
            '<ProviderName>',
            '<DisplayName',
            '<Description',
            '<DefaultLocale>',
            '<Version>',
            '<Host Name'
        ];

        const missingElements = requiredElements.filter(element => !manifestContent.includes(element));

        if (missingElements.length > 0) {
            results.passed = false;
            console.log(chalk.red(`❌ Manifest missing required elements: ${missingElements.join(', ')}`));
        } else {
            console.log(chalk.yellow('⚠️ Basic manifest validation passed, but official validator failed'));
        }
    }
}

/**
 * Check accessibility
 */
async function checkAccessibility() {
    console.log(chalk.blue('\n♿ Checking accessibility...'));

    const htmlFiles = [
        ...glob(path.join(config.srcDir, '**', '*.html')),
        ...glob(path.join(config.buildDir, '**', '*.html'))
    ];

    if (htmlFiles.length === 0) {
        console.log(chalk.yellow('⚠️ No HTML files found to check'));
        return;
    }

    let violations = 0;
    let warnings = 0;

    // Check each HTML file for basic accessibility features
    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const fileViolations = [];

        // Check for lang attribute in HTML tag
        if (!content.match(/<html[^>]*lang=/)) {
            fileViolations.push('Missing lang attribute on HTML tag');
        }

        // Check img tags for alt attributes
        const imgTags = content.match(/<img[^>]*>/g) || [];
        for (const img of imgTags) {
            if (!img.includes('alt=')) {
                fileViolations.push('Image missing alt attribute');
                violations++;
            }
        }

        // Check for proper heading structure
        if (content.includes('<h2') && !content.includes('<h1')) {
            fileViolations.push('Using h2 without h1');
            warnings++;
        }

        // Check for sufficient color contrast (simple check)
        if (content.includes('color: #ccc') || content.includes('color: #ddd')) {
            fileViolations.push('Potential low contrast text colors');
            warnings++;
        }

        // Report file-specific issues
        if (fileViolations.length > 0) {
            console.log(chalk.yellow(`  Issues in ${path.basename(file)}:`));
            fileViolations.forEach(issue => {
                console.log(chalk.yellow(`  - ${issue}`));
            });
        }
    }

    results.summary.accessibility.violations = violations;
    results.summary.accessibility.warnings = warnings;

    if (violations > 0) {
        results.passed = false;
        console.log(chalk.red(`❌ Accessibility check failed: ${violations} violation(s) found`));
    } else if (warnings > 0) {
        console.log(chalk.yellow(`⚠️ Accessibility check passed with ${warnings} warning(s)`));
    } else {
        console.log(chalk.green('✅ Accessibility check passed with no issues'));
    }
}

/**
 * Output quality check results
 */
function outputResults() {
    console.log(chalk.blue('\n📊 Quality Check Summary:'));

    const result = results.passed ? chalk.green('PASSED') : chalk.red('FAILED');
    console.log(`Overall Result: ${result}`);

    console.log('\nDetailed Results:');
    console.log(`- ESLint: ${results.summary.eslint.errors} errors, ${results.summary.eslint.warnings} warnings`);
    console.log(`- Tests: Coverage ${results.summary.tests.coverage}%`);
    console.log(`- Bundle Size: ${Math.round(results.summary.bundle.size / 1024)}KB / ${Math.round(results.summary.bundle.maxSize / 1024)}KB`);
    console.log(`- Documentation: ${results.summary.documentation.coverage}% coverage`);
    console.log(`- Accessibility: ${results.summary.accessibility.violations} violations, ${results.summary.accessibility.warnings} warnings`);

    // Save results to file
    const reportPath = path.join(__dirname, '../quality-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(chalk.blue(`\nDetailed report saved to: ${reportPath}`));
}

/**
 * Simple glob implementation
 */
function glob(pattern) {
    const basePath = pattern.split('*')[0];
    const extension = path.extname(pattern);
    const results = [];

    if (!fs.existsSync(basePath)) {
        return [];
    }

    function traverse(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                traverse(filePath);
            } else if (file.endsWith(extension)) {
                results.push(filePath);
            }
        }
    }

    traverse(basePath);
    return results;
}

// Run the quality checks
runQualityChecks();
