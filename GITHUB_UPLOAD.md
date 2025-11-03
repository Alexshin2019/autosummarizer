# GitHub 업로드 안내

## 현재 프로젝트 파일 목록

다음 파일들을 GitHub에 업로드해야 합니다:

### 필수 파일
- ✅ manifest.json
- ✅ background.js
- ✅ content.js
- ✅ options.html
- ✅ options.js
- ✅ popup.html
- ✅ popup.js
- ✅ README.md
- ✅ .gitignore

### 이미지 파일
- ✅ images/pagesummary 36.png
- ✅ images/pagesummary 48.png
- ✅ images/pagesummary 128.png

### 제외할 파일
- ❌ autoSummarizer.zip (생성된 ZIP 파일은 제외)

---

## GitHub 웹에서 직접 업로드하는 방법

### 1단계: GitHub 저장소 생성

1. https://github.com/new 접속
2. Repository name 입력 (예: `auto-summarizer`)
3. Public 또는 Private 선택
4. **"Create repository"** 클릭

### 2단계: 파일 업로드

1. 새로 생성된 저장소 페이지에서 **"uploading an existing file"** 클릭
   또는 페이지 하단의 **"upload files"** 버튼 클릭

2. 파일들을 드래그 앤 드롭:
   ```
   manifest.json
   background.js
   content.js
   options.html
   options.js
   popup.html
   popup.js
   README.md
   .gitignore
   ```

3. `images` 폴더 업로드:
   - "Add file" → "Upload files" 선택
   - `images` 폴더를 드래그하거나
   - `images/pagesummary 36.png`
   - `images/pagesummary 48.png`
   - `images/pagesummary 128.png` 개별 업로드

4. Commit message 입력:
   ```
   feat: Auto Summarizer Chrome Extension

   - 자동 요약 기능
   - 다국어 번역 지원 (7개 언어)
   - 독특한 아이디어 3개 생성
   - 핵심요약 공유 기능
   - 온/오프 토글 기능
   - 팝업 UI
   ```

5. **"Commit changes"** 클릭

---

## GitHub Desktop 사용 (더 쉬운 방법)

1. https://desktop.github.com/ 다운로드 및 설치
2. GitHub Desktop 실행
3. **File → Add Local Repository**
4. `d:\iushin\pagesummary` 선택
5. **"Publish repository"** 클릭
6. 저장소 이름 설정 후 **"Publish repository"** 클릭

---

## Git 설치 후 명령어 사용

Git을 설치하신 후 아래 명령어를 실행하세요:

```bash
cd d:\iushin\pagesummary
git init
git add .
git commit -m "feat: Auto Summarizer Chrome Extension with translation feature"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

