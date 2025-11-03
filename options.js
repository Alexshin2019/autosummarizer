const els = {
    extension: document.getElementById("enableExtension"),
    key: document.getElementById("openaiKey"),
    model: document.getElementById("modelName"),
    delay: document.getElementById("autoDelayMs"),
    max: document.getElementById("maxTokens"),
    lang: document.getElementById("lang"),
    enable: document.getElementById("enableAuto"),
    status: document.getElementById("status"),
    save: document.getElementById("saveBtn")
  };
  
  // 기본 API 키
  const DEFAULT_API_KEY = "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";
  
  (async function load() {
    const conf = await chrome.storage.sync.get({
      enableExtension: true,
      openaiKey: "",
      modelName: "gpt-4o-mini",
      autoDelayMs: 3000,
      maxTokens: 800,
      lang: "ko",
      enableAuto: true
    });
    
    // API 키가 없거나 비어있으면 기본값으로 저장
    if (!conf.openaiKey || conf.openaiKey.trim() === "") {
      conf.openaiKey = DEFAULT_API_KEY;
      await chrome.storage.sync.set({ openaiKey: DEFAULT_API_KEY });
    }
    
    els.extension.checked = conf.enableExtension;
    els.key.value = conf.openaiKey;
    els.model.value = conf.modelName;
    els.delay.value = conf.autoDelayMs;
    els.max.value = conf.maxTokens;
    els.lang.value = conf.lang;
    els.enable.checked = conf.enableAuto;
  })();
  
  els.save.addEventListener("click", async () => {
    await chrome.storage.sync.set({
      enableExtension: els.extension.checked,
      openaiKey: els.key.value.trim(),
      modelName: els.model.value.trim(),
      autoDelayMs: Number(els.delay.value),
      maxTokens: Number(els.max.value),
      lang: els.lang.value,
      enableAuto: els.enable.checked
    });
    els.status.textContent = "저장됨";
    setTimeout(()=> els.status.textContent="", 1500);
  });

  // 확장 프로그램 온/오프 즉시 저장 (저장 버튼 클릭 없이도)
  els.extension.addEventListener("change", async () => {
    await chrome.storage.sync.set({ enableExtension: els.extension.checked });
    els.status.textContent = els.extension.checked ? "활성화됨" : "비활성화됨";
    setTimeout(()=> els.status.textContent="", 1500);
  });
  