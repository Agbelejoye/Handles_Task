/**
 * Task Handler AI – Browser Extension Background Service Worker
 *
 * Tracks active tab activity and periodically syncs to the backend.
 * Activity tracking is OPT-IN only (disabled by default).
 */

// ─── Config ──────────────────────────────────────────────────────────────────

let API_BASE = "http://localhost:3000"; // Change to production URL in settings
const SYNC_INTERVAL_MIN = 1; // Sync every 1 minute
const MAX_BUFFER_SIZE = 100; // Max events before forced sync

// ─── State ───────────────────────────────────────────────────────────────────

let trackingEnabled = false;
let activeTabId = null;
let activeTabUrl = null;
let activeTabTitle = null;
let activeTabStart = null;
let eventBuffer = [];

// ─── Initialization ───────────────────────────────────────────────────────────

chrome.storage.sync.get(["trackingEnabled", "apiBase"], (result) => {
  trackingEnabled = result.trackingEnabled ?? false;
  if (result.apiBase) API_BASE = result.apiBase;
});

// Set up periodic sync alarm
chrome.alarms.create("sync", { periodInMinutes: SYNC_INTERVAL_MIN });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "sync") syncBuffer();
});

// ─── Tab tracking ─────────────────────────────────────────────────────────────

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function recordCurrentTab() {
  if (!trackingEnabled || !activeTabId || !activeTabStart) return;

  const now = Date.now();
  const durationSec = Math.round((now - activeTabStart) / 1000);

  if (durationSec < 3) return; // Ignore very short visits

  const event = {
    domain: getDomain(activeTabUrl || ""),
    url: activeTabUrl,
    title: activeTabTitle,
    durationSec,
    recordedAt: new Date(activeTabStart).toISOString(),
  };

  eventBuffer.push(event);

  // Force sync if buffer is large
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    syncBuffer();
  }
}

function startTracking(tabId, url, title) {
  recordCurrentTab(); // Save previous tab
  activeTabId = tabId;
  activeTabUrl = url;
  activeTabTitle = title;
  activeTabStart = Date.now();
}

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (info) => {
  if (!trackingEnabled) return;
  try {
    const tab = await chrome.tabs.get(info.tabId);
    if (tab.url && !tab.url.startsWith("chrome://")) {
      startTracking(tab.id, tab.url, tab.title);
    }
  } catch {
    // Tab may have been closed
  }
});

// Listen for URL changes in active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!trackingEnabled) return;
  if (tabId !== activeTabId) return;
  if (changeInfo.status === "complete" && tab.url) {
    startTracking(tabId, tab.url, tab.title);
  }
});

// Listen for tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    recordCurrentTab();
    activeTabId = null;
    activeTabUrl = null;
    activeTabTitle = null;
    activeTabStart = null;
  }
});

// ─── Sync ─────────────────────────────────────────────────────────────────────

async function syncBuffer() {
  if (!trackingEnabled || eventBuffer.length === 0) return;

  const toSync = [...eventBuffer];
  eventBuffer = [];

  try {
    const response = await fetch(`${API_BASE}/api/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: toSync }),
    });

    if (!response.ok) {
      // Put events back in buffer on failure
      eventBuffer = [...toSync, ...eventBuffer];
      console.warn("[TaskHandlerAI] Sync failed:", response.status);
    } else {
      console.log(`[TaskHandlerAI] Synced ${toSync.length} events`);
    }
  } catch (err) {
    // Network error – put events back
    eventBuffer = [...toSync, ...eventBuffer];
    console.warn("[TaskHandlerAI] Sync error:", err.message);
  }
}

// ─── Message handler (from popup) ────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "GET_STATUS":
      sendResponse({
        trackingEnabled,
        bufferSize: eventBuffer.length,
        activeTab: activeTabUrl ? getDomain(activeTabUrl) : null,
      });
      break;

    case "SET_TRACKING":
      trackingEnabled = message.enabled;
      chrome.storage.sync.set({ trackingEnabled });
      if (!trackingEnabled) {
        recordCurrentTab();
        activeTabId = null;
        activeTabUrl = null;
        activeTabTitle = null;
        activeTabStart = null;
      }
      sendResponse({ ok: true });
      break;

    case "FORCE_SYNC":
      recordCurrentTab();
      syncBuffer().then(() => sendResponse({ ok: true }));
      return true; // async response

    case "SET_API_BASE":
      API_BASE = message.apiBase;
      chrome.storage.sync.set({ apiBase: message.apiBase });
      sendResponse({ ok: true });
      break;
  }
  return false;
});
