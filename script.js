// Simulated user database
let users = JSON.parse(localStorage.getItem('users')) || [];

// Check if user is logged in
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

// Redirect to login if not logged in (except for Home, Login, and Register pages)
if (
    !loggedInUser &&
    !window.location.pathname.endsWith('index.html') &&
    !window.location.pathname.endsWith('login.html') &&
    !window.location.pathname.endsWith('register.html')
) {
    window.location.href = "login.html";
}

// Update profile logo with the first letter of the username
const profileLogo = document.getElementById('profile-logo');
if (loggedInUser && profileLogo) {
    profileLogo.textContent = loggedInUser.username.charAt(0).toUpperCase();
}

// Display user information on the dashboard
if (loggedInUser && document.getElementById('student-details')) {
    const studentDetails = document.getElementById('student-details');
    studentDetails.innerHTML = `
        <p><strong>Username:</strong> ${loggedInUser.username}</p>
        <p><strong>Email:</strong> ${loggedInUser.email}</p>
    `;
    document.getElementById('username').textContent = loggedInUser.username;
}

// Dark Mode Toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');
if (darkModeToggle) {
    // Load dark mode preference from localStorage
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    // Toggle dark mode
    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
}

// Login functionality
document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Find user
    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        document.getElementById('login-status').textContent = "Login successful! Redirecting to home...";
        setTimeout(() => window.location.href = "index.html", 2000);
    } else {
        document.getElementById('login-status').textContent = "Invalid email or password!";
    }
});

// Logout functionality
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = "index.html";
});

// Update navigation based on login status
const authLink = document.getElementById('auth-link');
if (loggedInUser) {
    authLink.textContent = "Logout";
    authLink.href = "#";
    authLink.id = "logout-btn";
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        window.location.href = "index.html";
    });
} else {
    authLink.textContent = "Login";
    authLink.href = "login.html";
}

// User Profile Dropdown
const userProfile = document.querySelector('.user-profile');
const dropdownMenu = document.querySelector('.dropdown-menu');

if (userProfile) {
    userProfile.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (!userProfile.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
}

// Store conversation history in localStorage
let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];

// Function to display conversation history
function displayHistory() {
    const historyLog = document.getElementById('history-log');
    historyLog.innerHTML = ""; // Clear the history log

    conversationHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.innerHTML = `
            <p><strong>You:</strong> ${item.user}</p>
            <p><strong>Beacon:</strong> ${item.bot}</p>
            <div class="timestamp">${item.timestamp}</div>
        `;
        historyItem.addEventListener('click', () => loadConversation(index));
        historyLog.appendChild(historyItem);
    });
}

// Function to load a past conversation into the chat log
function loadConversation(index) {
    const chatLog = document.getElementById('chat-log');
    chatLog.innerHTML = ""; // Clear the current chat log

    const conversation = conversationHistory[index];
    appendMessage('user', conversation.user);
    appendMessage('bot', conversation.bot);
}

// Function to append messages to the chat log
function appendMessage(sender, message) {
    const chatLog = document.getElementById('chat-log');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    if (sender === 'bot' && message.includes('\n')) {
        // Format bot responses as point-wise if they contain multiple lines
        const points = message.split('\n').filter(point => point.trim() !== '');
        const list = document.createElement('ul');
        points.forEach(point => {
            const li = document.createElement('li');
            li.textContent = point.trim();
            list.appendChild(li);
        });
        messageElement.appendChild(list);
    } else {
        messageElement.textContent = message;
    }

    chatLog.appendChild(messageElement);

    // Scroll to the bottom of the chat log
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Function to get the current timestamp
function getTimestamp() {
    const now = new Date();
    return now.toLocaleString(); // Format: "MM/DD/YYYY, HH:MM:SS AM/PM"
}

// Gemini API Configuration (for chatbot functionality)
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const GEMINI_API_KEY = "AIzaSyCo-ZEW9eVIb7OCTCNKd4o0-wAtGkDecBU"; // Replace with your actual API key

// Function to send user input to Gemini API
async function sendToGeminiAPI(userInput) {
    try {
        console.log("Sending request to Gemini API...");

        // Prepare the request payload
        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: userInput }],
                },
            ],
            generationConfig: {
                maxOutputTokens: 150,
                temperature: 0.7,
            },
        };

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("API Response:", response);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Details:", errorData);
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("API Data:", data);

        // Extract the bot's response
        if (data.candidates && data.candidates.length > 0) {
            const botResponse = data.candidates[0].content.parts[0].text.trim();
            return botResponse;
        } else {
            throw new Error("No valid response from the API.");
        }
    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        return null;
    }
}

