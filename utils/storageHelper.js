export class StorageHelper {
  static async get(keys) {
    return chrome.storage.local.get(keys);
  }

  static async set(items) {
    return chrome.storage.local.set(items);
  }

  static async remove(keys) {
    return chrome.storage.local.remove(keys);
  }

  static async getToken() {
    const result = await this.get(["github_pat"]);
    return result.github_pat;
  }

  static async getUsername() {
    const result = await this.get(["github_username"]);
    return result.github_username;
  }

  static async getCredentials() {
    return this.get(["github_pat", "github_username"]);
  }

  static async setCredentials(token, username) {
    return this.set({
      github_pat: token,
      github_username: username,
    });
  }

  static async clearCredentials() {
    return this.remove(["github_pat", "github_username"]);
  }

  static async clearCache() {
    const keys = await this.get(null);
    const cacheKeys = Object.keys(keys).filter(
      (key) => key.startsWith("cache_") || key.startsWith("contributions_")
    );

    if (cacheKeys.length > 0) {
      await this.remove(cacheKeys);
      console.log("Cache cleared:", cacheKeys.length, "items");
    }
  }

  static async cleanExpiredCache(maxAge = 1800000) {
    const keys = await this.get(null);
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, value] of Object.entries(keys)) {
      if (key.startsWith("cache_") && value.timestamp) {
        const age = now - value.timestamp;
        if (age > maxAge) {
          expiredKeys.push(key);
        }
      }
    }

    if (expiredKeys.length > 0) {
      await this.remove(expiredKeys);
      console.log("Cleaned up expired cache entries:", expiredKeys.length);
    }
  }
}
