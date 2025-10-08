chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "generate") {
    (async () => {
      try {
        const cfg = await chrome.storage.sync.get({
          geminiApiKey: "",
          model: "gemini-2.5-flash",
          temperature: 0.6
        });
        if (!cfg.geminiApiKey)
          return sendResponse({ ok: false, error: "No API key set." });

        const url =
          "https://generativelanguage.googleapis.com/v1beta/models/" +
          encodeURIComponent(cfg.model) +
          ":generateContent?key=" +
          encodeURIComponent(cfg.geminiApiKey);

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: msg.prompt }] }],
            generationConfig: { temperature: cfg.temperature }
          })
        });

        if (!res.ok)
          return sendResponse({
            ok: false,
            error: "Gemini API " + res.status
          });

        const data = await res.json();
        const txt =
          (data?.candidates?.[0]?.content?.parts || [])
            .map(p => p.text || "")
            .join("")
            .trim() || "";
        if (!txt) return sendResponse({ ok: false, error: "Empty reply" });

        sendResponse({ ok: true, text: txt });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true;
  }
});

chrome.commands.onCommand.addListener(cmd => {
  if (cmd === "toggle_panel") {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0])
        chrome.tabs.sendMessage(tabs[0].id, { type: "toggle_panel" });
    });
  }
});

