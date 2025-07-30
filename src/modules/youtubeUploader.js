const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class YouTubeUploader {
    constructor() {
        this.youtube = null;
        this.oauth2Client = null;
        this.initializeAuth();
    }

    initializeAuth() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI
        );

        this.youtube = google.youtube({
            version: 'v3',
            auth: this.oauth2Client
        });
    }

    async getAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube'
        ];

        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });

        return authUrl;
    }

    async setCredentials(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            
            const tokenPath = path.join(process.cwd(), 'config', 'youtube_tokens.json');
            if (!fs.existsSync(path.dirname(tokenPath))) {
                fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
            }
            fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
            
            console.log('✅ YouTube 인증 완료');
            return tokens;
        } catch (error) {
            console.error('YouTube 인증 오류:', error);
            throw error;
        }
    }

    async loadTokens() {
        try {
            const tokenPath = path.join(process.cwd(), 'config', 'youtube_tokens.json');
            if (fs.existsSync(tokenPath)) {
                const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
                this.oauth2Client.setCredentials(tokens);
                return true;
            }
            return false;
        } catch (error) {
            console.error('토큰 로드 오류:', error);
            return false;
        }
    }

    async refreshTokenIfNeeded() {
        try {
            await this.oauth2Client.getAccessToken();
        } catch (error) {
            console.log('토큰 갱신 필요');
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            this.oauth2Client.setCredentials(credentials);
            
            const tokenPath = path.join(process.cwd(), 'config', 'youtube_tokens.json');
            fs.writeFileSync(tokenPath, JSON.stringify(credentials, null, 2));
        }
    }

    async upload(videoPath, quizTitle) {
        try {
            const hasTokens = await this.loadTokens();
            if (!hasTokens) {
                const authUrl = await this.getAuthUrl();
                throw new Error(`YouTube 인증이 필요합니다. 다음 URL로 이동하여 인증하세요: ${authUrl}`);
            }

            await this.refreshTokenIfNeeded();

            const title = this.generateTitle(quizTitle);
            const description = this.generateDescription(quizTitle);
            const tags = this.generateTags();

            console.log('📤 YouTube 업로드 시작...');
            
            const response = await this.youtube.videos.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title: title,
                        description: description,
                        tags: tags,
                        categoryId: '27',
                        defaultLanguage: 'ko',
                        defaultAudioLanguage: 'ko'
                    },
                    status: {
                        privacyStatus: 'public',
                        selfDeclaredMadeForKids: false
                    }
                },
                media: {
                    body: fs.createReadStream(videoPath)
                }
            });

            const videoId = response.data.id;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            
            console.log('✅ YouTube 업로드 완료!');
            console.log(`📺 영상 URL: ${videoUrl}`);
            
            return {
                videoId: videoId,
                url: videoUrl,
                title: title
            };

        } catch (error) {
            console.error('YouTube 업로드 오류:', error);
            throw error;
        }
    }

    generateTitle(quizTitle) {
        const prefixes = [
            '🤔 당신은 알고 있나요?',
            '🧠 신기한 퀴즈',
            '😮 놀라운 사실',
            '🎯 퀴즈 도전',
            '🤓 알쏭달쏭 퀴즈'
        ];
        
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return `${randomPrefix} ${quizTitle} #퀴즈 #상식 #쇼츠`;
    }

    generateDescription(quizTitle) {
        return `🎯 오늘의 흥미진진한 퀴즈를 풀어보세요!

${quizTitle}에 대한 신기한 사실을 알려드립니다.

📌 이런 분들께 추천해요:
✅ 상식을 늘리고 싶은 분
✅ 재미있는 퀴즈를 좋아하는 분
✅ 새로운 지식을 배우고 싶은 분

🔔 구독과 좋아요는 큰 힘이 됩니다!
💬 댓글로 여러분의 생각을 들려주세요!

#퀴즈 #상식 #교육 #학습 #재미 #지식 #쇼츠 #shorts
#quiz #knowledge #education #learning #facts #trivia`;
    }

    generateTags() {
        return [
            '퀴즈', '상식', '교육', '학습', '지식', '재미', '쇼츠',
            'quiz', 'knowledge', 'education', 'learning', 'facts',
            'trivia', 'shorts', '한국어퀴즈', '상식퀴즈', '교양'
        ];
    }
}

module.exports = YouTubeUploader;