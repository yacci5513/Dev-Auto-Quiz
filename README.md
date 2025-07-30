# 🤖 Auto Quiz Generator

GPT-4와 OpenAI TTS를 활용한 자동 퀴즈 영상 생성 시스템

AI를 활용하여 흥미로운 퀴즈를 생성하고, TTS로 음성을 만들어 YouTube 쇼츠 형태의 영상을 자동으로 제작하는 시스템입니다.

## ✨ 주요 기능

- 🎯 **GPT-4 퀴즈 생성**: 28개 카테고리의 흥미로운 한국어 퀴즈 자동 생성
- 🎤 **OpenAI TTS**: Echo 음성으로 자연스러운 한국어 발음 (1.15x 속도)
- 🎬 **자동 영상 생성**: YouTube 쇼츠 규격 (1080x1920) 고품질 영상
- 📤 **YouTube 자동 업로드**: API를 통한 자동 업로드 (선택사항)
- ⏰ **스케줄링**: 매일 오전 9시, 오후 6시 자동 실행
- 🎨 **프로페셔널 디자인**: 그라데이션 배경과 모던한 UI
- 🔄 **완벽한 동기화**: ffprobe 기반 정확한 오디오-비디오 동기화

## 🚀 설치 및 설정

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone https://github.com/yacci5513/Dev-Auto-Quiz.git
cd auto-quiz
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 설정하세요:

```env
OPENAI_API_KEY=your_openai_api_key_here
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URL=http://localhost:3000/oauth/callback
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
5. 승인된 리디렉션 URI에 `http://localhost:3000/oauth/callback` 추가
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

## 🎯 퀴즈 카테고리 (28개)

- 역사의 숨은 이야기
- 과학의 신비한 현상
- 동물들의 놀라운 능력
- 세계의 이상한 법률
- 음식의 흥미로운 기원
- 인체의 신기한 사실
- 우주의 미스터리
- 언어의 재미있는 특징
- 영화와 드라마 뒷이야기
- 스포츠의 숨겨진 규칙
- 브랜드와 로고의 비밀
- 날씨와 자연현상
- 게임과 놀이의 역사
- 교통수단의 흥미로운 사실
- 색깔과 심리학
- 음악의 신기한 효과
- 건강과 의학 상식
- 심리학 재미있는 이야기

## 📱 영상 스펙

- **해상도**: 1080x1920 (YouTube 쇼츠)
- **프레임레이트**: 30fps
- **오디오**: AAC, Echo 음성 1.15x 속도
- **비디오**: H.264, YUV420P
- **구성**: 질문 화면 + 답변/설명 화면 (실제 오디오 길이 기반)
- **디자인**: 그라데이션 배경, 드롭섀도우, 글로우 효과

## 🔧 커스터마이징

### 퀴즈 카테고리 추가
`src/modules/quizGenerator.js`의 `quizCategories` 배열을 수정하세요.

### 영상 스타일 변경
`src/modules/videoGenerator.js`의 `videoConfig` 객체를 수정하세요.

### 스케줄 변경
`src/scheduler.js`의 cron 표현식을 수정하세요.

## 📊 로그

실행 결과는 `logs/quiz_automation.log` 파일에 JSON 형태로 저장됩니다.

## ⚙️ 주요 기술

- **Node.js**: 메인 런타임
- **OpenAI GPT-4**: 퀴즈 생성
- **OpenAI TTS**: 음성 합성 (Echo 음성)
- **Sharp**: 이미지/프레임 생성
- **FFmpeg**: 영상 합성 및 인코딩
- **@ffprobe-installer/ffprobe**: 오디오 길이 분석
- **YouTube Data API v3**: 자동 업로드
- **Node-cron**: 스케줄링

## ⚠️ 주의사항

- OpenAI API 사용량에 따른 비용이 발생할 수 있습니다
- YouTube API에는 일일 할당량 제한이 있습니다
- 영상 생성 시 시스템 리소스를 많이 사용합니다
- Windows Defender에서 FFmpeg/FFprobe를 차단할 수 있으니 예외 처리하세요

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

## 🆘 문제 해결

### Windows 환경에서 FFmpeg 오류
- `@ffprobe-installer/ffprobe` 패키지가 자동으로 설치됩니다
- Windows Defender에서 차단될 수 있으니 예외 처리하세요

### API 키 오류
- `.env` 파일의 API 키가 올바른지 확인하세요
- OpenAI 계정에 충분한 크레딧이 있는지 확인하세요

### 오디오-비디오 동기화 문제
- ffprobe를 통해 실제 오디오 길이를 측정하여 완벽하게 동기화됩니다
- 기존 파일 크기 기반 추정 방식보다 정확합니다

---

**🎯 AI로 재미있고 교육적인 퀴즈 영상을 자동으로 만들어보세요! 🤖**

*Made with ❤️ by Claude Code*