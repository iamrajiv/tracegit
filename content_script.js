class TraceGitContentScript {
  constructor() {
    this.currentOrg = null;
    this.contributionWidget = null;
    this.observer = null;
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.start());
    } else {
      this.start();
    }
  }

  start() {
    if (window.location.hostname !== "github.com") {
      return;
    }

    this.setupNavigationObserver();
    this.checkCurrentPage();
  }

  setupNavigationObserver() {
    let lastUrl = location.href;

    this.observer = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setTimeout(() => this.checkCurrentPage(), 500);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  async checkCurrentPage() {
    const orgName = this.extractOrgName();

    if (orgName && orgName !== this.currentOrg) {
      this.currentOrg = orgName;
      await this.loadContributions(orgName);
    } else if (!orgName) {
      this.removeWidget();
      this.currentOrg = null;
    }
  }

  extractOrgName() {
    const path = window.location.pathname;
    const match = path.match(/^\/([^\/]+)\/?$/);

    if (match) {
      const potentialOrg = match[1];

      const orgHeader =
        document.querySelector('[data-testid="organization-header"]') ||
        document.querySelector(".js-org-header") ||
        document.querySelector(".orghead");

      if (orgHeader) {
        return potentialOrg;
      }

      const orgElements =
        document.querySelector(".org-name") ||
        document.querySelector(".organization-main") ||
        document.querySelector('[itemtype="http://schema.org/Organization"]');

      if (orgElements) {
        return potentialOrg;
      }
    }

    return null;
  }

  async loadContributions(orgName) {
    try {
      const result = await chrome.storage.local.get([
        "github_pat",
        "github_username",
      ]);

      if (!result.github_pat || !result.github_username) {
        this.showWidget(
          orgName,
          null,
          "Please configure your GitHub token in the extension popup."
        );
        return;
      }

      if (!window.githubAPI.canMakeRequest()) {
        const rateLimitStatus = window.githubAPI.getRateLimitStatus();
        this.showWidget(
          orgName,
          null,
          `Rate limit exceeded. Resets at ${rateLimitStatus.resetTime.toLocaleTimeString()}`
        );
        return;
      }

      this.showWidget(orgName, null, "Loading contributions...");

      const data = await window.githubAPI.getMyContributions(orgName);
      this.showWidget(orgName, data.contributions, null);
    } catch (error) {
      console.error("Failed to load contributions:", error);

      let errorMessage = "Failed to load contributions";
      if (error.message.includes("not found")) {
        errorMessage = `Organization "${orgName}" not found or private`;
      } else if (error.message.includes("rate limit")) {
        errorMessage = "GitHub API rate limit exceeded";
      } else if (error.message.includes("token")) {
        errorMessage =
          'GitHub token issue. Please <a href="#" id="tracegit-configure-link">configure your GitHub token</a> in the extension popup.';
      }

      this.showWidget(orgName, null, errorMessage);
    }
  }

  showWidget(orgName, contributions, message) {
    this.removeWidget();

    const widget = this.createWidget(orgName, contributions, message);
    const insertionPoint = this.findInsertionPoint();

    if (insertionPoint) {
      insertionPoint.appendChild(widget);
      this.contributionWidget = widget;
      const configureLink = widget.querySelector("#tracegit-configure-link");
      if (configureLink) {
        configureLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.openExtensionPopup();
        });
      }
    }
  }

  openExtensionPopup() {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: "openPopup" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log(
            "Could not open popup automatically. Please click the extension icon in your browser toolbar."
          );
          this.showPopupInstructions();
        }
      });
    } else {
      this.showPopupInstructions();
    }
  }

  showPopupInstructions() {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1f883d;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      max-width: 300px;
      line-height: 1.4;
    `;
    notification.innerHTML = `
      <strong>📌 Setup Required</strong><br>
      Click the traceGit extension icon in your browser toolbar to configure your GitHub token.
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  findInsertionPoint() {
    const navTabs =
      document.querySelector(".UnderlineNav") ||
      document.querySelector('[role="tablist"]') ||
      document.querySelector(".js-sticky") ||
      document.querySelector(".orghead nav");

    if (navTabs) {
      const navList =
        navTabs.querySelector(".UnderlineNav-body") ||
        navTabs.querySelector(".nav") ||
        navTabs.querySelector("nav") ||
        navTabs;

      if (navList) {
        return navList;
      }
    }
    const orgNav =
      document.querySelector(".org-nav") ||
      document.querySelector(".orghead .UnderlineNav-body");

    if (orgNav) {
      return orgNav;
    }
    const anyNav =
      document.querySelector("nav[aria-label]") ||
      document.querySelector(".js-sticky-offset-scroll");

    if (anyNav) {
      return anyNav;
    }
    return document.body;
  }

  createWidget(orgName, contributions, message) {
    const widget = document.createElement("div");
    widget.className = "tracegit-widget";
    widget.innerHTML = this.getWidgetHTML(orgName, contributions, message);

    return widget;
  }

  getWidgetHTML(orgName, contributions, message) {
    if (message) {
      return `
        <div class="tracegit-container">
          <div class="tracegit-header">
            <span class="tracegit-icon">📊</span>
            <span class="tracegit-title">My Contributions to ${orgName}</span>
          </div>
          <div class="tracegit-message">${message}</div>
        </div>
      `;
    }

    if (!contributions) {
      return `
        <div class="tracegit-container">
          <div class="tracegit-header">
            <span class="tracegit-icon">📊</span>
            <span class="tracegit-title">My Contributions to ${orgName}</span>
          </div>
          <div class="tracegit-message">No contribution data available</div>
        </div>
      `;
    }

    return `
      <div class="tracegit-container">
        <div class="tracegit-header">
          <span class="tracegit-icon">📊</span>
          <span class="tracegit-title">My Contributions to ${orgName}</span>
        </div>
        <div class="tracegit-stats">
          <div class="tracegit-stat">
            <svg class="tracegit-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path>
            </svg>
            <div class="tracegit-stat-content">
              <span class="tracegit-stat-label">Commits</span>
              <span class="tracegit-stat-value">${contributions.totalCommitContributions}</span>
            </div>
          </div>
          <div class="tracegit-stat">
            <svg class="tracegit-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path>
            </svg>
            <div class="tracegit-stat-content">
              <span class="tracegit-stat-label">Open PRs</span>
              <span class="tracegit-stat-value">${contributions.openPRs || 0}</span>
            </div>
          </div>
          <div class="tracegit-stat">
            <svg class="tracegit-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"></path>
            </svg>
            <div class="tracegit-stat-content">
              <span class="tracegit-stat-label">Merged PRs</span>
              <span class="tracegit-stat-value">${contributions.mergedPRs || 0}</span>
            </div>
          </div>
          <div class="tracegit-stat">
            <svg class="tracegit-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
            </svg>
            <div class="tracegit-stat-content">
              <span class="tracegit-stat-label">Reviews</span>
              <span class="tracegit-stat-value">${contributions.totalPullRequestReviewContributions}</span>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  removeWidget() {
    if (this.contributionWidget) {
      this.contributionWidget.remove();
      this.contributionWidget = null;
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.removeWidget();
  }
}

const traceGit = new TraceGitContentScript();
