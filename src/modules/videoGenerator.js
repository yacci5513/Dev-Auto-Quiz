const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegStatic);

class VideoGenerator {
    constructor() {
        this.outputDir = path.join(process.cwd(), 'output', 'videos');
        this.frameDir = path.join(process.cwd(), 'output', 'frames');
        this.ensureOutputDirs();
        
        this.videoConfig = {
            width: 1080,
            height: 1920,
            fps: 30,
            backgroundColor: '#1a1a2e',
            textColor: '#ffffff',
            accentColor: '#16213e'
        };
    }

    ensureOutputDirs() {
        [this.outputDir, this.frameDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async createVideo(quiz, audioFiles) {
        try {
            const timestamp = Date.now();
            const videoFileName = `quiz_${timestamp}.mp4`;
            const videoPath = path.join(this.outputDir, videoFileName);

            console.log('🎨 질문 화면 생성 중...');
            const questionFrames = await this.createQuestionFrames(quiz);
            
            console.log('🎯 답변 화면 생성 중...');
            const answerFrames = await this.createAnswerFrames(quiz);

            console.log('🎬 영상 합성 중...');
            await this.combineFramesWithAudio(
                questionFrames, 
                answerFrames, 
                audioFiles, 
                videoPath
            );

            this.cleanupFrames();
            
            console.log(`✅ 영상 생성 완료: ${videoFileName}`);
            return videoPath;

        } catch (error) {
            console.error('영상 생성 오류:', error);
            throw error;
        }
    }

    async createQuestionFrames(quiz) {
        const canvas = createCanvas(this.videoConfig.width, this.videoConfig.height);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = this.videoConfig.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = this.videoConfig.textColor;
        ctx.textAlign = 'center';
        
        ctx.font = 'bold 48px Arial';
        ctx.fillText('🤔 오늘의 퀴즈', canvas.width / 2, 200);
        
        const questionLines = this.wrapText(ctx, quiz.question, canvas.width - 100, 60);
        ctx.font = '60px Arial';
        questionLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, 350 + (index * 80));
        });

        ctx.font = '48px Arial';
        quiz.options.forEach((option, index) => {
            const y = 600 + (index * 120);
            
            ctx.fillStyle = this.videoConfig.accentColor;
            ctx.fillRect(100, y - 40, canvas.width - 200, 80);
            
            ctx.fillStyle = this.videoConfig.textColor;
            ctx.fillText(option, canvas.width / 2, y + 10);
        });

        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('⏰ 3초 후 정답 공개!', canvas.width / 2, canvas.height - 200);

        const frameBuffer = canvas.toBuffer('image/png');
        const framePath = path.join(this.frameDir, 'question_frame.png');
        fs.writeFileSync(framePath, frameBuffer);
        
        return framePath;
    }

    async createAnswerFrames(quiz) {
        const canvas = createCanvas(this.videoConfig.width, this.videoConfig.height);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = this.videoConfig.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = this.videoConfig.textColor;
        ctx.textAlign = 'center';
        
        ctx.font = 'bold 64px Arial';
        ctx.fillStyle = '#4ecdc4';
        ctx.fillText('✅ 정답!', canvas.width / 2, 200);
        
        const answerLetter = quiz.correctAnswer.charAt(0);
        const correctOption = quiz.options.find(opt => opt.startsWith(answerLetter));
        
        ctx.font = 'bold 52px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(correctOption, canvas.width / 2, 320);

        const explanationLines = this.wrapText(ctx, quiz.explanation, canvas.width - 100, 42);
        ctx.font = '42px Arial';
        explanationLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, 450 + (index * 60));
        });

        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('👍 구독 & 좋아요!', canvas.width / 2, canvas.height - 150);

        const frameBuffer = canvas.toBuffer('image/png');
        const framePath = path.join(this.frameDir, 'answer_frame.png');
        fs.writeFileSync(framePath, frameBuffer);
        
        return framePath;
    }

    wrapText(ctx, text, maxWidth, fontSize) {
        ctx.font = `${fontSize}px Arial`;
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    async combineFramesWithAudio(questionFrame, answerFrame, audioFiles, outputPath) {
        return new Promise((resolve, reject) => {
            const questionDuration = 8;
            const answerDuration = 15;
            
            ffmpeg()
                .input(questionFrame)
                .inputOptions(['-loop 1', '-t', questionDuration.toString()])
                .input(answerFrame)
                .inputOptions(['-loop 1', '-t', answerDuration.toString()])
                .input(audioFiles.question)
                .input(audioFiles.answer)
                .complexFilter([
                    '[0:v][1:v]concat=n=2:v=1:a=0[outv]',
                    '[2:a][3:a]concat=n=2:v=0:a=1[outa]'
                ])
                .outputOptions([
                    '-map [outv]',
                    '-map [outa]',
                    '-c:v libx264',
                    '-c:a aac',
                    '-r 30',
                    '-pix_fmt yuv420p'
                ])
                .output(outputPath)
                .on('end', () => {
                    console.log('✅ 영상 합성 완료');
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error('영상 합성 오류:', err);
                    reject(err);
                })
                .run();
        });
    }

    cleanupFrames() {
        try {
            const files = fs.readdirSync(this.frameDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(this.frameDir, file));
            });
        } catch (error) {
            console.warn('임시 파일 정리 중 오류:', error);
        }
    }
}

module.exports = VideoGenerator;