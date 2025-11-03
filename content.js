(function () {
    // 사이트별 제외(로그인/사내툴 등) 예시
    const BLOCK_LIST = [/^chrome:\/\//, /accounts\.google\.com/];
    if (BLOCK_LIST.some(rx => rx.test(location.href))) return;
  
    // 옵션 불러오기
    chrome.storage.sync.get({
      enableExtension: true,
      autoDelayMs: 3000,
      enableAuto: true,
      charLimit: 8000,
      lang: "ko"
    }, (opts) => {
      console.log("[Auto Summary] 설정 로드됨:", opts);
      
      // 확장 프로그램이 꺼져있으면 아무것도 하지 않음
      if (!opts.enableExtension) {
        console.log("[Auto Summary] 확장 프로그램이 비활성화되어 있습니다.");
        return;
      }
      
      if (!opts.enableAuto) {
        console.log("[Auto Summary] 자동 요약이 비활성화되어 있습니다.");
        return;
      }
  
      console.log(`[Auto Summary] ${opts.autoDelayMs}ms 후 요약 시작...`);
      
      setTimeout(async () => {
        try {
          console.log("[Auto Summary] 요약 시작");
          const text = extractMainText(document);
          console.log(`[Auto Summary] 추출된 텍스트 길이: ${text.length}`);
          
          if (!text || text.trim().length === 0) {
            showOverlay("요약할 텍스트를 찾을 수 없습니다.", true);
            console.warn("[Auto Summary] 텍스트가 비어있음");
            return;
          }
          
          const clipped = text.slice(0, opts.charLimit);
          showOverlay("요약 중…");
          
          // 타임아웃 설정 (30초 후 타임아웃)
          const timeoutId = setTimeout(() => {
            console.warn("[Auto Summary] 요약 타임아웃");
            showOverlay("요약 시간 초과. 다시 시도해주세요.", true);
          }, 30000);
  
          chrome.runtime.sendMessage(
            { type: "SUMMARIZE_REQUEST", text: clipped, lang: opts.lang },
            (res) => {
              clearTimeout(timeoutId); // 타임아웃 제거 (에러든 성공이든 항상)
              
              if (chrome.runtime.lastError) {
                console.error("[Auto Summary] 런타임 오류:", chrome.runtime.lastError.message);
                showOverlay(`요약 실패: ${chrome.runtime.lastError.message}`, true);
                return;
              }
              
              if (!res || !res.ok) {
                console.error("[Auto Summary] 요약 실패:", res?.error);
                showOverlay(`요약 실패: ${res?.error || "알 수 없는 오류"}`, true);
              } else {
                console.log("[Auto Summary] 요약 완료");
                showOverlay(res.summary, false, res.ideas, opts.lang);
              }
            }
          );
        } catch (e) {
          console.error("[Auto Summary] 예외 발생:", e);
          if (timeoutId) clearTimeout(timeoutId);
          showOverlay(`요약 실패: ${e.message}`, true);
        }
      }, opts.autoDelayMs);
    });
  
    function extractMainText(doc) {
      // 빠른 최소구현: 본문 비가시 영역/네비 제외 가벼운 필터
      const clone = doc.body.cloneNode(true);
  
      // 스크립트/스타일 제거
      clone.querySelectorAll('script,style,noscript,svg,canvas,header,footer,nav,aside').forEach(n => n.remove());
  
      // 너무 긴 메뉴/리스트 제거(대략적)
      clone.querySelectorAll('ul,ol').forEach(list => {
        if (list.textContent.length < 200) return;
        list.remove();
      });
  
      let text = clone.innerText
        .replace(/\s+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      return text;
    }
  
    // 언어별 라벨 매핑
    const labels = {
      ko: { keySummary: "핵심요약:", share: "공유", ideas: "💡 독특한 아이디어 3개", translate: "번역", translating: "번역 중..." },
      en: { keySummary: "Key Summary:", share: "Share", ideas: "💡 Unique Ideas (3)", translate: "Translate", translating: "Translating..." },
      ja: { keySummary: "要点:", share: "共有", ideas: "💡 ユニークなアイデア 3つ", translate: "翻訳", translating: "翻訳中..." },
      zh: { keySummary: "核心摘要:", share: "分享", ideas: "💡 独特想法 3个", translate: "翻译", translating: "翻译中..." },
      es: { keySummary: "Resumen Clave:", share: "Compartir", ideas: "💡 Ideas Únicas (3)", translate: "Traducir", translating: "Traduciendo..." },
      fr: { keySummary: "Résumé Clé:", share: "Partager", ideas: "💡 Idées Uniques (3)", translate: "Traduire", translating: "Traduction..." },
      de: { keySummary: "Zusammenfassung:", share: "Teilen", ideas: "💡 Einzigartige Ideen (3)", translate: "Übersetzen", translating: "Übersetzung läuft..." }
    };
    
    function showOverlay(content, isError=false, ideas="", lang="ko") {
      const currentLabels = labels[lang] || labels.ko;
      let box = document.getElementById("auto-sum-overlay");
      if (!box) {
        box = document.createElement("div");
        box.id = "auto-sum-overlay";
        Object.assign(box.style, {
          position: "fixed",
          top: "16px",
          right: "16px",
          width: "360px",
          maxHeight: "70vh",
          overflow: "auto",
          zIndex: 999999,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: "12px",
          padding: "12px 14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          fontSize: "14px",
          lineHeight: "1.45",
          color: "#111",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial"
        });
  
        // 헤더 영역 (닫기 버튼 공간 확보)
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.marginBottom = "12px";
        header.style.paddingBottom = "8px";
        header.style.paddingRight = "60px"; // 닫기 버튼 공간 확보
        header.style.borderBottom = "1px solid #e0e0e0";
        header.style.position = "relative";

        const title = document.createElement("div");
        title.textContent = "Auto Summary";
        title.style.fontWeight = "600";
        header.appendChild(title);

        // 번역 컨트롤 영역
        const translateControls = document.createElement("div");
        translateControls.style.display = "flex";
        translateControls.style.alignItems = "center";
        translateControls.style.gap = "6px";
        translateControls.style.flexShrink = "0"; // 축소 방지

        const langSelect = document.createElement("select");
        langSelect.id = "translateLang";
        langSelect.style.padding = "4px 6px";
        langSelect.style.border = "1px solid #ddd";
        langSelect.style.borderRadius = "4px";
        langSelect.style.fontSize = "12px";
        langSelect.style.width = "90px"; // 고정 너비
        langSelect.innerHTML = `
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        `;

        const translateBtn = document.createElement("button");
        // 초기 라벨은 현재 언어 기준
        translateBtn.textContent = `🌐 ${(labels[lang] || labels.ko).translate}`;
        translateBtn.style.cssText = "border: none; background: #2196F3; color: white; cursor: pointer; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; white-space: nowrap;";
        translateBtn.onmouseover = () => translateBtn.style.background = "#1976D2";
        translateBtn.onmouseout = () => translateBtn.style.background = "#2196F3";

        translateControls.appendChild(langSelect);
        translateControls.appendChild(translateBtn);
        header.appendChild(translateControls);

        // 닫기 버튼 (헤더 내부로 이동하여 겹침 방지)
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "✕";
        closeBtn.style.cssText = "position: absolute; top: 8px; right: 8px; border: none; background: #eee; cursor: pointer; padding: 4px 8px; border-radius: 8px; font-size: 12px; z-index: 10;";
        closeBtn.onclick = () => box.remove();

        const contentEl = document.createElement("div");
        contentEl.id = "auto-sum-content";

        box.appendChild(header);
        box.appendChild(closeBtn);
        box.appendChild(contentEl);
        document.body.appendChild(box);
        
        // 번역 버튼 이벤트는 나중에 설정 (원본 데이터가 필요)
        box._translateBtn = translateBtn;
        box._langSelect = langSelect;
        box._contentEl = contentEl;
      }
      
      // 원본 데이터 저장 (번역용) - "요약 중…"이나 빈 내용이 아닐 때만 저장
      const isLoadState = content === "요약 중…" || content.trim() === "요약 중…";
      
      if (!isLoadState && content && content.trim() && !isError) {
        // 실제 요약 내용일 때만 저장
        box._originalContent = content;
        box._originalIdeas = ideas || "";
        console.log("[Auto Summary] 원본 데이터 저장됨, 요약 길이:", content.length);
      } else if (isLoadState) {
        console.log("[Auto Summary] 로딩 상태이므로 원본 데이터 저장하지 않음");
      }
      
      // 번역 버튼 이벤트 설정
      const translateBtn = box._translateBtn;
      const langSelect = box._langSelect;
      // 언어 선택 초기값을 현재 언어로 설정하고 버튼 라벨 동기화
      if (langSelect && !langSelect._initialized) {
        langSelect.value = lang;
        langSelect._initialized = true;
        translateBtn.textContent = `🌐 ${(labels[lang] || labels.ko).translate}`;
        // 언어 변경 시 버튼 라벨 즉시 반영
        langSelect.addEventListener("change", () => {
          const l = labels[langSelect.value] || labels.ko;
          translateBtn.textContent = `🌐 ${l.translate}`;
        });
      }
      
      if (translateBtn && !translateBtn._listenerAdded) {
        translateBtn._listenerAdded = true;
          translateBtn.onclick = async () => {
          const targetLang = langSelect.value;
          
          // 원본 데이터 검증
          if (!box._originalContent || box._originalContent === "요약 중…" || box._originalContent.trim() === "요약 중…") {
            console.warn("[Auto Summary] 원본 내용이 없거나 로딩 중입니다.", box._originalContent);
            alert("요약이 완료된 후 번역해주세요.");
            return;
          }
          
          translateBtn.disabled = true;
          translateBtn.textContent = (labels[targetLang] || labels.ko).translating;
          translateBtn.style.background = "#999";
          
          // 로딩 상태 표시
          const contentEl = box._contentEl;
          if (contentEl) {
            contentEl.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">${(labels[targetLang] || labels.ko).translating}</div>`;
          }
          
          try {
            // 요약과 아이디어를 함께 번역
            const fullText = box._originalContent + (box._originalIdeas ? "\n\n💡 독특한 아이디어 3개\n" + box._originalIdeas : "");
            
            console.log("[Auto Summary] 번역 요청:", targetLang, "텍스트 길이:", fullText.length);
            console.log("[Auto Summary] 원본 내용 미리보기:", fullText.substring(0, 200));
            
            chrome.runtime.sendMessage(
              { type: "TRANSLATE_REQUEST", text: fullText, targetLang: targetLang },
              (res) => {
                console.log("[Auto Summary] 번역 응답:", res);
                translateBtn.disabled = false;
                translateBtn.textContent = `🌐 ${(labels[langSelect.value] || labels.ko).translate}`;
                translateBtn.style.background = "#2196F3";
                
                if (chrome.runtime.lastError) {
                  console.error("[Auto Summary] 번역 오류:", chrome.runtime.lastError.message);
                  if (contentEl) {
                    contentEl.innerHTML = `<div style="padding: 20px; color: #b00020;">번역 실패: ${chrome.runtime.lastError.message}</div>`;
                  }
                  return;
                }
                
                if (!res || !res.ok) {
                  console.error("[Auto Summary] 번역 실패:", res?.error);
                  if (contentEl) {
                    contentEl.innerHTML = `<div style="padding: 20px; color: #b00020;">번역 실패: ${res?.error || "알 수 없는 오류"}</div>`;
                  }
                  return;
                }
                
                if (!res.translated || res.translated.trim().length === 0) {
                  console.error("[Auto Summary] 번역 결과가 비어있습니다");
                  if (contentEl) {
                    contentEl.innerHTML = `<div style="padding: 20px; color: #b00020;">번역 결과가 비어있습니다.</div>`;
                  }
                  return;
                }
                
                console.log("[Auto Summary] 번역된 내용 미리보기:", res.translated.substring(0, 200));
                
                // 번역된 내용 파싱 (아이디어 부분 분리)
                const translatedText = res.translated;
                let translatedSummary = translatedText;
                let translatedIdeas = "";
                
                // 아이디어 섹션 찾기 (다양한 패턴 처리)
                const ideaPatterns = [
                  /💡\s*독특한\s*아이디어/i,
                  /💡\s*아이디어/i,
                  /독특한\s*아이디어/i,
                  /아이디어\s*3개/i,
                  /ideas?:?\s*3/i,
                  /💡/i,
                  /unique\s*ideas?:?\s*3/i,
                  /creative\s*ideas?:?\s*3/i
                ];
                
                for (const pattern of ideaPatterns) {
                  const match = translatedText.search(pattern);
                  if (match !== -1) {
                    const lines = translatedText.split('\n');
                    let ideaStartIndex = -1;
                    for (let i = 0; i < lines.length; i++) {
                      if (pattern.test(lines[i])) {
                        ideaStartIndex = i;
                        break;
                      }
                    }
                    if (ideaStartIndex !== -1) {
                      translatedSummary = lines.slice(0, ideaStartIndex).join('\n');
                      translatedIdeas = lines.slice(ideaStartIndex + 1).join('\n');
                      break;
                    }
                  }
                }
                
                console.log("[Auto Summary] 파싱된 요약 길이:", translatedSummary.length);
                console.log("[Auto Summary] 파싱된 아이디어 길이:", translatedIdeas.length);
                
                // 번역된 내용을 다시 표시 (원본 데이터는 유지)
                const originalContent = box._originalContent;
                const originalIdeas = box._originalIdeas;
                showOverlay(translatedSummary, false, translatedIdeas, targetLang);
                // 원본 데이터 복원 (다시 번역할 수 있도록)
                box._originalContent = originalContent;
                box._originalIdeas = originalIdeas;
                // 현재 번역 언어 저장
                box._currentLang = targetLang;
              }
            );
          } catch (e) {
            console.error("[Auto Summary] 번역 예외:", e);
            translateBtn.disabled = false;
            translateBtn.textContent = `🌐 ${(labels[langSelect.value] || labels.ko).translate}`;
            translateBtn.style.background = "#2196F3";
            const contentEl = box._contentEl;
            if (contentEl) {
              contentEl.innerHTML = `<div style="padding: 20px; color: #b00020;">번역 실패: ${e.message}</div>`;
            }
          }
        };
      }
      
      // contentEl 가져오기 (이미 box에 저장되어 있음)
      const contentEl = box._contentEl || document.getElementById("auto-sum-content");
      if (contentEl) {
        contentEl.textContent = "";
      }
      
      if (isError) {
        // 에러인 경우 단순 텍스트 표시
        const pre = document.createElement("pre");
        pre.textContent = content;
        pre.style.whiteSpace = "pre-wrap";
        pre.style.margin = 0;
        pre.style.color = "#b00020";
        contentEl.appendChild(pre);
      } else {
        // 정상 요약인 경우 핵심요약 부분을 강조
        const lines = content.split('\n');
        const summaryContainer = document.createElement("div");
        summaryContainer.style.lineHeight = "1.6";
        
        let inKeySummary = false;
        const keySummaryLines = [];
        const bulletLines = [];
        
        // "핵심요약:" 또는 "핵심 요약:" 라벨을 찾아 구분
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('핵심요약:') || line.includes('핵심 요약:')) {
            inKeySummary = true;
            // "핵심요약:" 라벨이 포함된 줄에서 라벨을 제거하고 내용만 추출
            let summaryText = line.replace(/핵심\s?요약\s*:/g, '').trim();
            if (summaryText) {
              // 같은 줄에 내용이 있으면 사용
              keySummaryLines.push(summaryText);
            } else {
              // 다음 줄에서 내용 가져오기
              for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim()) {
                  keySummaryLines.push(lines[j].trim());
                  break; // 첫 번째 비어있지 않은 줄만 가져옴
                }
              }
            }
            break;
          }
          if (!inKeySummary && line.trim()) {
            bulletLines.push(line);
          }
        }
        
        // 핵심요약 라벨을 찾지 못한 경우, 마지막 1줄만 핵심요약으로 처리
        if (keySummaryLines.length === 0) {
          const nonEmptyLines = lines.filter(l => l.trim());
          if (nonEmptyLines.length >= 1) {
            keySummaryLines.push(nonEmptyLines[nonEmptyLines.length - 1]); // 마지막 줄만
            bulletLines.length = Math.max(0, lines.length - 1);
          }
        }
        
        // 불릿 포인트 부분 표시
        if (bulletLines.length > 0) {
          const bulletDiv = document.createElement("div");
          bulletDiv.style.marginBottom = "12px";
          bulletDiv.style.fontSize = "14px";
          
          const bulletPre = document.createElement("pre");
          bulletPre.textContent = bulletLines.join('\n');
          bulletPre.style.whiteSpace = "pre-wrap";
          bulletPre.style.margin = 0;
          bulletPre.style.fontFamily = "inherit";
          bulletDiv.appendChild(bulletPre);
          summaryContainer.appendChild(bulletDiv);
        }
        
        // 핵심요약 부분 표시 (볼드체, 큰 폰트)
        if (keySummaryLines.length > 0) {
          const keySummaryDiv = document.createElement("div");
          keySummaryDiv.style.marginTop = "16px";
          keySummaryDiv.style.paddingTop = "16px";
          keySummaryDiv.style.borderTop = "2px solid #e0e0e0";
          
          // 핵심요약 헤더와 공유 버튼을 담는 컨테이너
          const headerRow = document.createElement("div");
          headerRow.style.display = "flex";
          headerRow.style.justifyContent = "space-between";
          headerRow.style.alignItems = "center";
          headerRow.style.marginBottom = "8px";
          
          const label = document.createElement("div");
          label.textContent = currentLabels.keySummary;
          label.style.fontWeight = "600";
          label.style.fontSize = "15px";
          label.style.color = "#333";
          headerRow.appendChild(label);
          
          // 핵심요약 공유 버튼
          const shareBtn = document.createElement("button");
          shareBtn.textContent = `📋 ${currentLabels.share}`;
          shareBtn.style.cssText = "border: none; background: #4CAF50; color: white; cursor: pointer; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; transition: background 0.2s;";
          shareBtn.onmouseover = () => shareBtn.style.background = "#45a049";
          shareBtn.onmouseout = () => shareBtn.style.background = "#4CAF50";
          
          // 핵심요약 텍스트 저장 (공유용)
          const keySummaryText = keySummaryLines.join('\n');
          
          shareBtn.onclick = async () => {
            try {
              await navigator.clipboard.writeText(keySummaryText);
              // 복사 완료 피드백
              const originalText = shareBtn.textContent;
              shareBtn.textContent = "✓ 복사됨!";
              shareBtn.style.background = "#2196F3";
              setTimeout(() => {
                shareBtn.textContent = originalText;
                shareBtn.style.background = "#4CAF50";
              }, 1500);
            } catch (err) {
              // 클립보드 API가 실패하면 fallback 방법 사용
              const textarea = document.createElement("textarea");
              textarea.value = keySummaryText;
              textarea.style.position = "fixed";
              textarea.style.opacity = "0";
              document.body.appendChild(textarea);
              textarea.select();
              try {
                document.execCommand('copy');
                const originalText = shareBtn.textContent;
                shareBtn.textContent = "✓ 복사됨!";
                shareBtn.style.background = "#2196F3";
                setTimeout(() => {
                  shareBtn.textContent = originalText;
                  shareBtn.style.background = "#4CAF50";
                }, 1500);
              } catch (e) {
                alert("복사에 실패했습니다. 수동으로 복사해주세요.");
              } finally {
                // textarea는 항상 제거
                if (document.body.contains(textarea)) {
                  document.body.removeChild(textarea);
                }
              }
            }
          };
          
          headerRow.appendChild(shareBtn);
          keySummaryDiv.appendChild(headerRow);
          
          const summaryText = document.createElement("div");
          summaryText.textContent = keySummaryText;
          summaryText.style.fontWeight = "700";
          summaryText.style.fontSize = "16px";
          summaryText.style.lineHeight = "1.7";
          summaryText.style.color = "#111";
          summaryText.style.whiteSpace = "pre-wrap";
          keySummaryDiv.appendChild(summaryText);
          
          summaryContainer.appendChild(keySummaryDiv);
        } else {
          // 구분을 못한 경우 전체를 표시
          const pre = document.createElement("pre");
          pre.textContent = content;
          pre.style.whiteSpace = "pre-wrap";
          pre.style.margin = 0;
          pre.style.fontFamily = "inherit";
          summaryContainer.appendChild(pre);
        }
        
        // 독특한 아이디어 3개 표시
        if (ideas && ideas.trim()) {
          const ideasDiv = document.createElement("div");
          ideasDiv.style.marginTop = "20px";
          ideasDiv.style.paddingTop = "20px";
          ideasDiv.style.borderTop = "2px solid #e0e0e0";
          
          const ideasLabel = document.createElement("div");
          ideasLabel.textContent = currentLabels.ideas;
          ideasLabel.style.fontWeight = "600";
          ideasLabel.style.fontSize = "15px";
          ideasLabel.style.marginBottom = "10px";
          ideasLabel.style.color = "#333";
          ideasDiv.appendChild(ideasLabel);
          
          const ideasText = document.createElement("div");
          ideasText.textContent = ideas.trim();
          ideasText.style.fontSize = "14px";
          ideasText.style.lineHeight = "1.7";
          ideasText.style.color = "#444";
          ideasText.style.whiteSpace = "pre-wrap";
          ideasDiv.appendChild(ideasText);
          
          summaryContainer.appendChild(ideasDiv);
        }
        
        contentEl.appendChild(summaryContainer);
      }
    }
  })();
  