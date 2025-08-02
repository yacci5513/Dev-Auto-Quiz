require('dotenv').config();
const QuizGenerator = require('./modules/quizGenerator');
const TTSGenerator = require('./modules/ttsGenerator');
const VideoGenerator = require('./modules/videoGenerator');

class RandomQuizApp {
    constructor() {
        this.quizGenerator = new QuizGenerator();
        this.ttsGenerator = new TTSGenerator();
        this.videoGenerator = new VideoGenerator();
    }

    async generateRandomQuizVideo() {
        try {
            console.log('🎯 랜덤 흥미로운 퀴즈 생성 중...');
            const quiz = await this.quizGenerator.generateRandomInterestingQuiz();
            
            console.log('🎙️ 음성 생성 중...');
            const audioFiles = await this.ttsGenerator.generateAudio(quiz);
            
            console.log('🎬 영상 생성 중...');
            const videoPath = await this.videoGenerator.createVideo(quiz, audioFiles);
            
            console.log('✅ 완료! 랜덤 퀴즈 영상이 로컬에 저장되었습니다:');
            console.log(`📁 파일 위치: ${videoPath}`);
            console.log(`📝 퀴즈 제목: ${quiz.title}`);
            
        } catch (error) {
            console.error('❌ 오류 발생:', error);
        }
    }
}

const app = new RandomQuizApp();
app.generateRandomQuizVideo();