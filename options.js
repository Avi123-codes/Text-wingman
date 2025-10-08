// options.js
document.addEventListener("DOMContentLoaded", async () => {
  const keyInput = document.getElementById("key");
  const modelInput = document.getElementById("model");
  const tempInput = document.getElementById("temp");
  const saveBtn = document.getElementById("save");
  const msg = document.getElementById("msg");

  const cfg = await chrome.storage.sync.get({ geminiApiKey: "", model: "gemini-2.5-flash", temperature: 0.6 });
  keyInput.value = cfg.geminiApiKey || "";
  modelInput.value = cfg.model || "gemini-2.5-flash";
  tempInput.value = cfg.temperature ?? 0.6;

  saveBtn.addEventListener("click", async () => {
    const apiKey = keyInput.value.trim();
    const model = modelInput.value.trim() || "gemini-2.5-flash";
    const temperature = parseFloat(tempInput.value) || 0.6;
    await chrome.storage.sync.set({ geminiApiKey: apiKey, model, temperature });
    msg.textContent = "Saved.";
    setTimeout(() => (msg.textContent = ""), 2500);
  });
});

