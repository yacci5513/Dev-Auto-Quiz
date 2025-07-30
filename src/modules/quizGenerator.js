const OpenAI = require('openai');

class QuizGenerator {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.quizCategories = [
            '역사의 숨은 이야기',
            '과학의 신비한 현상',
            '동물들의 놀라운 능력',
            '세계의 이상한 법률',
            '음식의 흥미로운 기원',
            '인체의 신기한 사실',
            '우주의 미스터리',
            '언어의 재미있는 특징',
            '건축물의 비밀',
            '발명품의 뒷이야기'
        ];
    }

    async generateQuiz() {
        try {
            const category = this.getRandomCategory();
            const prompt = this.createQuizPrompt(category);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "당신은 흥미롭고 교육적인 퀴즈를 만드는 전문가입니다. 사람들이 잘 모르지만 알면 좋은 신기한 지식을 퀴즈로 만들어주세요."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.8
            });

            const quizContent = response.choices[0].message.content;
            return this.parseQuizContent(quizContent, category);
            
        } catch (error) {
            console.error('퀴즈 생성 오류:', error);
            throw error;
        }
    }

    getRandomCategory() {
        return this.quizCategories[Math.floor(Math.random() * this.quizCategories.length)];
    }

    createQuizPrompt(category) {
        return `다음 주제에 대해 흥미로운 퀴즈 하나를 만들어주세요: "${category}"

요구사항:
1. 대부분의 사람들이 모르는 신기하고 흥미로운 내용
2. 퀴즈 형식: 객관식 4개 선택지 (A, B, C, D)
3. 정답과 함께 상세한 설명 포함
4. YouTube 쇼츠에 적합한 짧고 임팩트 있는 내용

응답 형식:
제목: [흥미로운 제목]
질문: [퀴즈 질문]
A) [선택지 1]
B) [선택지 2] 
C) [선택지 3]
D) [선택지 4]
정답: [정답 번호]
설명: [상세한 설명과 추가 정보]`;
    }

    parseQuizContent(content, category) {
        const lines = content.split('\n').filter(line => line.trim());
        
        let title = '';
        let question = '';
        let options = [];
        let correctAnswer = '';
        let explanation = '';
        
        let currentSection = '';
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('제목:')) {
                title = trimmedLine.replace('제목:', '').trim();
                currentSection = 'title';
            } else if (trimmedLine.startsWith('질문:')) {
                question = trimmedLine.replace('질문:', '').trim();
                currentSection = 'question';
            } else if (/^[A-D]\)/.test(trimmedLine)) {
                options.push(trimmedLine);
                currentSection = 'options';
            } else if (trimmedLine.startsWith('정답:')) {
                correctAnswer = trimmedLine.replace('정답:', '').trim();
                currentSection = 'answer';
            } else if (trimmedLine.startsWith('설명:')) {
                explanation = trimmedLine.replace('설명:', '').trim();
                currentSection = 'explanation';
            } else if (currentSection === 'explanation' && trimmedLine) {
                explanation += ' ' + trimmedLine;
            }
        }

        return {
            category,
            title: title || `${category} 퀴즈`,
            question,
            options,
            correctAnswer,
            explanation,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = QuizGenerator;