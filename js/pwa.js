const installButton = document.getElementById("installAppBtn");
let installPrompt = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("PAMAC service worker registered"))
      .catch(error => console.error("PAMAC service worker error:", error));
  });
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;

  if (installButton) {
    installButton.style.display = "block";
  }
});

if (installButton) {
  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.style.display = "none";
  });
}

window.addEventListener("appinstalled", () => {
  if (installButton) {
    installButton.style.display = "none";
  }
  console.log("PAMAC app installed");
});
