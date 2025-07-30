document.addEventListener("DOMContentLoaded", () => {
  init();
});

async function init() {
  await checkConnectionStatus();
  document
    .getElementById("save-btn")
    .addEventListener("click", handleSaveToken);
  document
    .getElementById("disconnect-btn")
    .addEventListener("click", handleDisconnect);
}

async function checkConnectionStatus() {
  try {
    const result = await chrome.storage.local.get([
      "github_pat",
      "github_username",
    ]);

    if (result.github_pat && result.github_username) {
      showConnectedState(result.github_username);
    } else {
      showDisconnectedState();
    }
  } catch (error) {
    console.error("Error checking connection status:", error);
    showDisconnectedState();
  }
}

async function handleSaveToken() {
  const patInput = document.getElementById("pat-input");
  const saveBtn = document.getElementById("save-btn");
  const token = patInput.value.trim();

  if (!token) {
    showError("Please enter a GitHub Personal Access Token");
    return;
  }

  if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
    showError(
      'Invalid token format. Token should start with "ghp_" or "github_pat_"'
    );
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Validating...";
  hideError();

  try {
    const username = await validateToken(token);

    await chrome.storage.local.set({
      github_pat: token,
      github_username: username,
    });

    showConnectedState(username);
    patInput.value = "";
  } catch (error) {
    console.error("Token validation failed:", error);
    showError(
      error.message ||
        "Failed to validate token. Please check your token and try again."
    );
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Token";
  }
}

async function handleDisconnect() {
  try {
    await chrome.storage.local.remove(["github_pat", "github_username"]);
    showDisconnectedState();
  } catch (error) {
    console.error("Error disconnecting:", error);
  }
}

async function validateToken(token) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query {
          viewer {
            login
          }
        }
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0].message);
  }

  if (!data.data || !data.data.viewer) {
    throw new Error("Invalid response from GitHub API");
  }

  return data.data.viewer.login;
}

function showConnectedState(username) {
  const statusEl = document.getElementById("status");
  const setupForm = document.getElementById("setup-form");
  const connectedView = document.getElementById("connected-view");
  const usernameInput = document.getElementById("username");

  statusEl.textContent = "Connected to GitHub";
  statusEl.className = "Flash Flash--success";
  setupForm.style.display = "none";
  connectedView.style.display = "block";
  usernameInput.value = username;
}

function showDisconnectedState() {
  const statusEl = document.getElementById("status");
  const setupForm = document.getElementById("setup-form");
  const connectedView = document.getElementById("connected-view");

  statusEl.textContent = "Not connected to GitHub";
  statusEl.className = "Flash Flash--warning";
  setupForm.style.display = "block";
  connectedView.style.display = "none";
}

function showError(message) {
  const errorMessage = document.getElementById("error-message");
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

function hideError() {
  const errorMessage = document.getElementById("error-message");
  errorMessage.style.display = "none";
}
