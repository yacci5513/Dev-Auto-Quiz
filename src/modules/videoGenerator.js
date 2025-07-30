const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('@ffprobe-installer/ffprobe');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

class VideoGenerator {
    constructor() {
        this.outputDir = path.join(process.cwd(), 'output', 'videos');
        this.frameDir = path.join(process.cwd(), 'output', 'frames');
        this.templateDir = path.join(process.cwd(), 'src', 'templates');
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
        [this.outputDir, this.frameDir, this.templateDir].forEach(dir => {
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
        const wrappedOptions = quiz.options.map(option => this.wrapText(option, 25));
        
        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .title { 
                        font: bold 44px Arial; 
                        fill: #ffffff; 
                        text-anchor: middle; 
                        filter: url(#glow);
                    }
                    .question { 
                        font: 48px Arial; 
                        fill: #ffffff; 
                        text-anchor: middle;
                        filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.8));
                    }
                    .option { 
                        font: bold 34px Arial; 
                        fill: #ffffff; 
                        text-anchor: middle;
                        filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.6));
                    }
                    .timer { 
                        font: bold 32px Arial; 
                        fill: #e94560; 
                        text-anchor: middle; 
                        filter: url(#glow);
                    }
                </style>
            </defs>
            <defs>
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#16213e;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0f3460;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="accentGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#e94560;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#533483;stop-opacity:0.1" />
                </radialGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#bgGradient)"/>
            <circle cx="150" cy="400" r="120" fill="url(#accentGrad)"/>
            <circle cx="930" cy="1300" r="180" fill="url(#accentGrad)"/>
            <polygon points="200,1600 400,1700 300,1800" fill="#e94560" opacity="0.1"/>
            <polygon points="800,200 1000,100 900,300" fill="#533483" opacity="0.15"/>
            
            <text x="${width/2}" y="200" class="title">🤔 오늘의 퀴즈</text>
            
            ${questionLines.map((line, index) => 
                `<text x="${width/2}" y="${350 + (index * 50)}" class="question">${this.escapeHtml(line)}</text>`
            ).join('')}
            
            ${wrappedOptions.map((optionLines, optionIndex) => {
                const startY = 650 + (optionIndex * 150);
                return `
                    <defs>
                        <linearGradient id="optionGrad${optionIndex}" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#2d3748;stop-opacity:0.9" />
                            <stop offset="100%" style="stop-color:#4a5568;stop-opacity:0.8" />
                        </linearGradient>
                    </defs>
                    <rect x="60" y="${startY - 55}" width="${width - 120}" height="110" 
                          fill="url(#optionGrad${optionIndex})" rx="20" 
                          stroke="#e94560" stroke-width="2" opacity="0.9"/>
                    <rect x="64" y="${startY - 51}" width="${width - 128}" height="102" 
                          fill="none" rx="16" 
                          stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                    ${optionLines.map((line, lineIndex) => 
                        `<text x="${width/2}" y="${startY - 5 + (lineIndex * 35)}" class="option">${this.escapeHtml(line)}</text>`
                    ).join('')}
                `;
            }).join('')}
            
            <text x="${width/2}" y="${height - 150}" class="timer">⏰ 3초 후 정답 공개!</text>
        </svg>`;

        const framePath = path.join(this.frameDir, `question_${Date.now()}.png`);
        
        try {
            await sharp(Buffer.from(svg))
                .png()
                .toFile(framePath);
            
            // 파일이 제대로 생성되었는지 확인
            if (!fs.existsSync(framePath)) {
                throw new Error('질문 프레임 파일 생성 실패');
            }
            
            console.log(`✅ 질문 프레임 생성: ${path.basename(framePath)}`);
            return framePath;
        } catch (error) {
            console.error('질문 프레임 생성 오류:', error);
            throw error;
        }
    }

    async createAnswerFrames(quiz) {
        const { width, height } = this.videoConfig;
        const answerLetter = quiz.correctAnswer.charAt(0);
        const correctOption = quiz.options.find(opt => opt.startsWith(answerLetter));
        
        const explanationLines = this.wrapText(quiz.explanation, 22);
        const answerLines = this.wrapText(correctOption || quiz.correctAnswer, 30);
        
        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .correct { 
                        font: bold 56px Arial; 
                        fill: #00d2ff; 
                        text-anchor: middle; 
                        filter: url(#successGlow);
                    }
                    .answer { 
                        font: bold 60px Arial; 
                        fill: #ffffff; 
                        text-anchor: middle;
                        filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.8));
                    }
                    .explanation { 
                        font: 55px Arial; 
                        fill: #e2e8f0; 
                        text-anchor: middle;
                        filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.6));
                    }
                    .subscribe { 
                        font: bold 32px Arial; 
                        fill: #e94560; 
                        text-anchor: middle; 
                        filter: url(#successGlow);
                    }
                </style>
            </defs>
            <defs>
                <linearGradient id="bgGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#0f3460;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#16213e;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="successGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#00d2ff;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#3a7bd5;stop-opacity:0.1" />
                </radialGradient>
                <filter id="successGlow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#bgGradient2)"/>
            <circle cx="200" cy="300" r="140" fill="url(#successGrad)"/>
            <circle cx="880" cy="1400" r="200" fill="url(#successGrad)"/>
            <polygon points="100,1500 300,1600 200,1700" fill="#00d2ff" opacity="0.1"/>
            <polygon points="850,150 1050,50 950,250" fill="#3a7bd5" opacity="0.15"/>
            
            <text x="${width/2}" y="200" class="correct">✅ 정답!</text>
            
            ${answerLines.map((line, index) => 
                `<text x="${width/2}" y="${400 + (index * 60)}" class="answer">${this.escapeHtml(line)}</text>`
            ).join('')}
            
            ${explanationLines.map((line, index) => 
                `<text x="${width/2}" y="${600 + (index * 70)}" class="explanation">${this.escapeHtml(line)}</text>`
            ).join('')}
            
            <text x="${width/2}" y="${height - 100}" class="subscribe">👍 구독 &amp; 좋아요!</text>
        </svg>`;

        const framePath = path.join(this.frameDir, `answer_${Date.now()}.png`);
        
        try {
            await sharp(Buffer.from(svg))
                .png()
                .toFile(framePath);
                
            // 파일이 제대로 생성되었는지 확인
            if (!fs.existsSync(framePath)) {
                throw new Error('답변 프레임 파일 생성 실패');
            }
            
            console.log(`✅ 답변 프레임 생성: ${path.basename(framePath)}`);
            return framePath;
        } catch (error) {
            console.error('답변 프레임 생성 오류:', error);
            throw error;
        }
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
        try {
            // 실제 오디오 길이 계산 (ffprobe 사용)
            const questionDuration = await this.getAudioDuration(audioFiles.question);
            const answerDuration = await this.getAudioDuration(audioFiles.answer);
            
            // 정수로 반올림하여 안전한 동기화
            const questionSeconds = Math.ceil(questionDuration);
            const answerSeconds = Math.ceil(answerDuration);
            
            console.log(`🎵 실제 오디오 길이 기반 동기화 - 질문: ${questionSeconds}초, 답변: ${answerSeconds}초`);
            console.log(`📊 정확한 오디오 시간 - 질문: ${questionDuration.toFixed(2)}초, 답변: ${answerDuration.toFixed(2)}초`);
            
            return new Promise((resolve, reject) => {
                ffmpeg()
                    .input(questionFrame)
                    .inputOptions(['-loop', '1', '-t', questionSeconds.toString()])
                    .input(answerFrame) 
                    .inputOptions(['-loop', '1', '-t', answerSeconds.toString()])
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
                        console.log('✅ 영상 합성 완료 (실제 오디오 길이 기반 동기화)');
                        resolve(outputPath);
                    })
                    .on('error', (err) => {
                        console.error('영상 합성 오류:', err);
                        reject(err);
                    })
                    .run();
            });
        } catch (error) {
            console.error('오디오 파일 분석 오류:', error);
            throw error;
        }
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

    async getAudioDuration(filePath) {
        return new Promise((resolve, reject) => {
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

module.exports = VideoGenerator;