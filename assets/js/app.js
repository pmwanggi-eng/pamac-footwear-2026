const themeButton = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("pamac-theme") || "light";

document.body.classList.toggle("dark", savedTheme === "dark");

themeButton.textContent =
  savedTheme === "dark" ? "☀️" : "🌙";

themeButton.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const currentTheme =
    document.body.classList.contains("dark") ? "dark" : "light";

  localStorage.setItem("pamac-theme", currentTheme);

  themeButton.textContent =
    currentTheme === "dark" ? "☀️" : "🌙";
});
