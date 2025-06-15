const { getSetting, updateSetting } = require('../../src/services/settings/settingsManager');

describe('Settings Manager secure storage', () => {
    beforeEach(() => {
        global.localStorage = {
            store: {},
            getItem(key) { return this.store[key] || null; },
            setItem(key, value) { this.store[key] = value; },
            removeItem(key) { delete this.store[key]; },
            clear() { this.store = {}; }
        };
    });

    test('encrypts sensitive values', () => {
        updateSetting('apiKeys.openai', 'my-secret-key');
        const raw = global.localStorage.getItem('word-gpt-plus.secure.apiKeys.openai');
        expect(raw).not.toBe('my-secret-key');
        const value = getSetting('apiKeys.openai');
        expect(value).toBe('my-secret-key');
    });
});
