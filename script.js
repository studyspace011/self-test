class MCQTestApp {
    constructor() {
        this.questions = [];
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.startTime = null;
        this.endTime = null;
        this.totalTimeLimit = 0; // in seconds
        this.timeLeft = 0;
        this.timerInterval = null;
        this.subjectName = '';
        this.chapterNumber = '';
        
        this.initializeElements();
        this.bindEvents();
        this.loadStoredData();
        this.registerServiceWorker();
    }

    initializeElements() {
        // Screen elements
        this.screens = {
            home: document.getElementById('home-screen'),
            test: document.getElementById('test-screen'),
            results: document.getElementById('results-screen'),
            history: document.getElementById('history-screen')
        };

        // Home screen elements
        this.csvFileInput = document.getElementById('csv-file');
        this.questionCount = document.getElementById('question-count');
        this.testSetup = document.getElementById('test-setup');
        this.subjectNameInput = document.getElementById('subject-name');
        this.chapterNumberInput = document.getElementById('chapter-number');
        this.numQuestions = document.getElementById('num-questions');
        this.totalTimeLimit = document.getElementById('total-time-limit');
        this.shuffleQuestions = document.getElementById('shuffle-questions');
        this.shuffleOptions = document.getElementById('shuffle-options');
        this.startTestBtn = document.getElementById('start-test');
        this.viewHistoryBtn = document.getElementById('view-history');
        this.viewAnalyticsBtn = document.getElementById('view-analytics');

        // Test screen elements
        this.timeLeftElement = document.getElementById('time-left');
        this.currentQuestion = document.getElementById('current-question');
        this.totalQuestions = document.getElementById('total-questions');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.submitTestBtn = document.getElementById('submit-test');

        // Results screen elements
        this.scoreElement = document.getElementById('score');
        this.totalScoreElement = document.getElementById('total-score');
        this.percentageElement = document.getElementById('percentage');
        this.timeTakenElement = document.getElementById('time-taken');
        this.resultSubject = document.getElementById('result-subject');
        this.resultChapter = document.getElementById('result-chapter');
        this.questionsReview = document.getElementById('questions-review');
        this.newTestBtn = document.getElementById('new-test');
        this.exportResultsBtn = document.getElementById('export-results');

        // History screen elements
        this.historyList = document.getElementById('history-list');
        this.backToHomeBtn = document.getElementById('back-to-home');
        this.clearHistoryBtn = document.getElementById('clear-history');
    }

    bindEvents() {
        this.csvFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.startTestBtn.addEventListener('click', () => this.startTest());
        this.prevBtn.addEventListener('click', () => this.previousQuestion());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.submitTestBtn.addEventListener('click', () => this.submitTest());
        this.newTestBtn.addEventListener('click', () => this.showHomeScreen());
        this.viewHistoryBtn.addEventListener('click', () => this.showHistoryScreen());
        this.viewAnalyticsBtn.addEventListener('click', () => this.navigateToAnalytics());
        this.backToHomeBtn.addEventListener('click', () => this.showHomeScreen());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.exportResultsBtn.addEventListener('click', () => this.exportResults());
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            this.parseCSV(text);
            this.saveQuestionsToStorage();
            this.updateQuestionCount();
            this.showTestSetup();
        } catch (error) {
            alert('फ़ाइल पढ़ने में त्रुटि: ' + error.message);
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('Invalid CSV format');
        }

        this.questions = [];
        const headers = lines[0].split('|');

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split('|');
            if (values.length >= 8) {
                const question = {
                    id: values[0].trim(),
                    question: values[1].trim(),
                    options: [
                        values[2].trim(),
                        values[3].trim(),
                        values[4].trim(),
                        values[5].trim()
                    ].filter(opt => opt.length > 0),
                    answer: values[6].trim(),
                    tags: values[7].trim(),
                    timeLimit: values[8] ? parseInt(values[8].trim()) : 30
                };
                this.questions.push(question);
            }
        }

        if (this.questions.length === 0) {
            throw new Error('कोई प्रश्न नहीं मिले');
        }
    }

    saveQuestionsToStorage() {
        const testData = {
            questions: this.questions,
            metadata: {
                uploadDate: new Date().toISOString(),
                subject: this.subjectNameInput.value || 'अज्ञात',
                chapter: this.chapterNumberInput.value || 'अज्ञात'
            }
        };
        localStorage.setItem('mcq_questions', JSON.stringify(testData));
    }

    loadStoredData() {
        const stored = localStorage.getItem('mcq_questions');
        if (stored) {
            const testData = JSON.parse(stored);
            this.questions = testData.questions;
            this.updateQuestionCount();
            this.showTestSetup();
        }
    }

    updateQuestionCount() {
        this.questionCount.textContent = this.questions.length;
        this.numQuestions.max = this.questions.length;
        this.numQuestions.value = this.questions.length;
    }

    showTestSetup() {
        this.testSetup.classList.remove('hidden');
        this.numQuestions.max = this.questions.length;
        this.numQuestions.value = this.questions.length;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    startTest() {
        const numQs = parseInt(this.numQuestions.value);
        if (numQs < 1 || numQs > this.questions.length) {
            alert('कृपया वैध प्रश्न संख्या चुनें');
            return;
        }

        this.subjectName = this.subjectNameInput.value || 'अज्ञात';
        this.chapterNumber = this.chapterNumberInput.value || 'अज्ञात';
        this.totalTimeLimit = parseInt(this.totalTimeLimit.value) * 60; // convert to seconds
        this.timeLeft = this.totalTimeLimit;

        // Select questions
        let selectedQuestions = [...this.questions];
        if (this.shuffleQuestions.checked) {
            selectedQuestions = this.shuffleArray(selectedQuestions);
        }
        selectedQuestions = selectedQuestions.slice(0, numQs);

        // Shuffle options if needed
        if (this.shuffleOptions.checked) {
            selectedQuestions = selectedQuestions.map(q => {
                const options = [...q.options];
                const shuffledOptions = this.shuffleArray(options);
                return { ...q, options: shuffledOptions };
            });
        }

        this.currentTest = selectedQuestions;
        this.userAnswers = new Array(selectedQuestions.length).fill(null);
        this.currentQuestionIndex = 0;
        this.startTime = new Date();

        this.showTestScreen();
        this.displayQuestion();
        this.updateProgress();
        this.startTimer();
    }

    showTestScreen() {
        this.hideAllScreens();
        this.screens.test.classList.add('active');
        this.totalQuestions.textContent = this.currentTest.length;
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.submitTest();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeLeftElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    displayQuestion() {
        const question = this.currentTest[this.currentQuestionIndex];
        this.questionText.textContent = question.question;
        
        this.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.dataset.index = index;
            
            if (this.userAnswers[this.currentQuestionIndex] === index) {
                optionElement.classList.add('selected');
            }
            
            optionElement.addEventListener('click', () => {
                this.selectOption(index);
            });
            
            this.optionsContainer.appendChild(optionElement);
        });

        this.updateNavigationButtons();
    }

    selectOption(optionIndex) {
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
        
        // Update UI
        const options = this.optionsContainer.querySelectorAll('.option');
        options.forEach((opt, idx) => {
            opt.classList.toggle('selected', idx === optionIndex);
        });
    }

    updateProgress() {
        this.currentQuestion.textContent = this.currentQuestionIndex + 1;
    }

    updateNavigationButtons() {
        this.prevBtn.disabled = this.currentQuestionIndex === 0;
        this.nextBtn.disabled = this.currentQuestionIndex === this.currentTest.length - 1;
        
        if (this.currentQuestionIndex === this.currentTest.length - 1) {
            this.submitTestBtn.classList.remove('hidden');
        } else {
            this.submitTestBtn.classList.add('hidden');
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
            this.updateProgress();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentTest.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
            this.updateProgress();
        }
    }

    submitTest() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.endTime = new Date();
        this.calculateResults();
        this.saveTestResult();
        this.showResultsScreen();
    }

    calculateResults() {
        let correct = 0;
        this.currentTest.forEach((question, index) => {
            const userAnswerIndex = this.userAnswers[index];
            if (userAnswerIndex !== null) {
                const userAnswer = question.options[userAnswerIndex];
                if (userAnswer.toLowerCase() === question.answer.toLowerCase()) {
                    correct++;
                }
            }
        });

        const total = this.currentTest.length;
        const percentage = Math.round((correct / total) * 100);
        const timeTaken = Math.floor((this.endTime - this.startTime) / 1000);

        this.currentResult = {
            score: correct,
            total: total,
            percentage: percentage,
            timeTaken: timeTaken,
            questions: this.currentTest,
            answers: this.userAnswers,
            date: new Date().toISOString(),
            subject: this.subjectName,
            chapter: this.chapterNumber,
            totalTimeLimit: this.totalTimeLimit
        };
    }

    saveTestResult() {
        let history = JSON.parse(localStorage.getItem('test_history') || '[]');
        history.push(this.currentResult);
        // Keep only last 50 results
        if (history.length > 50) {
            history = history.slice(-50);
        }
        localStorage.setItem('test_history', JSON.stringify(history));
    }

    showResultsScreen() {
        this.hideAllScreens();
        this.screens.results.classList.add('active');

        this.scoreElement.textContent = this.currentResult.score;
        this.totalScoreElement.textContent = this.currentResult.total;
        this.percentageElement.textContent = this.currentResult.percentage;
        this.timeTakenElement.textContent = this.formatTime(this.currentResult.timeTaken);
        this.resultSubject.textContent = this.currentResult.subject;
        this.resultChapter.textContent = this.currentResult.chapter;

        this.displayQuestionsReview();
    }

    displayQuestionsReview() {
        this.questionsReview.innerHTML = '';
        
        this.currentTest.forEach((question, index) => {
            const userAnswerIndex = this.userAnswers[index];
            const userAnswer = userAnswerIndex !== null ? question.options[userAnswerIndex] : 'उत्तर नहीं दिया';
            const isCorrect = userAnswerIndex !== null && 
                userAnswer.toLowerCase() === question.answer.toLowerCase();

            const reviewElement = document.createElement('div');
            reviewElement.className = `question-review ${isCorrect ? 'correct' : 'incorrect'}`;
            
            reviewElement.innerHTML = `
                <h4>प्रश्न ${index + 1}: ${question.question}</h4>
                <div class="user-answer">आपका उत्तर: ${userAnswer}</div>
                <div class="correct-answer">सही उत्तर: ${question.answer}</div>
            `;

            this.questionsReview.appendChild(reviewElement);
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showHistoryScreen() {
        this.hideAllScreens();
        this.screens.history.classList.add('active');
        this.displayHistory();
    }

    displayHistory() {
        const history = JSON.parse(localStorage.getItem('test_history') || '[]');
        this.historyList.innerHTML = '';

        if (history.length === 0) {
            this.historyList.innerHTML = '<p>अभी तक कोई प्रयास नहीं हुआ है</p>';
            return;
        }

        history.reverse().forEach((result, index) => {
            const date = new Date(result.date);
            const formattedDate = date.toLocaleDateString('hi-IN') + ' ' + date.toLocaleTimeString('hi-IN');

            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <h4>टेस्ट ${history.length - index}</h4>
                <div class="history-stats">
                    <span>विषय: ${result.subject}</span>
                    <span>अध्याय: ${result.chapter}</span>
                </div>
                <div class="history-stats">
                    <span>स्कोर: ${result.score}/${result.total}</span>
                    <span>${result.percentage}%</span>
                </div>
                <div class="history-stats">
                    <span>समय: ${this.formatTime(result.timeTaken)}</span>
                    <span>प्रश्न: ${result.total}</span>
                </div>
                <div class="history-date">${formattedDate}</div>
                <div class="history-item-actions">
                    <button class="secondary-btn test-again-btn" data-index="${history.length - index - 1}">🔁 फिर से टेस्ट</button>
                    <button class="danger-btn delete-test-btn" data-index="${history.length - index - 1}">🗑️ हटाएं</button>
                </div>
            `;

            this.historyList.appendChild(historyItem);
        });

        // Bind events for action buttons
        document.querySelectorAll('.test-again-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.retakeTest(index);
            });
        });

        document.querySelectorAll('.delete-test-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteTest(index);
            });
        });
    }

    retakeTest(historyIndex) {
        const history = JSON.parse(localStorage.getItem('test_history') || '[]');
        const testResult = history[history.length - 1 - historyIndex];
        
        if (testResult) {
            // Load questions from storage
            const stored = localStorage.getItem('mcq_questions');
            if (stored) {
                const testData = JSON.parse(stored);
                this.questions = testData.questions;
                this.subjectNameInput.value = testResult.subject;
                this.chapterNumberInput.value = testResult.chapter;
                this.showTestSetup();
                this.showHomeScreen();
            }
        }
    }

    deleteTest(historyIndex) {
        if (confirm('क्या आप वाकई इस टेस्ट को हटाना चाहते हैं?')) {
            let history = JSON.parse(localStorage.getItem('test_history') || '[]');
            const actualIndex = history.length - 1 - historyIndex;
            history.splice(actualIndex, 1);
            localStorage.setItem('test_history', JSON.stringify(history));
            this.displayHistory();
        }
    }

    clearHistory() {
        if (confirm('क्या आप वाकई सभी टेस्ट इतिहास हटाना चाहते हैं?')) {
            localStorage.setItem('test_history', '[]');
            this.displayHistory();
        }
    }

    showHomeScreen() {
        this.hideAllScreens();
        this.screens.home.classList.add('active');
    }

    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
    }

    navigateToAnalytics() {
        window.location.href = 'analytics.html';
    }

    exportResults() {
        const result = this.currentResult;
        const csvContent = `data:text/csv;charset=utf-8,
टेस्ट परिणाम
विषय,${result.subject}
अध्याय,${result.chapter}
स्कोर,${result.score}/${result.total}
प्रतिशत,${result.percentage}%
समय लगा,${this.formatTime(result.timeTaken)}
कुल समय सीमा,${this.formatTime(result.totalTimeLimit)}
तारीख,${new Date(result.date).toLocaleString('hi-IN')}

विस्तृत परिणाम
प्रश्न,आपका उत्तर,सही उत्तर,स्थिति
${result.questions.map((q, i) => {
    const userAnswer = result.answers[i] !== null ? q.options[result.answers[i]] : 'उत्तर नहीं दिया';
    const isCorrect = result.answers[i] !== null && 
        q.options[result.answers[i]].toLowerCase() === q.answer.toLowerCase();
    return `"${q.question}","${userAnswer}","${q.answer}","${isCorrect ? 'सही' : 'गलत'}"`;
}).join('\n')}`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `mcq_test_result_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MCQTestApp();
});

// Add to home screen prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});