// Function to format bot responses into point-wise format
function formatResponse(response) {
    // Split the response into lines and format as points
    const points = response.split('\n').filter(point => point.trim() !== '');
    return points.join('\n'); // Return as a single string with line breaks
}

// Chatbot functionality
document.getElementById('send-btn')?.addEventListener('click', async () => {
    const userInput = document.getElementById('user-input').value;
    if (!userInput) return;

    // Add user message to chat log
    appendMessage('user', userInput);

    // Clear input field
    document.getElementById('user-input').value = '';

    try {
        // Call Gemini API
        const botResponse = await sendToGeminiAPI(userInput);

        if (botResponse === null) {
            // Fallback response if the API fails
            appendMessage('bot', "I'm having trouble understanding that. Can you please rephrase?");
        } else {
            // Format the bot's response into point-wise format
            const formattedResponse = formatResponse(botResponse);

            // Add bot response to chat log
            appendMessage('bot', formattedResponse);

            // Save the conversation to history
            conversationHistory.push({
                user: userInput,
                bot: formattedResponse,
                timestamp: getTimestamp(),
            });
            localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

            // Update the history display
            displayHistory();
        }
    } catch (error) {
        console.error('Error:', error);
        appendMessage('bot', "Sorry, something went wrong. Please try again.");
    }
});

// Display history when the page loads
displayHistory();

// Performance Tracker Functionality
const quizTopicInput = document.getElementById('quiz-topic');
const startQuizButton = document.getElementById('start-quiz');
const quizContainer = document.getElementById('quiz-container');
const quizResults = document.getElementById('quiz-results');
const performanceStats = document.getElementById('performance-stats');

let quizData = [];
let userAnswers = [];
let performanceHistory = JSON.parse(localStorage.getItem('performanceHistory')) || [];

// Fetch quiz questions from API
async function fetchQuizQuestions(topic) {
    try {
        // Use the Open Trivia Database API to fetch questions
        const response = await fetch(`https://opentdb.com/api.php?amount=10&category=9&difficulty=medium&type=multiple`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Error fetching quiz questions:", error);
        return null;
    }
}

// Display quiz questions
function displayQuiz(questions) {
    quizContainer.innerHTML = ""; // Clear previous quiz
    userAnswers = []; // Reset user answers

    questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.classList.add('quiz-question');
        questionElement.innerHTML = `
            <h3>${decodeURIComponent(question.question)}</h3>
            ${shuffleArray([...question.incorrect_answers, question.correct_answer]).map((answer, i) => `
                <label>
                    <input type="radio" name="question${index}" value="${answer}">
                    ${decodeURIComponent(answer)}
                </label>
            `).join('')}
        `;
        quizContainer.appendChild(questionElement);
    });

    // Add submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = "Submit Quiz";
    submitButton.classList.add('submit-quiz');
    submitButton.addEventListener('click', evaluateQuiz);
    quizContainer.appendChild(submitButton);
}

// Shuffle array (to randomize answer options)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Evaluate quiz answers
function evaluateQuiz() {
    const questions = document.querySelectorAll('.quiz-question');
    let correctAnswers = 0;

    questions.forEach((question, index) => {
        const selectedAnswer = question.querySelector('input[type="radio"]:checked');
        if (selectedAnswer) {
            const isCorrect = selectedAnswer.value === quizData[index].correct_answer;
            if (isCorrect) correctAnswers++;
        }
    });

    const score = (correctAnswers / quizData.length) * 100;
    quizResults.innerHTML = `
        <h3>Quiz Results</h3>
        <p>You scored ${score.toFixed(2)}% (${correctAnswers} out of ${quizData.length} correct).</p>
    `;

    // Save performance history
    performanceHistory.push({
        topic: quizTopicInput.value,
        score: score,
        date: new Date().toLocaleString(),
    });
    localStorage.setItem('performanceHistory', JSON.stringify(performanceHistory));

    // Update performance stats
    updatePerformanceStats();
}

// Update performance stats
function updatePerformanceStats() {
    performanceStats.innerHTML = performanceHistory.map((entry, index) => `
        <p><strong>Attempt ${index + 1}:</strong> ${entry.topic} - ${entry.score.toFixed(2)}% on ${entry.date}</p>
    `).join('');
}

// Start quiz
startQuizButton.addEventListener('click', async () => {
    const topic = quizTopicInput.value.trim();
    if (!topic) {
        alert("Please enter a topic for your quiz.");
        return;
    }

    quizData = await fetchQuizQuestions(topic);
    if (quizData && quizData.length > 0) {
        displayQuiz(quizData);
    } else {
        alert("Failed to fetch quiz questions. Please try again.");
    }
});

// Display performance history when the page loads
updatePerformanceStats();
