/**
 * Monitors API usage against quotas
 * Helps prevent unexpected billing issues with OpenAI and other providers
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Check for dotenv
try {
    require('dotenv').config();
} catch (e) {
    // dotenv not installed, continue without it
}

// Project root directory
const rootDir = path.resolve(__dirname, '..');
const usageDataPath = path.join(rootDir, '.usage-data.json');
const apiKeys = {
    openai: process.env.OPENAI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    groq: process.env.GROQ_API_KEY
};

// Usage data structure
let usageData = {
    startDate: null,
    providers: {
        openai: { requestCount: 0, tokenCount: 0, costUSD: 0 },
        deepseek: { requestCount: 0, tokenCount: 0, costUSD: 0 },
        anthropic: { requestCount: 0, tokenCount: 0, costUSD: 0 },
        groq: { requestCount: 0, tokenCount: 0, costUSD: 0 }
    },
    limits: {
        openai: { monthlyUSD: 20 },
        deepseek: { monthlyUSD: 10 },
        anthropic: { monthlyUSD: 15 },
        groq: { monthlyUSD: 5 }
    },
    lastCheck: null
};

// Load existing usage data if available
const loadUsageData = () => {
    try {
        if (fs.existsSync(usageDataPath)) {
            const data = JSON.parse(fs.readFileSync(usageDataPath, 'utf8'));
            usageData = data;
            return true;
        }
    } catch (error) {
        console.error('Error loading usage data:', error.message);
    }
    return false;
};

// Save usage data
const saveUsageData = () => {
    try {
        usageData.lastCheck = new Date().toISOString();
        fs.writeFileSync(usageDataPath, JSON.stringify(usageData, null, 2));
    } catch (error) {
        console.error('Error saving usage data:', error.message);
    }
};

// Fetch OpenAI usage data
const fetchOpenAIUsage = async () => {
    if (!apiKeys.openai) {
        console.log('⚠️ OpenAI API key not found. Skipping OpenAI usage check.');
        return false;
    }

    try {
        // Use fetch API for HTTP request
        const response = await fetch('https://api.openai.com/v1/usage', {
            headers: {
                'Authorization': `Bearer ${apiKeys.openai}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();

            // Update usage data
            usageData.providers.openai.requestCount = data.total_requests || 0;
            usageData.providers.openai.tokenCount = data.total_tokens || 0;

            // Approximate cost calculation (simplified)
            const costPerToken = 0.00002; // Very rough estimate
            usageData.providers.openai.costUSD = data.total_tokens * costPerToken;

            console.log('✅ OpenAI usage data fetched successfully');
            return true;
        } else {
            console.log(`❌ OpenAI API error: ${response.status} ${response.statusText}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error fetching OpenAI usage: ${error.message}`);
        return false;
    }
};

// Display usage summary
const displayUsageSummary = () => {
    console.log('\n=== API Usage Summary ===');
    console.log(`Last checked: ${usageData.lastCheck ? new Date(usageData.lastCheck).toLocaleString() : 'Never'}`);
    console.log('\nProvider       Requests    Tokens      Est. Cost    Limit');
    console.log('----------------------------------------------------------------');

    for (const [provider, usage] of Object.entries(usageData.providers)) {
        const limit = usageData.limits[provider].monthlyUSD;
        const percentage = limit > 0 ? (usage.costUSD / limit) * 100 : 0;
        const alert = percentage > 80 ? '⚠️ ' : percentage > 95 ? '🚨 ' : '';

        console.log(
            `${provider.padEnd(14)} ${usage.requestCount.toString().padEnd(11)} ${usage.tokenCount.toString().padEnd(11)} $${usage.costUSD.toFixed(2).padEnd(11)} $${limit} ${alert}`
        );
    }

    console.log('\nNote: Token counts and costs are estimates.');
    console.log('For accurate billing information, please check your provider dashboard.');
};

// Check if approaching limits
const checkLimits = () => {
    console.log('\n=== Usage Alert Status ===');

    let alerts = 0;
    for (const [provider, usage] of Object.entries(usageData.providers)) {
        const limit = usageData.limits[provider].monthlyUSD;
        if (limit <= 0) continue;

        const percentage = (usage.costUSD / limit) * 100;

        if (percentage > 95) {
            console.log(`🚨 CRITICAL: ${provider} usage at ${percentage.toFixed(1)}% of monthly limit!`);
            alerts++;
        } else if (percentage > 80) {
            console.log(`⚠️ WARNING: ${provider} usage at ${percentage.toFixed(1)}% of monthly limit!`);
            alerts++;
        }
    }

    if (alerts === 0) {
        console.log('✅ All usage within safe limits');
    }

    return alerts;
};

// Update usage limits
const updateLimit = (provider, amount) => {
    if (!usageData.providers[provider]) {
        console.log(`Provider '${provider}' not found`);
        return;
    }

    usageData.limits[provider].monthlyUSD = amount;
    console.log(`✅ Updated ${provider} monthly limit to $${amount}`);
    saveUsageData();
};

// Handle user commands
const handleCommand = async (command) => {
    const parts = command.trim().split(' ');

    switch (parts[0].toLowerCase()) {
        case 'refresh':
        case 'update':
            await fetchOpenAIUsage();
            // Add other providers here
            saveUsageData();
            displayUsageSummary();
            break;

        case 'limit':
            if (parts.length >= 3) {
                const provider = parts[1].toLowerCase();
                const amount = parseFloat(parts[2]);

                if (isNaN(amount)) {
                    console.log('Invalid amount. Please specify a number.');
                } else {
                    updateLimit(provider, amount);
                }
            } else {
                console.log('Usage: limit <provider> <amount>');
                console.log('Example: limit openai 50');
            }
            break;

        case 'reset':
            if (parts.length >= 2) {
                const provider = parts[1].toLowerCase();

                if (usageData.providers[provider]) {
                    usageData.providers[provider] = { requestCount: 0, tokenCount: 0, costUSD: 0 };
                    console.log(`✅ Reset ${provider} usage data`);
                    saveUsageData();
                } else {
                    console.log(`Provider '${provider}' not found`);
                }
            } else {
                console.log('Usage: reset <provider>');
            }
            break;

        case 'help':
            console.log('\nAvailable commands:');
            console.log('  refresh, update   - Fetch latest API usage data');
            console.log('  limit <provider> <amount>  - Set monthly USD limit');
            console.log('  reset <provider>  - Reset usage data for a provider');
            console.log('  exit, quit       - Exit the monitor');
            console.log('  help             - Show this help message');
            break;

        case 'exit':
        case 'quit':
            return true;

        default:
            console.log('Unknown command. Type "help" for available commands.');
    }

    return false;
};

// Main function
const main = async () => {
    console.log('===============================================');
    console.log('   WORD-GPT-PLUS API USAGE MONITOR');
    console.log('===============================================');

    // Initialize usage data
    if (!loadUsageData()) {
        usageData.startDate = new Date().toISOString();
        saveUsageData();
    }

    // Fetch initial usage data
    console.log('\nFetching API usage data...');
    await fetchOpenAIUsage();
    // Add other providers here

    saveUsageData();
    displayUsageSummary();
    checkLimits();

    console.log('\nEnter commands or type "help" for options.');

    // Create readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'api-monitor> '
    });

    rl.prompt();

    rl.on('line', async (line) => {
        const shouldExit = await handleCommand(line);

        if (shouldExit) {
            rl.close();
        } else {
            rl.prompt();
        }
    });

    rl.on('close', () => {
        console.log('\nExiting API usage monitor. Goodbye!');
        process.exit(0);
    });
};

// Run the monitor
main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
