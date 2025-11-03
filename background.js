// 기본 API 키
const DEFAULT_API_KEY = "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";

// OpenAI API 호출 헬퍼 함수
async function callOpenAI(openaiKey, modelName, messages, maxTokens = 800, temperature = 0.3) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization":`Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens
    })
  });
  
  console.log("[Auto Summary Background] API 응답 상태:", res.status);
  
  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("[Auto Summary Background] API 오류:", data.error || res.statusText);
    throw new Error(data.error?.message || `API error: ${res.status} ${res.statusText}`);
  }
  
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// OpenAI 호출 (필요 시 모델명 변경 가능)
async function summarizeWithOpenAI(text, lang="ko") {
    console.log("[Auto Summary Background] 설정 로드 중...");
    let { openaiKey, modelName, maxTokens } = await chrome.storage.sync.get({
      openaiKey: "",
      modelName: "gpt-4o-mini",
      maxTokens: 800
    });
    
    // API 키가 없거나 비어있으면 기본값으로 저장
    if (!openaiKey || openaiKey.trim() === "") {
      console.log("[Auto Summary Background] API 키가 없어 기본값으로 저장합니다.");
      openaiKey = DEFAULT_API_KEY;
      await chrome.storage.sync.set({ openaiKey: DEFAULT_API_KEY });
    }
    
    console.log("[Auto Summary Background] API 키 존재:", !!openaiKey, "모델:", modelName);
  
    const prompt = [
      { role: "system", content: "You are a factually accurate web page summarizer. Always maintain factual accuracy and never change the subject-object relationships or reverse facts from the original text." },
      { role: "user", content:
        `언어: ${lang}\n아래 웹페이지 본문을 정확하게 5~8개 불릿과 1줄 핵심요약으로 간결히 요약해줘.\n\n` +
        `**중요: 사실 정확성 필수**\n` +
        `- 원문의 사실을 정확히 전달해야 합니다\n` +
        `- 주어와 목적어, 관계(누가 누구에게 무엇을 했는지)를 정확히 파악하고 그대로 유지해야 합니다\n` +
        `- 추측하거나 가정하지 말고 원문에 명시된 사실만 전달하세요\n` +
        `- 정보의 방향성을 뒤바꾸지 마세요 (예: A가 B에게 선물 → B가 A에게 선물로 변경 금지)\n` +
        `- 핵심 키워드/숫자/링크(있으면) 포함\n` +
        `- 클릭 유도형 문구 금지\n` +
        `- 정확/중립\n` +
        `- 마지막에 "핵심요약:" 라벨을 붙이고 그 아래에 1줄로 핵심요약을 작성해줘\n\n` +
        `---\n${text}` }
    ];
  
    console.log("[Auto Summary Background] 요약 API 호출 시작...");
    // 사실 정확성을 위해 온도를 낮춤 (0.3 → 0.2)
    const summary = await callOpenAI(openaiKey, modelName, prompt, maxTokens, 0.2);
    console.log("[Auto Summary Background] 요약 생성 완료, 길이:", summary.length);
    return summary;
  }

// 텍스트 번역 함수
async function translateText(text, targetLang="ko") {
    console.log("[Auto Summary Background] 번역 시작:", targetLang);
    let { openaiKey, modelName } = await chrome.storage.sync.get({
      openaiKey: "",
      modelName: "gpt-4o-mini"
    });
    
    if (!openaiKey || openaiKey.trim() === "") {
      openaiKey = DEFAULT_API_KEY;
    }
    
    const langNames = {
      "ko": "Korean",
      "en": "English",
      "ja": "Japanese",
      "zh": "Chinese",
      "es": "Spanish",
      "fr": "French",
      "de": "German"
    };
    
    const targetLangName = langNames[targetLang] || targetLang;
    
    const prompt = [
      { role: "system", content: "You are a professional translator. Translate the given text accurately to the target language while preserving the exact format, structure, bullets, line breaks, and all formatting. Output ONLY the translated text without any explanations, comments, or additional text." },
      { role: "user", content:
        `Translate this text to ${targetLangName}:\n\n` +
        `${text}\n\n` +
        `Instructions:\n` +
        `- Translate accurately to ${targetLangName}\n` +
        `- Keep all formatting (bullets, line breaks, structure) exactly as is\n` +
        `- Output ONLY the translation, nothing else\n` +
        `- Do not add any comments or explanations` }
    ];
    
    const translated = await callOpenAI(openaiKey, modelName, prompt, 3000, 0.3);
    console.log("[Auto Summary Background] 번역 완료, 길이:", translated.length);
    
    if (!translated || translated.trim().length === 0) {
      throw new Error("번역 결과가 비어있습니다.");
    }
    
    return translated;
  }

// 요약 내용을 바탕으로 독특한 아이디어 3개 생성
async function generateIdeas(summary, text, lang="ko") {
    console.log("[Auto Summary Background] 아이디어 생성 시작...");
    let { openaiKey, modelName } = await chrome.storage.sync.get({
      openaiKey: "",
      modelName: "gpt-4o-mini"
    });
    
    if (!openaiKey || openaiKey.trim() === "") {
      openaiKey = DEFAULT_API_KEY;
    }
    
    const prompt = [
      { role: "system", content: "You are a creative idea generator." },
      { role: "user", content:
        `언어: ${lang}\n아래 요약 내용을 바탕으로 독특하고 실용적인 아이디어 3개를 제시해줘.\n` +
        `- 각 아이디어는 1~2줄로 간결하게 작성\n` +
        `- 창의적이고 실행 가능한 아이디어\n` +
        `- 번호 없이 "- "로 시작하는 불릿 포인트 형식\n` +
        `- 요약 내용과 관련된 구체적인 아이디어\n\n` +
        `요약 내용:\n${summary}\n\n` +
        `원본 텍스트 일부:\n${text.slice(0, 1000)}` }
    ];
    
    const ideas = await callOpenAI(openaiKey, modelName, prompt, 400, 0.7);
    console.log("[Auto Summary Background] 아이디어 생성 완료");
    return ideas;
  }
  
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("[Auto Summary Background] 메시지 수신:", msg.type);
    
    (async () => {
      if (msg.type === "SUMMARIZE_REQUEST") {
        try {
          console.log("[Auto Summary Background] 요약 요청 처리 시작");
          const summary = await summarizeWithOpenAI(msg.text, msg.lang);
          console.log("[Auto Summary Background] 요약 완료, 길이:", summary.length);
          
          // 요약 완료 후 아이디어 생성
          let ideas = "";
          try {
            ideas = await generateIdeas(summary, msg.text, msg.lang);
          } catch (e) {
            console.warn("[Auto Summary Background] 아이디어 생성 실패 (계속 진행):", e.message);
            // 아이디어 생성 실패해도 요약은 반환
          }
          
          sendResponse({ ok: true, summary, ideas });
        } catch (e) {
          console.error("[Auto Summary Background] 오류:", e);
          sendResponse({ ok: false, error: e.message });
        }
      } else if (msg.type === "TRANSLATE_REQUEST") {
        try {
          console.log("[Auto Summary Background] 번역 요청 처리 시작");
          const translated = await translateText(msg.text, msg.targetLang);
          sendResponse({ ok: true, translated });
        } catch (e) {
          console.error("[Auto Summary Background] 번역 오류:", e);
          sendResponse({ ok: false, error: e.message });
        }
      } else {
        console.warn("[Auto Summary Background] 알 수 없는 메시지 타입:", msg.type);
        sendResponse({ ok: false, error: "알 수 없는 요청 타입" });
      }
    })();
    // 비동기 응답 허용
    return true;
  });
  