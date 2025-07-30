#!/usr/bin/env node

const { program } = require('commander');
const QuizScheduler = require('./scheduler');
const YouTubeUploader = require('./modules/youtubeUploader');

program
    .name('auto-quiz')
    .description('자동화된 퀴즈 영상 생성 및 YouTube 업로드 도구')
    .version('1.0.0');

program
    .command('run')
    .description('퀴즈 영상을 한 번 생성하고 업로드')
    .action(async () => {
        const scheduler = new QuizScheduler();
        await scheduler.testRun();
    });

program
    .command('start')
    .description('스케줄러를 시작하여 자동으로 퀴즈 영상 생성')
    .action(() => {
        const scheduler = new QuizScheduler();
        scheduler.startScheduler();
        
        console.log('🔄 스케줄러가 실행 중입니다...');
        console.log('프로그램을 종료하려면 Ctrl+C를 누르세요.');
        
        process.on('SIGINT', () => {
            console.log('\n👋 스케줄러를 종료합니다.');
            process.exit(0);
        });
        
        setInterval(() => {}, 1000);
    });

program
    .command('auth')
    .description('YouTube API 인증 설정')
    .action(async () => {
        const uploader = new YouTubeUploader();
        
        try {
            const authUrl = await uploader.getAuthUrl();
            console.log('🔐 YouTube 인증이 필요합니다.');
            console.log('다음 URL로 이동하여 인증 코드를 받아주세요:');
            console.log(authUrl);
            console.log('');
            console.log('인증 코드를 받은 후, 다음 명령어를 실행하세요:');
            console.log('node src/cli.js set-token <인증_코드>');
        } catch (error) {
            console.error('❌ 인증 URL 생성 오류:', error);
        }
    });

program
    .command('set-token <code>')
    .description('YouTube 인증 코드 설정')
    .action(async (code) => {
        const uploader = new YouTubeUploader();
        
        try {
            await uploader.setCredentials(code);
            console.log('✅ YouTube 인증이 완료되었습니다!');
            console.log('이제 "node src/cli.js run" 또는 "node src/cli.js start" 명령어를 사용할 수 있습니다.');
        } catch (error) {
            console.error('❌ 인증 설정 오류:', error);
        }
    });

program
    .command('setup')
    .description('초기 설정 가이드')
    .action(() => {
        console.log('🚀 Auto Quiz Generator 설정 가이드');
        console.log('');
        console.log('1. 환경 변수 설정:');
        console.log('   .env 파일을 생성하고 다음 값들을 설정하세요:');
        console.log('   - OPENAI_API_KEY: OpenAI API 키');
        console.log('   - YOUTUBE_CLIENT_ID: YouTube API 클라이언트 ID');
        console.log('   - YOUTUBE_CLIENT_SECRET: YouTube API 클라이언트 시크릿');
        console.log('   - YOUTUBE_REDIRECT_URI: http://localhost:3000/oauth2callback');
        console.log('');
        console.log('2. 의존성 설치:');
        console.log('   npm install');
        console.log('');
        console.log('3. YouTube 인증:');
        console.log('   node src/cli.js auth');
        console.log('');
        console.log('4. 테스트 실행:');
        console.log('   node src/cli.js run');
        console.log('');
        console.log('5. 자동화 시작:');
        console.log('   node src/cli.js start');
    });

program.parse();