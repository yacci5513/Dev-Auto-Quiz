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
            '영화와 드라마 뒷이야기',
            '스포츠의 숨겨진 규칙',
            '브랜드와 로고의 비밀',
            '날씨와 자연현상',
            '게임과 놀이의 역사',
            '교통수단의 흥미로운 사실',
            '색깔과 심리학',
            '음악의 신기한 효과',
            '건강과 의학 상식',
            '심리학 재미있는 이야기',
        ];
        
        this.usedRandomTopics = new Set();
    }

    async generateQuiz(specificTopic = null) {
        try {
            const category = specificTopic || this.getRandomCategory();
            const prompt = this.createQuizPrompt(category);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "당신은 한국의 교육 전문가입니다. 과학적으로 검증된 흥미로운 지식을 바탕으로 퀴즈를 만들어주세요. 반드시 자연스러운 한국어를 사용하고, 어색한 번역체나 부자연스러운 표현은 피해주세요. 모든 내용은 과학적 사실에 기반해야 하며, 구체적인 데이터나 수치가 포함된 내용을 선호합니다."
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

    async generateRandomInterestingQuiz() {
        try {
            const prompt = this.createRandomInterestingPrompt();
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "당신은 한국의 교육 전문가입니다. 과학적으로 검증된 흥미로운 지식을 바탕으로 퀴즈를 만들어주세요. 반드시 자연스러운 한국어를 사용하고, 어색한 번역체나 부자연스러운 표현은 피해주세요. 모든 내용은 과학적 사실에 기반해야 하며, 구체적인 데이터나 수치가 포함된 내용을 선호합니다."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 1.2
            });

            const quizContent = response.choices[0].message.content;
            return this.parseQuizContent(quizContent, "랜덤 흥미로운 지식");
            
        } catch (error) {
            console.error('랜덤 퀴즈 생성 오류:', error);
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
3. 정답과 함께 핵심만 담은 간단한 설명 (최대 4문장)
4. YouTube 쇼츠에 적합한 짧고 임팩트 있는 내용

응답 형식:
제목: [흥미로운 제목]
질문: [퀴즈 질문]
A) [선택지 1]
B) [선택지 2] 
C) [선택지 3]
D) [선택지 4]
정답: [정답 번호]
설명: [핵심만 담은 간단한 설명, 최대 4문장]`;
    }

    createRandomInterestingPrompt() {
        const randomSeed = Math.random().toString(36).substring(7);
        const currentTime = new Date().toISOString();
        
        return `과학적으로 검증된 놀라운 사실 중 하나를 선택해서 퀴즈를 만들어주세요. (생성ID: ${randomSeed}, 시간: ${currentTime})

중요한 요구사항:
1. 반드시 과학적으로 입증된 사실만 사용할 것 (Wikipedia, 과학 논문, 교과서 등에서 확인 가능한 내용)
2. 구체적인 수치나 데이터가 있는 내용 선호 (예: "인간의 뇌는 하루에 70,000개의 생각을 한다")
3. 자연스러운 한국어로 작성 (어색한 번역체 금지)
4. 퀴즈 형식: 객관식 4개 선택지 (A, B, C, D)
5. 정답과 간단한 설명 (최대 3문장, 자연스러운 한국어)
6. 매번 완전히 다른 주제를 선택하세요 (중복 금지)
7. 심리학 주제와 같은 재미있는 주제를 위주로 선택하세요

응답 형식:
제목: [간결하고 흥미로운 제목]
질문: [명확한 퀴즈 질문]
A) [선택지 1]
B) [선택지 2]
C) [선택지 3]
D) [선택지 4]
정답: [정답 알파벳]
설명: [자연스러운 한국어로 된 간단한 설명, 최대 3문장]`;
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