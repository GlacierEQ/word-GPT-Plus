/*
 * This file contains the code for handling button commands in the Office ribbon.
 * Currently it's a minimal implementation since we're using the taskpane approach.
 */

Office.onReady(() => {
    // Register the commands
});

/**
 * Shows the taskpane
 */
function showTaskpane(event) {
    Office.addin.showAsTaskpane();
    event.completed();
}

// Add command handlers to the Office global object
Office.actions.associate("showTaskpane", showTaskpane);
