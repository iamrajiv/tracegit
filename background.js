class TraceGitBackground {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    chrome.runtime.onInstalled.addListener((details) => {
      console.log("traceGit extension installed:", details);
      this.handleInstallation(details);
    });

    chrome.runtime.onStartup.addListener(() => {
      console.log("traceGit extension started");
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChange(changes, namespace);
    });
  }

  async handleInstallation(details) {
    if (details.reason === "install") {
      await this.initializeExtension();
    } else if (details.reason === "update") {
      await this.handleUpdate(details.previousVersion);
    }
  }

  async initializeExtension() {
    const defaultSettings = {
      cacheTimeout: 300000,
      showRepoContributions: true,
      theme: "auto",
    };

    await chrome.storage.local.set({
      settings: defaultSettings,
      installDate: Date.now(),
    });

    chrome.tabs.create({
      url: chrome.runtime.getURL("popup.html"),
    });
  }

  async handleUpdate(previousVersion) {
    console.log(`Updated from version ${previousVersion}`);

    await this.clearCache();
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case "getContributions":
          const contributions = await this.getContributions(message.orgName);
          sendResponse({ success: true, data: contributions });
          break;

        case "clearCache":
          await this.clearCache();
          sendResponse({ success: true });
          break;

        case "getRateLimitStatus":
          const rateLimitStatus = await this.getRateLimitStatus();
          sendResponse({ success: true, data: rateLimitStatus });
          break;

        case "testToken":
          const tokenValid = await this.testToken(message.token);
          sendResponse({ success: true, valid: tokenValid });
          break;

        case "openPopup":
          await this.openPopup();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      console.error("Background message handler error:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    if (
      changeInfo.status === "complete" &&
      tab.url &&
      tab.url.includes("github.com")
    ) {
      console.log("GitHub page loaded:", tab.url);
    }
  }

  handleStorageChange(changes, namespace) {
    if (namespace === "local") {
      if (changes.github_pat) {
        console.log("GitHub token changed");
        this.clearCache();
      }

      if (changes.settings) {
        console.log("Settings changed:", changes.settings.newValue);
      }
    }
  }

  async getContributions(orgName) {
    return null;
  }

  async clearCache() {
    const keys = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(keys).filter(
      (key) => key.startsWith("cache_") || key.startsWith("contributions_")
    );

    if (cacheKeys.length > 0) {
      await chrome.storage.local.remove(cacheKeys);
      console.log("Cache cleared:", cacheKeys.length, "items");
    }
  }

  async getRateLimitStatus() {
    const result = await chrome.storage.local.get(["rateLimit"]);
    return (
      result.rateLimit || {
        remaining: 5000,
        resetTime: Date.now() + 3600000,
      }
    );
  }

  async testToken(token) {
    try {
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "query { viewer { login } }",
        }),
      });

      const data = await response.json();
      return !data.errors && data.data && data.data.viewer;
    } catch (error) {
      console.error("Token test failed:", error);
      return false;
    }
  }

  async openPopup() {
    try {
      console.log("Popup open requested - user should click extension icon");
      return true;
    } catch (error) {
      console.error("Could not open popup:", error);
      return false;
    }
  }

  static chromeApiPromise(api, ...args) {
    return new Promise((resolve, reject) => {
      api(...args, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }
}

const traceGitBackground = new TraceGitBackground();

chrome.runtime.onMessage.addListener(() => {
  return true;
});

setInterval(async () => {
  const keys = await chrome.storage.local.get(null);
  const now = Date.now();
  const expiredKeys = [];

  for (const [key, value] of Object.entries(keys)) {
    if (key.startsWith("cache_") && value.timestamp) {
      const age = now - value.timestamp;
      if (age > 1800000) {
        expiredKeys.push(key);
      }
    }
  }

  if (expiredKeys.length > 0) {
    await chrome.storage.local.remove(expiredKeys);
    console.log("Cleaned up expired cache entries:", expiredKeys.length);
  }
}, 1800000);
