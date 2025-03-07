// Office.js mock for Jest tests
global.Office = {
    onReady: callback => {
        callback({ host: 'Word' });
    },
    context: {
        document: {
            getSelectedDataAsync: jest.fn(),
            setSelectedDataAsync: jest.fn()
        }
    },
    HostType: {
        Word: 'Word'
    },
    CoercionType: {
        Text: 'text',
        Html: 'html'
    }
};

global.Word = {
    run: async callback => {
        const context = {
            document: {
                body: {
                    insertText: jest.fn(),
                    insertHtml: jest.fn(),
                    clear: jest.fn(),
                    getRange: jest.fn().mockReturnThis(),
                    load: jest.fn()
                },
                getSelection: jest.fn().mockReturnThis(),
                properties: {
                    load: jest.fn()
                }
            },
            sync: jest.fn()
        };
        await callback(context);
        return Promise.resolve();
    },
    InsertLocation: {
        replace: 'replace',
        start: 'start',
        end: 'end'
    }
};
