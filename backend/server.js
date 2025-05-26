// backend/server.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const admin = require('firebase-admin'); // Import Firebase Admin SDK

const app = express();
const port = process.env.PORT || 3001; // Backend will run on port 3001

// --- Firebase Admin SDK Initialization ---
const serviceAccount = require('./serviceAccountKey.json'); // Path to your downloaded service account key

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
// --- END Firebase Admin SDK Initialization ---

// Middleware
app.use(cors()); // Allow requests from your frontend (ensure your frontend URL is allowed if not using '*')
app.use(express.json()); // Parse JSON request bodies

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    console.error("Error: OPENAI_API_KEY is not set in .env file!");
    process.exit(1); // Exit if API key is missing
}
const openai = new OpenAI({ apiKey: openaiApiKey });

// --- Middleware to verify Firebase ID token ---
const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided.' });
    }

    const idToken = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Attach decoded token to request (contains uid, email, etc.)
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return res.status(403).json({ error: 'Unauthorized: Invalid or expired token.' });
    }
};
// --- END verifyFirebaseToken Middleware ---

// --- NEW ROUTE: GET /api/user/interviews (Protected by Firebase Token) ---
app.get('/api/user/interviews', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid; // Get the user ID from the decoded token
        console.log(`Workspaceing interviews for user: ${userId}`);

        // IMPORTANT: In a real application, you would fetch this data from your database.
        // For now, sending mock data to verify the connection.
        const mockInterviews = [
            {
                id: 'int_001',
                category: 'Web Development',
                date: new Date().toISOString(), // Current date
                score: 85,
                questions: 10,
            },
            {
                id: 'int_002',
                category: 'Data Structures & Algorithms',
                date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                score: 72,
                questions: 15,
            },
            {
                id: 'int_003',
                category: 'HR & Behavioral',
                date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
                score: 90,
                questions: 5,
            },
        ];

        res.json(mockInterviews); // Send the mock data back
    } catch (error) {
        console.error('Error in /api/user/interviews route:', error);
        res.status(500).json({ error: 'Failed to fetch user interviews.' });
    }
});
// --- END NEW ROUTE ---


// Existing: Define your AI response API endpoint (Updated Name and Logic)
// Add verifyFirebaseToken middleware here to protect the endpoint
app.post('/api/interview/evaluate', verifyFirebaseToken, async (req, res) => {
    // Frontend sends { question, userAnswer, category, difficulty }
    const { question, userAnswer, category, difficulty } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
        return res.status(400).json({ error: 'Interview question is required.' });
    }
    if (typeof userAnswer !== 'string') { // userAnswer can be empty string
        return res.status(400).json({ error: 'User answer must be a string.' });
    }

    try {
        // Construct a more specific prompt for AI feedback
        const feedbackPrompt = `You are an expert interviewer providing concise and constructive feedback to a candidate's answer for a "${category}" interview question of "${difficulty}" difficulty. Focus on direct, actionable improvements and common pitfalls. If the answer is empty or very short, point that out. Keep your responses brief and to the point (max 150 words).

        Interview Question: "${question}"
        Candidate's Answer: "${userAnswer}"

        Provide feedback on the candidate's answer, focusing on clarity, completeness, accuracy, and any missing key points.`;

        const completion = await openai.chat.com.completions.create({
            model: "gpt-3.5-turbo", // Or 'gpt-4' if you have access
            messages: [
                { role: "system", content: "You are an expert interviewer providing concise and constructive feedback. Keep responses brief and actionable." }, // Shorter system prompt
                { role: "user", content: feedbackPrompt }
            ],
            max_tokens: 200, // Limit the response length
            temperature: 0.7, // Creativity level
        });

        const aiFeedback = completion.choices[0].message.content;
        res.json({ feedback: aiFeedback }); // Send response with 'feedback' key

    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        // More specific error handling
        if (error.response && error.response.status) {
            if (error.response.status === 401) {
                return res.status(401).json({ error: "OpenAI API key is invalid or unauthorized." });
            }
            if (error.response.status === 429) {
                return res.status(429).json({ error: "OpenAI API rate limit exceeded. Try again later." });
            }
            if (error.response.status >= 500) {
                return res.status(500).json({ error: "OpenAI service unavailable or internal server error." });
            }
        }
        res.status(500).json({ error: 'Failed to get AI feedback from OpenAI.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});