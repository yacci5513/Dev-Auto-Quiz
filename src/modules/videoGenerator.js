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
        
        // 텍스트 줄바꿈 처리
        const questionLines = this.wrapText(quiz.question, 25);
        const wrappedOptions = quiz.options.map(option => this.wrapText(option, 35));
        
        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .title { font: bold 44px Arial; fill: white; text-anchor: middle; }
                    .question { font: 48px Arial; fill: white; text-anchor: middle; }
                    .option { font: 36px Arial; fill: white; text-anchor: middle; }
                    .timer { font: bold 32px Arial; fill: #ff6b6b; text-anchor: middle; }
                </style>
            </defs>
            <defs>
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="circleGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#4ecdc4;stop-opacity:0.1" />
                </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bgGradient)"/>
            <circle cx="200" cy="300" r="150" fill="url(#circleGrad)"/>
            <circle cx="880" cy="1400" r="200" fill="url(#circleGrad)"/>
            <rect x="0" y="400" width="300" height="300" fill="#ff6b6b" opacity="0.1" transform="rotate(45 150 550)"/>
            
            <text x="${width/2}" y="150" class="title">🤔 오늘의 퀴즈</text>
            
            ${questionLines.map((line, index) => 
                `<text x="${width/2}" y="${250 + (index * 50)}" class="question">${this.escapeHtml(line)}</text>`
            ).join('')}
            
            ${wrappedOptions.map((optionLines, optionIndex) => {
                const startY = 450 + (optionIndex * 130);
                return `
                    <rect x="80" y="${startY - 50}" width="${width - 160}" height="100" fill="${this.videoConfig.accentColor}" rx="10"/>
                    ${optionLines.map((line, lineIndex) => 
                        `<text x="${width/2}" y="${startY - 10 + (lineIndex * 35)}" class="option">${this.escapeHtml(line)}</text>`
                    ).join('')}
                `;
            }).join('')}
            
            <text x="${width/2}" y="${height - 150}" class="timer">⏰ 3초 후 정답 공개!</text>
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
        
        const explanationLines = this.wrapText(quiz.explanation, 35);
        const answerLines = this.wrapText(correctOption || quiz.correctAnswer, 30);
        
        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .correct { font: bold 56px Arial; fill: #4ecdc4; text-anchor: middle; }
                    .answer { font: bold 42px Arial; fill: white; text-anchor: middle; }
                    .explanation { font: 36px Arial; fill: white; text-anchor: middle; }
                    .subscribe { font: bold 36px Arial; fill: #ff6b6b; text-anchor: middle; }
                </style>
            </defs>
            <defs>
                <linearGradient id="bgGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="circleGrad2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#4ecdc4;stop-opacity:0.4" />
                    <stop offset="100%" style="stop-color:#44a08d;stop-opacity:0.1" />
                </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bgGradient2)"/>
            <circle cx="150" cy="400" r="120" fill="url(#circleGrad2)"/>
            <circle cx="930" cy="1200" r="180" fill="url(#circleGrad2)"/>
            <rect x="700" y="200" width="250" height="250" fill="#4ecdc4" opacity="0.15" transform="rotate(30 825 325)"/>
            
            <text x="${width/2}" y="150" class="correct">✅ 정답!</text>
            
            ${answerLines.map((line, index) => 
                `<text x="${width/2}" y="${250 + (index * 45)}" class="answer">${this.escapeHtml(line)}</text>`
            ).join('')}
            
            ${explanationLines.map((line, index) => 
                `<text x="${width/2}" y="${400 + (index * 40)}" class="explanation">${this.escapeHtml(line)}</text>`
            ).join('')}
            
            <text x="${width/2}" y="${height - 100}" class="subscribe">👍 구독 &amp; 좋아요!</text>
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