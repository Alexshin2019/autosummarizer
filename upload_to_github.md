# GitHub 업로드 가이드

## 방법 1: GitHub Desktop (가장 간단)

1. https://desktop.github.com/ 다운로드 및 설치
2. GitHub Desktop 실행
3. File → Add Local Repository
4. `d:\iushin\pagesummary` 선택
5. Publish repository 클릭하여 GitHub에 업로드

## 방법 2: Git 명령어 (설치 필요)

```bash
cd d:\iushin\pagesummary

# Git 저장소 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "feat: Auto Summarizer Chrome Extension

- 자동 요약 기능
- 다국어 번역 지원 (7개 언어)
- 독특한 아이디어 3개 생성
- 핵심요약 공유 기능
- 온/오프 토글 기능
- 팝업 UI"

# GitHub에 새 저장소 생성 후 아래 명령어 실행
# git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
# git branch -M main
# git push -u origin main
```

## 방법 3: GitHub 웹에서 직접 업로드

1. https://github.com/new 접속하여 새 저장소 생성
2. "uploading an existing file" 클릭
3. 다음 파일들을 드래그 앤 드롭:
   - manifest.json
   - background.js
   - content.js
   - options.html
   - options.js
   - popup.html
   - popup.js
   - README.md
   - .gitignore
   - images/ 폴더 (모든 이미지 파일)
4. "Commit changes" 클릭

## 업로드해야 할 파일 목록

- ✅ manifest.json
- ✅ background.js
- ✅ content.js
- ✅ options.html
- ✅ options.js
- ✅ popup.html
- ✅ popup.js
- ✅ README.md
- ✅ .gitignore
- ✅ images/pagesummary 36.png
- ✅ images/pagesummary 48.png
- ✅ images/pagesummary 128.png

## 제외할 파일

- ❌ autoSummarizer.zip (생성된 ZIP 파일)

