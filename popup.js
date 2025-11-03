// UI 요소
const enableExtension = document.getElementById("enableExtension");
const toggleSwitch = document.getElementById("toggleSwitch");
const toggleContainer = document.getElementById("toggleContainer");
const status = document.getElementById("status");
const optionsBtn = document.getElementById("optionsBtn");

// 상태 표시 함수
function showStatus(message, isSuccess = false, isError = false) {
  status.textContent = message;
  status.className = "status";
  if (isSuccess) status.className += " success";
  if (isError) status.className += " error";
  
  if (message) {
    setTimeout(() => {
      status.textContent = "";
      status.className = "status";
    }, 2000);
  }
}

// 토글 스위치 업데이트
function updateToggle(isEnabled) {
  enableExtension.checked = isEnabled;
  toggleSwitch.classList.toggle("active", isEnabled);
}

// 설정 불러오기
async function loadSettings() {
  try {
    const conf = await chrome.storage.sync.get({
      enableExtension: true
    });
    updateToggle(conf.enableExtension);
  } catch (err) {
    console.error("설정 로드 실패:", err);
    showStatus("설정을 불러올 수 없습니다", false, true);
  }
}

// 확장 프로그램 토글
async function toggleExtension() {
  const newState = !enableExtension.checked;
  
  try {
    await chrome.storage.sync.set({ enableExtension: newState });
    updateToggle(newState);
    showStatus(
      newState ? "✓ 활성화됨" : "✓ 비활성화됨",
      true,
      false
    );
  } catch (err) {
    console.error("설정 저장 실패:", err);
    showStatus("설정 저장에 실패했습니다", false, true);
  }
}

// 이벤트 리스너
toggleContainer.addEventListener("click", toggleExtension);
enableExtension.addEventListener("change", toggleExtension);

// 설정 버튼 클릭
optionsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// 초기 로드
loadSettings();

