window.addEventListener('DOMContentLoaded', () => {
  const authBtn = document.getElementById('auth');
  const toggleLabel = document.getElementById('toggle-label');
  const toggle = document.getElementById('vim-toggle');

  // Check existing auth silently on popup open
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (token) {
      showAuthed();
      chrome.storage.local.get({ enabled: true }, (data) => {
        toggle.checked = data.enabled;
      });
    } else {
      showUnauthed();
    }
  });

  authBtn.addEventListener('click', () => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (!token || chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      showAuthed();
      toggle.checked = true;
      chrome.storage.local.set({ enabled: true });
      injectIntoActiveDoc();
    });
  });

  toggle.addEventListener('change', () => {
    chrome.storage.local.set({ enabled: toggle.checked });
  });

  function showAuthed() {
    authBtn.style.display = 'none';
    toggleLabel.style.display = 'block';
  }

  function showUnauthed() {
    authBtn.style.display = 'inline-block';
    toggleLabel.style.display = 'none';
  }

  function injectIntoActiveDoc() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (!tab?.url?.includes('docs.google.com/document')) return;

      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['style.css']
      });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['state.js']
      });
    });
  }
});