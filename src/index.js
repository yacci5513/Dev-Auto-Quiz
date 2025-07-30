require('dotenv').config();
const QuizGenerator = require('./modules/quizGenerator');
const TTSGenerator = require('./modules/ttsGenerator');
const VideoGenerator = require('./modules/videoGenerator');
const YouTubeUploader = require('./modules/youtubeUploader');

class AutoQuizApp {
    constructor() {
        this.quizGenerator = new QuizGenerator();
        this.ttsGenerator = new TTSGenerator();
        this.videoGenerator = new VideoGenerator();
        this.youtubeUploader = new YouTubeUploader();
    }

    async generateQuizVideo() {
        try {
            console.log('🎯 퀴즈 생성 중...');
            const quiz = await this.quizGenerator.generateQuiz();
            
            console.log('🎙️ 음성 생성 중...');
            const audioFiles = await this.ttsGenerator.generateAudio(quiz);
            
            console.log('🎬 영상 생성 중...');
            const videoPath = await this.videoGenerator.createVideo(quiz, audioFiles);
            
            // YouTube 업로드는 일시적으로 주석 처리
            // console.log('📤 YouTube 업로드 중...');
            // const uploadResult = await this.youtubeUploader.upload(videoPath, quiz.title);
            // console.log('✅ 완료! 영상이 업로드되었습니다:', uploadResult.url);
            
            console.log('✅ 완료! 영상이 로컬에 저장되었습니다:');
            console.log(`📁 파일 위치: ${videoPath}`);
            console.log(`📝 퀴즈 제목: ${quiz.title}`);
            
        } catch (error) {
            console.error('❌ 오류 발생:', error);
        }
    }
}

const app = new AutoQuizApp();
app.generateQuizVideo();