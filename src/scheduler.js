const cron = require('node-cron');
const QuizGenerator = require('./modules/quizGenerator');
const TTSGenerator = require('./modules/ttsGenerator');
const VideoGenerator = require('./modules/videoGenerator');
const YouTubeUploader = require('./modules/youtubeUploader');

class QuizScheduler {
    constructor() {
        this.quizGenerator = new QuizGenerator();
        this.ttsGenerator = new TTSGenerator();
        this.videoGenerator = new VideoGenerator();
        this.youtubeUploader = new YouTubeUploader();
        this.isRunning = false;
    }

    async generateAndUploadQuiz() {
        if (this.isRunning) {
            console.log('⚠️ 이미 실행 중입니다. 스킵합니다.');
            return;
        }

        this.isRunning = true;
        
        try {
            console.log('🚀 자동 퀴즈 생성 시작...', new Date().toLocaleString());
            
            console.log('🎯 1단계: 퀴즈 생성');
            const quiz = await this.quizGenerator.generateQuiz();
            console.log(`✅ 퀴즈 생성 완료: ${quiz.title}`);
            
            console.log('🎙️ 2단계: 음성 생성');
            const audioFiles = await this.ttsGenerator.generateAudio(quiz);
            console.log('✅ 음성 생성 완료');
            
            console.log('🎬 3단계: 영상 생성');
            const videoPath = await this.videoGenerator.createVideo(quiz, audioFiles);
            console.log('✅ 영상 생성 완료');
            
            console.log('📤 4단계: YouTube 업로드');
            const uploadResult = await this.youtubeUploader.upload(videoPath, quiz.title);
            console.log('✅ YouTube 업로드 완료');
            
            console.log('🎉 모든 과정 완료!');
            console.log(`📺 영상 URL: ${uploadResult.url}`);
            
            this.logSuccess(quiz, uploadResult);
            
        } catch (error) {
            console.error('❌ 자동화 과정에서 오류 발생:', error);
            this.logError(error);
        } finally {
            this.isRunning = false;
        }
    }

    startScheduler() {
        console.log('📅 스케줄러 시작...');
        
        cron.schedule('0 9 * * *', () => {
            console.log('⏰ 스케줄된 작업 실행 (오전 9시)');
            this.generateAndUploadQuiz();
        });

        cron.schedule('0 18 * * *', () => {
            console.log('⏰ 스케줄된 작업 실행 (오후 6시)');
            this.generateAndUploadQuiz();
        });

        console.log('✅ 스케줄러 설정 완료');
        console.log('📋 스케줄: 매일 오전 9시, 오후 6시 자동 실행');
    }

    logSuccess(quiz, uploadResult) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            status: 'success',
            quiz: {
                title: quiz.title,
                category: quiz.category,
                question: quiz.question
            },
            upload: {
                videoId: uploadResult.videoId,
                url: uploadResult.url
            }
        };
        
        this.saveLog(logEntry);
    }

    logError(error) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            status: 'error',
            error: {
                message: error.message,
                stack: error.stack
            }
        };
        
        this.saveLog(logEntry);
    }

    saveLog(logEntry) {
        const fs = require('fs');
        const path = require('path');
        
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, 'quiz_automation.log');
        const logLine = JSON.stringify(logEntry) + '\n';
        
        fs.appendFileSync(logFile, logLine);
    }

    async testRun() {
        console.log('🧪 테스트 실행...');
        await this.generateAndUploadQuiz();
    }
}

module.exports = QuizScheduler;