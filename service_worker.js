chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url || !tab.url.includes("docs.google.com/document")) return;

  chrome.scripting.insertCSS({
      target: { tabId },
      files: ['style.css']
    });

  chrome.scripting.executeScript({
      target: { tabId },
      files: ["state.js"]
    });
});