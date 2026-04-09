// popup.js – Extension popup logic

const toggleBtn = document.getElementById("toggle-btn");
const statusDot = document.getElementById("status-dot");
const activeTabEl = document.getElementById("active-tab");
const bufferSizeEl = document.getElementById("buffer-size");
const syncBtn = document.getElementById("sync-btn");
const openAppBtn = document.getElementById("open-app");
const apiInput = document.getElementById("api-input");

let isEnabled = false;

// Load current status
chrome.runtime.sendMessage({ type: "GET_STATUS" }, (status) => {
  if (!status) return;
  isEnabled = status.trackingEnabled;
  updateUI(status);
});

// Load saved API base
chrome.storage.sync.get(["apiBase"], (result) => {
  apiInput.value = result.apiBase || "http://localhost:3000";
});

function updateUI(status) {
  toggleBtn.className = "toggle" + (status.trackingEnabled ? " on" : "");
  statusDot.className = "status-dot " + (status.trackingEnabled ? "on" : "off");
  activeTabEl.textContent = status.activeTab || "–";
  bufferSizeEl.textContent = `${status.bufferSize} event${status.bufferSize !== 1 ? "s" : ""}`;
}

toggleBtn.addEventListener("click", () => {
  isEnabled = !isEnabled;
  chrome.runtime.sendMessage({ type: "SET_TRACKING", enabled: isEnabled }, () => {
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, updateUI);
  });
});

syncBtn.addEventListener("click", () => {
  syncBtn.textContent = "Syncing…";
  syncBtn.disabled = true;
  chrome.runtime.sendMessage({ type: "FORCE_SYNC" }, () => {
    syncBtn.textContent = "Synced ✓";
    setTimeout(() => {
      syncBtn.textContent = "Sync Now";
      syncBtn.disabled = false;
      chrome.runtime.sendMessage({ type: "GET_STATUS" }, updateUI);
    }, 1500);
  });
});

openAppBtn.addEventListener("click", () => {
  const base = apiInput.value || "http://localhost:3000";
  chrome.tabs.create({ url: base });
});

apiInput.addEventListener("change", () => {
  const value = apiInput.value.trim();
  if (value) {
    chrome.runtime.sendMessage({ type: "SET_API_BASE", apiBase: value });
  }
});
