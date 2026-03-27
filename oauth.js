window.addEventListener('DOMContentLoaded', () => {
   const authBtn = document.getElementById('auth');
    const toggleLabel = document.getElementById('toggle-label');
    const toggle = document.getElementById('vim-toggle');

    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        authBtn.style.display = "none";
        toggleLabel.style.display = "block";

        chrome.storage.local.get({ enabled: true }, (data) => {
          toggle.checked = data.enabled;
        });

        injectIntoActiveDoc();
      } else {
        authBtn.style.display = "inline-block";
        toggleLabel.style.display = "none";
      }
    });

    authBtn.addEventListener('click', () => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (!token || chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }

        console.log("Auth token:", token);

        authBtn.style.display = "none";
        toggleLabel.style.display = "block";
        toggle.checked = true;

        chrome.storage.local.set({ enabled: true, isAuthenticated: true });

        injectIntoActiveDoc();
      });
    });
// user enable/disable extension
toggle.addEventListener('change', () => {
    chrome.storage.local.set({ enabled: toggle.checked }, () => {
      if (toggle.checked) {
        injectIntoActiveDoc();
      }
    });
  });

function injectIntoActiveDoc() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;

    const tab = tabs[0];
    if (!tab.url.includes("docs.google.com/document")) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["state.js"]

    });
  });
}
});