export const API_CONSTANTS = {
  GITHUB_API_BASE: "https://api.github.com/graphql",
  RATE_LIMIT_DEFAULT: 5000,
  RATE_LIMIT_BUFFER: 10,
  CACHE_TIMEOUT: 300000,
  CLEANUP_INTERVAL: 1800000,
  MAX_CACHE_AGE: 1800000,
};

export const SELECTORS = {
  ORG_HEADER: '[data-testid="organization-header"]',
  ORG_HEADER_LEGACY: ".js-org-header",
  ORG_HEAD: ".orghead",
  ORG_NAME: ".org-name",
  ORG_MAIN: ".organization-main",
  ORG_SCHEMA: '[itemtype="http://schema.org/Organization"]',
  NAV_TABS: ".UnderlineNav",
  NAV_ROLE: '[role="tablist"]',
  NAV_STICKY: ".js-sticky",
  NAV_BODY: ".UnderlineNav-body",
  NAV_GENERIC: "nav[aria-label]",
  NAV_OFFSET: ".js-sticky-offset-scroll",
};

export const MESSAGES = {
  TOKEN_NOT_FOUND:
    "GitHub token not found. Please configure in extension popup.",
  USERNAME_NOT_FOUND: "Username not found. Please reconfigure the extension.",
  NETWORK_ERROR:
    "Network error: Unable to connect to GitHub API. Please check your internet connection.",
  INVALID_TOKEN_FORMAT:
    'Invalid token format. Token should start with "ghp_" or "github_pat_"',
  TOKEN_REQUIRED: "Please enter a GitHub Personal Access Token",
  VALIDATION_FAILED:
    "Failed to validate token. Please check your token and try again.",
  INVALID_API_RESPONSE: "Invalid response from GitHub API",
  LOADING: "Loading contributions...",
  NOT_CONNECTED: "Not connected to GitHub",
  CONNECTED: "Connected to GitHub",
  CONFIGURE_TOKEN: "Please configure your GitHub token in the extension popup.",
  POPUP_INSTRUCTION:
    "Click the traceGit extension icon in your browser toolbar to configure your GitHub token.",
};

export const TOKEN_PREFIXES = ["ghp_", "github_pat_"];

export const ICONS = {
  COMMITS:
    '<svg class="tracegit-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path></svg>',
  OPEN_PRS:
    '<svg class="tracegit-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path></svg>',
  MERGED_PRS:
    '<svg class="tracegit-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"></path></svg>',
  REVIEWS:
    '<svg class="tracegit-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>',
};
