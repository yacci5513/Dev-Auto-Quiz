const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const sharp = require('sharp');
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
        const { width, height } = this.videoConfig;
        
        // SVG를 사용하여 이미지 생성
        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .title { font: bold 48px Arial; fill: white; text-anchor: middle; }
                    .question { font: 60px Arial; fill: white; text-anchor: middle; }
                    .option { font: 48px Arial; fill: white; text-anchor: middle; }
                    .timer { font: bold 40px Arial; fill: #ff6b6b; text-anchor: middle; }
                </style>
            </defs>
            <rect width="100%" height="100%" fill="${this.videoConfig.backgroundColor}"/>
            
            <text x="${width/2}" y="200" class="title">🤔 오늘의 퀴즈</text>
            
            <text x="${width/2}" y="350" class="question">${this.escapeHtml(quiz.question.substring(0, 50))}</text>
            ${quiz.question.length > 50 ? `<text x="${width/2}" y="430" class="question">${this.escapeHtml(quiz.question.substring(50))}</text>` : ''}
            
            ${quiz.options.map((option, index) => {
                const y = 600 + (index * 120);
                return `
                    <rect x="100" y="${y - 40}" width="${width - 200}" height="80" fill="${this.videoConfig.accentColor}"/>
                    <text x="${width/2}" y="${y + 10}" class="option">${this.escapeHtml(option)}</text>
                `;
            }).join('')}
            
            <text x="${width/2}" y="${height - 200}" class="timer">⏰ 3초 후 정답 공개!</text>
        </svg>`;

        const framePath = path.join(this.frameDir, 'question_frame.png');
        await sharp(Buffer.from(svg))
            .png()
            .toFile(framePath);
        
        return framePath;
    }

    async createAnswerFrames(quiz) {
        const { width, height } = this.videoConfig;
        const answerLetter = quiz.correctAnswer.charAt(0);
        const correctOption = quiz.options.find(opt => opt.startsWith(answerLetter));
        
        const explanationLines = this.wrapText(quiz.explanation, 80);
        
        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .correct { font: bold 64px Arial; fill: #4ecdc4; text-anchor: middle; }
                    .answer { font: bold 52px Arial; fill: white; text-anchor: middle; }
                    .explanation { font: 42px Arial; fill: white; text-anchor: middle; }
                    .subscribe { font: bold 36px Arial; fill: #ff6b6b; text-anchor: middle; }
                </style>
            </defs>
            <rect width="100%" height="100%" fill="${this.videoConfig.backgroundColor}"/>
            
            <text x="${width/2}" y="200" class="correct">✅ 정답!</text>
            
            <text x="${width/2}" y="320" class="answer">${this.escapeHtml(correctOption || quiz.correctAnswer)}</text>
            
            ${explanationLines.map((line, index) => 
                `<text x="${width/2}" y="${450 + (index * 60)}" class="explanation">${this.escapeHtml(line)}</text>`
            ).join('')}
            
            <text x="${width/2}" y="${height - 150}" class="subscribe">👍 구독 &amp; 좋아요!</text>
        </svg>`;

        const framePath = path.join(this.frameDir, 'answer_frame.png');
        await sharp(Buffer.from(svg))
            .png()
            .toFile(framePath);
        
        return framePath;
    }

    wrapText(text, maxCharsPerLine) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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