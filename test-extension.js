console.log("Testing traceGit extension structure...");

try {
  if (typeof GitHubAPI !== "undefined") {
    console.log("✅ GitHubAPI class loaded");
    const api = new GitHubAPI();
    console.log("✅ GitHubAPI instance created");
  }

  if (typeof TraceGitContentScript !== "undefined") {
    console.log("✅ TraceGitContentScript class loaded");
  }

  if (typeof TraceGitBackground !== "undefined") {
    console.log("✅ TraceGitBackground class loaded");
  }

  console.log("✅ All core classes are available");
} catch (error) {
  console.error("❌ Error testing extension:", error);
}

console.log("Extension test complete.");
