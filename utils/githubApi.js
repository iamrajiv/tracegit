class GitHubAPI {
  constructor() {
    this.baseUrl = "https://api.github.com/graphql";
    this.cache = new Map();
    this.rateLimit = {
      remaining: 5000,
      resetTime: Date.now() + 3600000,
    };
  }

  async getToken() {
    const result = await chrome.storage.local.get(["github_pat"]);
    return result.github_pat;
  }

  async getUsername() {
    const result = await chrome.storage.local.get(["github_username"]);
    return result.github_username;
  }

  async graphqlRequest(query, variables = {}) {
    const token = await this.getToken();
    if (!token) {
      throw new Error(
        "GitHub token not found. Please configure in extension popup."
      );
    }

    if (!this.canMakeRequest()) {
      const resetTime = new Date(this.rateLimit.resetTime).toLocaleTimeString();
      throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime}`);
    }

    let response;
    try {
      response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "traceGit-Extension/1.0.0",
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Network error: Unable to connect to GitHub API. Please check your internet connection."
        );
      }
      throw new Error(`Request failed: ${error.message}`);
    }

    this.updateRateLimit(response.headers);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data;
  }

  updateRateLimit(headers) {
    const remaining = headers.get("X-RateLimit-Remaining");
    const resetTime = headers.get("X-RateLimit-Reset");

    if (remaining) {
      this.rateLimit.remaining = parseInt(remaining);
    }
    if (resetTime) {
      this.rateLimit.resetTime = parseInt(resetTime) * 1000;
    }
  }

  async getOrganizationId(orgName) {
    const cacheKey = `org-id-${orgName}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const query = `
      query GetOrganization($login: String!) {
        organization(login: $login) {
          id
          name
          login
        }
      }
    `;

    try {
      const data = await this.graphqlRequest(query, { login: orgName });

      if (!data.organization) {
        throw new Error(`Organization "${orgName}" not found`);
      }

      const orgId = data.organization.id;
      this.cache.set(cacheKey, orgId);

      return orgId;
    } catch (error) {
      console.error(`Failed to get organization ID for ${orgName}:`, error);
      throw error;
    }
  }

  async getUserContributions(username, organizationId) {
    const cacheKey = `contributions-${username}-${organizationId}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const query = `
      query GetUserContributions($username: String!, $organizationId: ID!) {
        user(login: $username) {
          contributionsCollection(organizationID: $organizationId) {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            totalRepositoryContributions
          }
        }
      }
    `;

    try {
      const data = await this.graphqlRequest(query, {
        username,
        organizationId,
      });

      if (!data.user) {
        throw new Error(`User "${username}" not found`);
      }

      const contributions = data.user.contributionsCollection;
      this.cache.set(cacheKey, contributions);

      return contributions;
    } catch (error) {
      console.error(`Failed to get contributions for ${username}:`, error);
      throw error;
    }
  }

  async getDetailedPRStats(username, orgName) {
    const cacheKey = `pr-stats-${username}-${orgName}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const query = `
      query GetPRStats($query: String!) {
        search(query: $query, type: ISSUE, first: 100) {
          issueCount
          edges {
            node {
              ... on PullRequest {
                state
                merged
              }
            }
          }
        }
      }
    `;

    try {
      const searchQuery = `author:${username} org:${orgName} type:pr`;
      const data = await this.graphqlRequest(query, { query: searchQuery });

      let openPRs = 0;
      let mergedPRs = 0;

      if (data.search && data.search.edges) {
        data.search.edges.forEach((edge) => {
          if (edge.node) {
            if (edge.node.merged) {
              mergedPRs++;
            } else if (edge.node.state === "OPEN") {
              openPRs++;
            }
          }
        });
      }

      const stats = {
        openPRs,
        mergedPRs,
        totalPRs: data.search.issueCount,
      };

      this.cache.set(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error(
        `Failed to get PR stats for ${username} in ${orgName}:`,
        error
      );
      return { openPRs: 0, mergedPRs: 0, totalPRs: 0 };
    }
  }

  async getMyContributions(orgName) {
    try {
      const username = await this.getUsername();
      if (!username) {
        throw new Error(
          "Username not found. Please reconfigure the extension."
        );
      }

      const organizationId = await this.getOrganizationId(orgName);

      const [contributions, prStats] = await Promise.all([
        this.getUserContributions(username, organizationId),
        this.getDetailedPRStats(username, orgName),
      ]);

      return {
        username,
        orgName,
        contributions: {
          ...contributions,
          openPRs: prStats.openPRs,
          mergedPRs: prStats.mergedPRs,
        },
      };
    } catch (error) {
      console.error(
        `Failed to get contributions for organization ${orgName}:`,
        error
      );
      throw error;
    }
  }

  canMakeRequest() {
    if (Date.now() > this.rateLimit.resetTime) {
      this.rateLimit.remaining = 5000;
    }
    return this.rateLimit.remaining > 10;
  }

  getRateLimitStatus() {
    return {
      remaining: this.rateLimit.remaining,
      resetTime: new Date(this.rateLimit.resetTime),
      canMakeRequest: this.canMakeRequest(),
    };
  }

  clearCache() {
    this.cache.clear();
  }
}

if (typeof window !== "undefined") {
  window.githubAPI = new GitHubAPI();
}
