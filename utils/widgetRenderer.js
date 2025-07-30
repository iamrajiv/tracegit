import { ICONS } from "./constants.js";

export class WidgetRenderer {
  static createWidget(orgName, contributions, message) {
    const widget = document.createElement("div");
    widget.className = "tracegit-widget";
    widget.innerHTML = this.getWidgetHTML(orgName, contributions, message);
    return widget;
  }

  static getWidgetHTML(orgName, contributions, message) {
    if (message) {
      return this.getMessageHTML(orgName, message);
    }

    if (!contributions) {
      return this.getNoDataHTML(orgName);
    }

    return this.getContributionsHTML(orgName, contributions);
  }

  static getMessageHTML(orgName, message) {
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

  static getNoDataHTML(orgName) {
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

  static getContributionsHTML(orgName, contributions) {
    return `
      <div class="tracegit-container">
        <div class="tracegit-header">
          <span class="tracegit-icon">📊</span>
          <span class="tracegit-title">My Contributions to ${orgName}</span>
        </div>
        <div class="tracegit-stats">
          ${this.getStatHTML("Commits", contributions.totalCommitContributions, ICONS.COMMITS)}
          ${this.getStatHTML("Open PRs", contributions.openPRs || 0, ICONS.OPEN_PRS)}
          ${this.getStatHTML("Merged PRs", contributions.mergedPRs || 0, ICONS.MERGED_PRS)}
          ${this.getStatHTML("Reviews", contributions.totalPullRequestReviewContributions, ICONS.REVIEWS)}
        </div>
      </div>
    `;
  }

  static getStatHTML(label, value, icon) {
    return `
      <div class="tracegit-stat">
        ${icon}
        <div class="tracegit-stat-content">
          <span class="tracegit-stat-label">${label}</span>
          <span class="tracegit-stat-value">${value}</span>
        </div>
      </div>
    `;
  }

  static createNotification(message) {
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
      ${message}
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}
