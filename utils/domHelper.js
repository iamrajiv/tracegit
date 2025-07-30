import { SELECTORS } from "./constants.js";

export class DOMHelper {
  static extractOrgName() {
    const path = window.location.pathname;
    const match = path.match(/^\/([^\/]+)\/?$/);

    if (match) {
      const potentialOrg = match[1];

      const orgHeader =
        document.querySelector(SELECTORS.ORG_HEADER) ||
        document.querySelector(SELECTORS.ORG_HEADER_LEGACY) ||
        document.querySelector(SELECTORS.ORG_HEAD);

      if (orgHeader) {
        return potentialOrg;
      }

      const orgElements =
        document.querySelector(SELECTORS.ORG_NAME) ||
        document.querySelector(SELECTORS.ORG_MAIN) ||
        document.querySelector(SELECTORS.ORG_SCHEMA);

      if (orgElements) {
        return potentialOrg;
      }
    }

    return null;
  }

  static findInsertionPoint() {
    const navTabs =
      document.querySelector(SELECTORS.NAV_TABS) ||
      document.querySelector(SELECTORS.NAV_ROLE) ||
      document.querySelector(SELECTORS.NAV_STICKY) ||
      document.querySelector(".orghead nav");

    if (navTabs) {
      const navList =
        navTabs.querySelector(SELECTORS.NAV_BODY) ||
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
      document.querySelector(SELECTORS.NAV_GENERIC) ||
      document.querySelector(SELECTORS.NAV_OFFSET);

    if (anyNav) {
      return anyNav;
    }

    return document.body;
  }

  static setupNavigationObserver(callback) {
    let lastUrl = location.href;

    const observer = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setTimeout(() => callback(), 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return observer;
  }

  static isGitHubPage() {
    return window.location.hostname === "github.com";
  }

  static addClickHandler(element, selector, handler) {
    const target = element.querySelector(selector);
    if (target) {
      target.addEventListener("click", handler);
    }
  }
}
