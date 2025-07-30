# Auto Quiz Generator 🤖🎯

AI를 활용한 자동 퀴즈 영상 생성 및 YouTube 업로드 시스템입니다.
GPT를 이용해 흥미로운 퀴즈를 생성하고, TTS로 음성을 만들어 영상으로 제작한 후 YouTube에 자동 업로드합니다.

## ✨ 주요 기능

- 🧠 **AI 퀴즈 생성**: GPT-4를 사용하여 교육적이고 흥미로운 퀴즈 자동 생성
- 🎙️ **음성 합성**: OpenAI TTS를 활용한 자연스러운 한국어 음성 생성
- 🎬 **영상 제작**: 질문과 답변이 포함된 YouTube 쇼츠 형태의 영상 자동 생성
- 📤 **자동 업로드**: YouTube API를 통한 자동 업로드 및 메타데이터 설정
- ⏰ **스케줄링**: 정해진 시간에 자동으로 실행되는 스케줄링 기능
- 📊 **로깅**: 실행 결과 및 오류 로그 자동 저장

## 🚀 설치 및 설정

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone git@github.com:yacci5513/Dev-Auto-Quiz.git
cd auto-quiz
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 설정하세요:

```env
OPENAI_API_KEY=your_openai_api_key_here
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/oauth2callback
```

### 3. API 키 발급

#### OpenAI API 키
1. [OpenAI Platform](https://platform.openai.com/)에 접속
2. API Keys 섹션에서 새 키 생성
3. `.env` 파일의 `OPENAI_API_KEY`에 설정

#### YouTube API 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. YouTube Data API v3 활성화
4. 사용자 인증 정보 생성 (OAuth 2.0 클라이언트 ID)
5. 승인된 리디렉션 URI에 `http://localhost:3000/oauth2callback` 추가
6. 클라이언트 ID와 시크릿을 `.env` 파일에 설정

### 4. YouTube 인증

```bash
npm run auth
```

인증 URL이 표시되면 브라우저에서 접속하여 인증 코드를 받은 후:

```bash
node src/cli.js set-token <인증_코드>
```

## 🎮 사용법

### 한 번 실행
```bash
npm run run
```

### 자동 스케줄링 시작 (매일 오전 9시, 오후 6시)
```bash
npm run schedule
```

### 설정 가이드 보기
```bash
npm run setup
```

## 📁 프로젝트 구조

```
auto-quiz/
├── src/
│   ├── modules/
│   │   ├── quizGenerator.js      # GPT 퀴즈 생성
│   │   ├── ttsGenerator.js       # TTS 음성 생성
│   │   ├── videoGenerator.js     # 영상 제작
│   │   └── youtubeUploader.js    # YouTube 업로드
│   ├── index.js                  # 메인 애플리케이션
│   ├── scheduler.js              # 스케줄링 및 자동화
│   └── cli.js                    # CLI 인터페이스
├── output/                       # 생성된 파일들
│   ├── audio/                    # 음성 파일
│   ├── videos/                   # 영상 파일
│   └── frames/                   # 임시 프레임
├── config/                       # 설정 파일
├── logs/                         # 로그 파일
├── .env                          # 환경 변수
└── package.json
```

## 🎯 퀴즈 카테고리

- 역사의 숨은 이야기
- 과학의 신비한 현상
- 동물들의 놀라운 능력
- 세계의 이상한 법률
- 음식의 흥미로운 기원
- 인체의 신기한 사실
- 우주의 미스터리
- 언어의 재미있는 특징
- 건축물의 비밀
- 발명품의 뒷이야기

## 📱 영상 스펙

- **해상도**: 1080x1920 (세로형 - YouTube 쇼츠)
- **길이**: 약 20-25초
- **구성**: 질문 (8초) + 답변 및 설명 (15초)
- **음성**: OpenAI TTS (Nova 보이스)
- **디자인**: 깔끔한 텍스트 기반 UI

## 🔧 커스터마이징

### 퀴즈 카테고리 추가
`src/modules/quizGenerator.js`의 `quizCategories` 배열을 수정하세요.

### 영상 스타일 변경
`src/modules/videoGenerator.js`의 `videoConfig` 객체를 수정하세요.

### 스케줄 변경
`src/scheduler.js`의 cron 표현식을 수정하세요.

## 📊 로그

실행 결과는 `logs/quiz_automation.log` 파일에 JSON 형태로 저장됩니다.

## ⚠️ 주의사항

- OpenAI API 사용량에 따른 비용이 발생할 수 있습니다
- YouTube API에는 일일 할당량 제한이 있습니다
- 영상 생성 시 시스템 리소스를 많이 사용합니다
- FFmpeg가 시스템에 설치되어 있어야 합니다 (ffmpeg-static 패키지로 자동 처리)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 발생하거나 제안사항이 있으시면 GitHub Issues를 통해 알려주세요.

---

🎯 **재미있고 교육적인 퀴즈 영상을 자동으로 만들어보세요!** 🎯