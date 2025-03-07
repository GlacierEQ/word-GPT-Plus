/*
 * This file contains the code for handling button commands in the Office ribbon.
 * Currently it's a minimal implementation since we're using the taskpane approach.
 */

/**
 * Word GPT Plus - Office.js Commands
 * Handles ribbon button commands and extension points
 */

// Initialize Office.js
Office.onReady((info) => {
    if (info.host === Office.HostType.Word) {
        // Register event handlers
        console.log("Commands module initialized in Word");
    }
});

/**
 * Executes the command when the user clicks the button in the ribbon
 * @param event {Office.AddinCommands.Event}
 */
function runCommand(event) {
    // Execute command logic
    console.log("Command executed", event.source.id);

    // Report success
    event.completed();
}

/**
 * Show a notification when command executes
 * @param message {string}
 */
function showNotification(message) {
    Office.context.mailbox?.item?.notificationMessages.replaceAsync(
        "notification",
        {
            type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
            message: message,
            icon: "Icon.80x80",
            persistent: false
        }
    );
}

// Export commands for Office.js to recognize
// These names must match the FunctionName values in the manifest
Office.actions.associate("runCommand", runCommand);

// Make functions available globally
window.word_gpt_plus_commands = {
    runCommand
};

/**
 * Word GPT Plus - Commands
 * Handles Office ribbon commands and function calls
 */

// Command handlers
function generateTextCommand(event) {
    try {
        // Get currently selected text
        Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
            function (result) {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    // Open the taskpane with the selected text
                    Office.context.ui.displayDialogAsync(
                        'https://localhost:3000/enhanced-taskpane.html?text=' +
                        encodeURIComponent(result.value),
                        { height: 60, width: 30 },
                        function (asyncResult) {
                            if (asyncResult.status === Office.AsyncResultStatus.Failed) {
                                // Handle error
                                console.error('Dialog failed:', asyncResult.error.message);
                            }
                        }
                    );
                } else {
                    // Handle error
                    console.error('Failed to get selected text:', result.error.message);
                }
            }
        );

        // Required to signal completion
        event.completed();
    } catch (error) {
        console.error("Error in command:", error);
        event.completed();
    }
}

// Register command handlers when Office is ready
Office.onReady(() => {
    // Register function commands
    Office.actions.associate("generateText", generateTextCommand);
});
