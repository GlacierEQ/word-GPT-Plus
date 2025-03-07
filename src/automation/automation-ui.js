/**
 * Word GPT Plus - Automation UI
 * Creates the user interface for automation features
 */

/**
 * Create automation UI in the given container
 * @param {Object} automationManager - The automation manager instance
 * @param {HTMLElement} container - Container element for the UI
 * @returns {Object} UI controller
 */
export function createAutomationUI(automationManager, container) {
    if (!container) {
        console.error('No container element provided for automation UI');
        return null;
    }

    // Clear the container
    container.innerHTML = '';
    container.className = 'wgp-automation-container';

    // Add styles if not already present
    if (!document.getElementById('wgp-automation-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'wgp-automation-styles';
        styleElement.textContent = `
            .wgp-automation-container {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #333;
                padding: 10px;
            }
            
            .wgp-automation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .wgp-section {
                margin-bottom: 20px;
            }
            
            .wgp-section-header {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #e0e0e0;
                text-transform: capitalize;
            }
            
            .wgp-automation-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 10px;
            }
            
            .wgp-automation-item {
                background-color: #f9f9f9;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .wgp-automation-item:hover {
                background-color: #f0f5ff;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .wgp-automation-item-title {
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .wgp-automation-item-description {
                font-size: 12px;
                color: #666;
            }
            
            .wgp-form-group {
                margin-bottom: 15px;
            }
            
            .wgp-form-label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            
            .wgp-form-control {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-family: inherit;
            }
            
            .wgp-select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background-color: white;
                font-family: inherit;
            }
            
            .wgp-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                transition: background-color 0.2s;
            }
            
            .wgp-btn-primary {
                background-color: #0078d4;
                color: white;
            }
            
            .wgp-btn-secondary {
                background-color: #f3f3f3;
                color: #333;
            }
            
            .wgp-btn:hover {
                opacity: 0.9;
            }
            
            .wgp-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .wgp-status {
                margin-top: 10px;
                padding: 10px;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .wgp-status-success {
                background-color: #dff6dd;
                color: #107c10;
            }
            
            .wgp-status-error {
                background-color: #fde7e9;
                color: #d13438;
            }
            
            .wgp-status-info {
                background-color: #f0f6ff;
                color: #0078d4;
            }
            
            .wgp-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .wgp-modal-content {
                background-color: white;
                border-radius: 4px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .wgp-modal-header {
                padding: 15px;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .wgp-modal-title {
                font-weight: 600;
                font-size: 18px;
                margin: 0;
            }
            
            .wgp-modal-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #666;
            }
            
            .wgp-modal-body {
                padding: 15px;
            }
            
            .wgp-modal-footer {
                padding: 15px;
                border-top: 1px solid #e0e0e0;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .wgp-result-container {
                margin-top: 20px;
                padding: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                background-color: #f9f9f9;
            }
            
            .wgp-result-header {
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .wgp-result-content {
                white-space: pre-wrap;
                font-family: monospace;
                font-size: 13px;
                padding: 10px;
                background-color: white;
                border: 1px solid #eee;
                border-radius: 4px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .wgp-tabs {
                display: flex;
                border-bottom: 1px solid #e0e0e0;
                margin-bottom: 15px;
            }
            
            .wgp-tab {
                padding: 8px 16px;
                cursor: pointer;
                border-bottom: 2px solid transparent;
            }
            
            .wgp-tab.active {
                border-bottom-color: #0078d4;
                color: #0078d4;
                font-weight: 500;
            }
        `;
        document.head.appendChild(styleElement);
    }

    // Create UI elements
    const headerElement = document.createElement('div');
    headerElement.className = 'wgp-automation-header';
    headerElement.innerHTML = `
        <div>
            <h2>Document Automations</h2>
        </div>
        <div>
            <button id="wgp-create-automation" class="wgp-btn wgp-btn-secondary">
                Create Custom
            </button>
        </div>
    `;
    container.appendChild(headerElement);

    // Status area
    const statusElement = document.createElement('div');
    statusElement.id = 'wgp-automation-status';
    statusElement.style.display = 'none';
    container.appendChild(statusElement);

    // Automation categories
    const categories = automationManager.getAutomationsByCategory();

    Object.entries(categories).forEach(([category, automations]) => {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'wgp-section';

        sectionElement.innerHTML = `
            <div class="wgp-section-header">${category}</div>
            <div class="wgp-automation-list" data-category="${category}"></div>
        `;

        container.appendChild(sectionElement);

        // Add automation items
        const listContainer = sectionElement.querySelector('.wgp-automation-list');

        automations.forEach(automation => {
            const itemElement = document.createElement('div');
            itemElement.className = 'wgp-automation-item';
            itemElement.dataset.automationId = automation.id;

            itemElement.innerHTML = `
                <div class="wgp-automation-item-title">${automation.name}</div>
                <div class="wgp-automation-item-description">${automation.description}</div>
            `;

            itemElement.addEventListener('click', () => {
                showAutomationModal(automation);
            });

            listContainer.appendChild(itemElement);
        });
    });

    // Add event listener to Create Custom button
    document.getElementById('wgp-create-automation')?.addEventListener('click', () => {
        showCreateAutomationModal();
    });

    // Show status message
    function showStatus(message, type = 'info') {
        statusElement.textContent = message;
        statusElement.className = `wgp-status wgp-status-${type}`;
        statusElement.style.display = 'block';

        // Auto-clear after 5 seconds
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }

    // Clear status message
    function clearStatus() {
        statusElement.style.display = 'none';
    }

    // Show automation modal
    function showAutomationModal(automation) {
        // Create modal backdrop
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'wgp-modal';
        document.body.appendChild(modalBackdrop);

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'wgp-modal-content';
        modalBackdrop.appendChild(modalContent);

        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'wgp-modal-header';
        modalHeader.innerHTML = `
            <h3 class="wgp-modal-title">${automation.name}</h3>
            <button class="wgp-modal-close">&times;</button>
        `;
        modalContent.appendChild(modalHeader);

        // Create modal body with form for parameters
        const modalBody = document.createElement('div');
        modalBody.className = 'wgp-modal-body';

        let bodyContent = `
            <p>${automation.description}</p>
            <form id="wgp-automation-form">
        `;

        // Add form fields for parameters if any
        if (automation.params && automation.params.length > 0) {
            automation.params.forEach(param => {
                let paramField = '';

                if (param.enum) {
                    // Select dropdown for enum parameters
                    paramField = `
                        <div class="wgp-form-group">
                            <label for="param-${param.name}" class="wgp-form-label">
                                ${param.name} ${param.required ? '*' : ''}
                            </label>
                            <select id="param-${param.name}" name="${param.name}" class="wgp-select" 
                                ${param.required ? 'required' : ''}>
                    `;

                    param.enum.forEach(option => {
                        const isDefault = option === param.default;
                        paramField += `<option value="${option}" ${isDefault ? 'selected' : ''}>${option}</option>`;
                    });

                    paramField += `
                            </select>
                        </div>
                    `;
                } else if (param.type === 'boolean') {
                    // Checkbox for boolean parameters
                    paramField = `
                        <div class="wgp-form-group">
                            <label class="wgp-form-check">
                                <input type="checkbox" id="param-${param.name}" name="${param.name}" 
                                    ${param.default ? 'checked' : ''}>
                                ${param.name}
                            </label>
                        </div>
                    `;
                } else {
                    // Text input for other parameters
                    paramField = `
                        <div class="wgp-form-group">
                            <label for="param-${param.name}" class="wgp-form-label">
                                ${param.name} ${param.required ? '*' : ''}
                            </label>
                            <input type="${param.type === 'number' ? 'number' : 'text'}" 
                                id="param-${param.name}" 
                                name="${param.name}" 
                                class="wgp-form-control" 
                                value="${param.default || ''}"
                                ${param.min !== undefined ? `min="${param.min}"` : ''}
                                ${param.max !== undefined ? `max="${param.max}"` : ''}
                                ${param.required ? 'required' : ''}>
                        </div>
                    `;
                }

                bodyContent += paramField;
            });
        } else {
            bodyContent += `<p>This automation doesn't require any parameters.</p>`;
        }

        bodyContent += `</form>`;
        modalBody.innerHTML = bodyContent;
        modalContent.appendChild(modalBody);

        // Create result area (hidden initially)
        const resultContainer = document.createElement('div');
        resultContainer.className = 'wgp-result-container';
        resultContainer.style.display = 'none';
        resultContainer.innerHTML = `
            <div class="wgp-result-header">Results</div>
            <div class="wgp-result-content"></div>
        `;
        modalBody.appendChild(resultContainer);

        // Create modal footer
        const modalFooter = document.createElement('div');
        modalFooter.className = 'wgp-modal-footer';
        modalFooter.innerHTML = `
            <button id="wgp-modal-cancel" class="wgp-btn wgp-btn-secondary">Cancel</button>
            <button id="wgp-modal-run" class="wgp-btn wgp-btn-primary">Run Automation</button>
        `;
        modalContent.appendChild(modalFooter);

        // Handle close button click
        modalContent.querySelector('.wgp-modal-close').addEventListener('click', () => {
            document.body.removeChild(modalBackdrop);
        });

        // Handle cancel button click
        modalContent.querySelector('#wgp-modal-cancel').addEventListener('click', () => {
            document.body.removeChild(modalBackdrop);
        });

        // Handle run button click
        modalContent.querySelector('#wgp-modal-run').addEventListener('click', async () => {
            const form = modalContent.querySelector('#wgp-automation-form');

            // Validate form if there are required parameters
            if (form.checkValidity && !form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Get parameter values
            const params = {};
            if (automation.params) {
                automation.params.forEach(param => {
                    const element = document.getElementById(`param-${param.name}`);
                    if (element) {
                        if (param.type === 'boolean') {
                            params[param.name] = element.checked;
                        } else if (param.type === 'number') {
                            params[param.name] = parseFloat(element.value);
                        } else {
                            params[param.name] = element.value;
                        }
                    }
                });
            }

            // Update UI to show running state
            const runButton = modalContent.querySelector('#wgp-modal-run');
            runButton.disabled = true;
            runButton.textContent = 'Running...';

            try {
                // Run the automation
                const result = await automationManager.runAutomation(automation.id, params);

                // Show results
                const resultContent = modalContent.querySelector('.wgp-result-content');
                resultContainer.style.display = 'block';

                if (result.success) {
                    resultContent.textContent = JSON.stringify(result.result, null, 2);
                    showStatus('Automation completed successfully', 'success');
                } else {
                    resultContent.textContent = `Error: ${result.error}`;
                    resultContent.style.color = '#d13438';
                    showStatus('Automation failed', 'error');
                }
            } catch (error) {
                console.error('Error running automation:', error);
                showStatus('Error running automation: ' + error.message, 'error');

                // Show error in result area
                const resultContent = modalContent.querySelector('.wgp-result-content');
                resultContainer.style.display = 'block';
                resultContent.textContent = `Error: ${error.message}`;
                resultContent.style.color = '#d13438';
            } finally {
                // Restore button state
                runButton.disabled = false;
                runButton.textContent = 'Run Automation';
            }
        });
    }

    // Show create automation modal
    function showCreateAutomationModal() {
        // Create modal backdrop
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'wgp-modal';
        document.body.appendChild(modalBackdrop);

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'wgp-modal-content';
        modalBackdrop.appendChild(modalContent);

        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'wgp-modal-header';
        modalHeader.innerHTML = `
            <h3 class="wgp-modal-title">Create Custom Automation</h3>
            <button class="wgp-modal-close">&times;</button>
        `;
        modalContent.appendChild(modalHeader);

        // Create modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'wgp-modal-body';

        modalBody.innerHTML = `
            <form id="wgp-create-form">
                <div class="wgp-form-group">
                    <label for="automation-name" class="wgp-form-label">Name *</label>
                    <input type="text" id="automation-name" name="name" class="wgp-form-control" required>
                </div>
                
                <div class="wgp-form-group">
                    <label for="automation-description" class="wgp-form-label">Description *</label>
                    <input type="text" id="automation-description" name="description" class="wgp-form-control" required>
                </div>
                
                <div class="wgp-form-group">
                    <label for="automation-category" class="wgp-form-label">Category</label>
                    <select id="automation-category" name="category" class="wgp-select">
                        <option value="custom">Custom</option>
                        <option value="generation">Content Generation</option>
                        <option value="formatting">Formatting</option>
                        <option value="analysis">Analysis</option>
                    </select>
                </div>
                
                <div class="wgp-form-group">
                    <label for="automation-code" class="wgp-form-label">JavaScript Code *</label>
                    <p class="wgp-form-help">Write a function that takes 'context' and 'params' arguments and returns a result.</p>
                    <textarea id="automation-code" name="code" class="wgp-form-control" rows="10" required>async function(context, params) {
    // Your automation code here
    // 'context' is the Word context object
    // 'params' contains parameters from the form
    
    // Example: Get selected text
    const selection = context.document.getSelection();
    selection.load('text');
    await context.sync();
    
    // Do something with the text
    const text = selection.text;
    const modifiedText = text.toUpperCase();
    
    // Replace selection
    selection.insertText(modifiedText, 'Replace');
    await context.sync();
    
    return { 
        originalLength: text.length,
        modifiedLength: modifiedText.length
    };
}</textarea>
                </div>
            </form>
        `;

        modalContent.appendChild(modalBody);

        // Create modal footer
        const modalFooter = document.createElement('div');
        modalFooter.className = 'wgp-modal-footer';
        modalFooter.innerHTML = `
            <button id="wgp-modal-cancel" class="wgp-btn wgp-btn-secondary">Cancel</button>
            <button id="wgp-modal-create" class="wgp-btn wgp-btn-primary">Create Automation</button>
        `;
        modalContent.appendChild(modalFooter);

        // Handle close button click
        modalContent.querySelector('.wgp-modal-close').addEventListener('click', () => {
            document.body.removeChild(modalBackdrop);
        });

        // Handle cancel button click
        modalContent.querySelector('#wgp-modal-cancel').addEventListener('click', () => {
            document.body.removeChild(modalBackdrop);
        });

        // Handle create button click
        modalContent.querySelector('#wgp-modal-create').addEventListener('click', () => {
            const form = modalContent.querySelector('#wgp-create-form');

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            try {
                // Get form values
                const name = document.getElementById('automation-name').value;
                const description = document.getElementById('automation-description').value;
                const category = document.getElementById('automation-category').value;
                const code = document.getElementById('automation-code').value;

                // Validate JavaScript code
                let handler;
                try {
                    // Use Function constructor to evaluate the code
                    handler = new Function(`return ${code}`)();
                } catch (error) {
                    showStatus(`Invalid JavaScript code: ${error.message}`, 'error');
                    return;
                }

                // Create the automation
                const automationId = automationManager.createCustomAutomation({
                    name,
                    description,
                    category,
                    handler
                });

                // Close modal
                document.body.removeChild(modalBackdrop);

                // Show success message
                showStatus(`Custom automation "${name}" created successfully`, 'success');

                // Refresh UI to show new automation
                createAutomationUI(automationManager, container);

            } catch (error) {
                showStatus(`Error creating automation: ${error.message}`, 'error');
            }
        });
    }

    // UI controller object
    const uiController = {
        container,
        showStatus,
        clearStatus,
        refreshUI: () => createAutomationUI(automationManager, container),
        showAutomationModal
    };

    return uiController;
}
