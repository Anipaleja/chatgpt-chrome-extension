// Function to create context menu item
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "ask-chatgpt",
      title: "Ask ChatGPT",
      contexts: ["all"],
    });
  });
}

// Create context menu on startup and when extension is installed
chrome.runtime.onStartup.addListener(createContextMenu);
chrome.runtime.onInstalled.addListener(createContextMenu);

// Create context menu immediately
createContextMenu();

// Listen for when the user clicks on the context menu item
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ask-chatgpt") {
    // Send a message to the content script with error handling
    chrome.tabs.sendMessage(tab.id, { type: "ASK_CHATGPT" }).catch((error) => {
      console.error("Failed to send message to content script:", error);
      // Try to inject content script if it's not already there
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      }).then(() => {
        // Try sending the message again
        chrome.tabs.sendMessage(tab.id, { type: "ASK_CHATGPT" });
      }).catch((scriptError) => {
        console.error("Failed to inject content script:", scriptError);
      });
    });
  }
});
