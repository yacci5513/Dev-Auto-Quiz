const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class TTSGenerator {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.outputDir = path.join(process.cwd(), 'output', 'audio');
        this.ensureOutputDir();
    }

    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async generateAudio(quiz) {
        try {
            const timestamp = Date.now();
            const audioFiles = {};

            console.log('🎤 질문 음성 생성 중...');
            const questionText = this.formatQuestionText(quiz);
            audioFiles.question = await this.createAudioFile(
                questionText, 
                `question_${timestamp}.mp3`
            );

            console.log('🎯 정답 및 설명 음성 생성 중...');
            const answerText = this.formatAnswerText(quiz);
            audioFiles.answer = await this.createAudioFile(
                answerText, 
                `answer_${timestamp}.mp3`
            );

            return audioFiles;

        } catch (error) {
            console.error('TTS 생성 오류:', error);
            throw error;
        }
    }

    formatQuestionText(quiz) {
        let text = `${quiz.question} `;
        
        quiz.options.forEach((option, index) => {
            text += `${option} `;
        });
        
        text += '정답은 무엇일까요?';
        
        return text;
    }

    formatAnswerText(quiz) {
        const answerLetter = quiz.correctAnswer.charAt(0);
        const correctOption = quiz.options.find(opt => opt.startsWith(answerLetter));
        
        let text = `정답은 ${quiz.correctAnswer}번입니다. `;
        text += quiz.explanation;
        
        return text;
    }

    async createAudioFile(text, filename) {
        try {
            const mp3 = await this.openai.audio.speech.create({
                model: "tts-1",
                voice: "nova",
                input: text,
                speed: 1.0
            });

            const filePath = path.join(this.outputDir, filename);
            const buffer = Buffer.from(await mp3.arrayBuffer());
            fs.writeFileSync(filePath, buffer);
            
            console.log(`✅ 음성 파일 생성: ${filename}`);
            return filePath;

        } catch (error) {
            console.error(`음성 파일 생성 실패 (${filename}):`, error);
            throw error;
        }
    }

    async getAudioDuration(filePath) {
        return new Promise((resolve, reject) => {
            const ffmpeg = require('fluent-ffmpeg');
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(metadata.format.duration);
                }
            });
        });
    }
}

module.exports = TTSGenerator;