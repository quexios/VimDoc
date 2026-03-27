chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url || !tab.url.includes("docs.google.com/document")) return;

  chrome.storage.local.get(['isAuthenticated'], (data) => {
    if (!data.isAuthenticated) return;

    chrome.scripting.executeScript({
      target: { tabId },
      files: ["state.js"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      }
    });
  });
});