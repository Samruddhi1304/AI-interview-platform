// backend/server.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const admin = require('firebase-admin'); // Import Firebase Admin SDK
const { v4: uuidv4 } = require('uuid'); // Import uuid for generating unique IDs

const app = express();
const port = process.env.PORT || 3001; // Backend will run on port 3001

// --- Firebase Admin SDK Initialization ---
// IMPORTANT: Replace './serviceAccountKey.json' with the actual path to your Firebase service account key file.
// This file should be downloaded from your Firebase project settings -> Service accounts.
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialize Firestore database instance
const db = admin.firestore();
// --- END Firebase Admin SDK Initialization ---

// Middleware
app.use(cors()); // Allow requests from your frontend (adjust options for production if needed)
app.use(express.json()); // Parse JSON request bodies

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    console.error("Error: OPENAI_API_KEY is not set in your .env file!");
    console.error("Please add OPENAI_API_KEY='your_api_key_here' to your .env file in the backend directory.");
    process.exit(1); // Exit if API key is missing
}
const openai = new OpenAI({ apiKey: openaiApiKey });

// --- Middleware to verify Firebase ID token ---
// This middleware protects routes by ensuring the user is authenticated with Firebase.
const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('Authentication failed: No authorization token or malformed header.');
        return res.status(401).json({ error: 'No authorization token provided or token is malformed.' });
    }

    const idToken = authHeader.split(' ')[1]; // Extract the ID token from "Bearer <token>"

    try {
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Attach decoded token (containing user UID) to the request object
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        // Differentiate between expired/invalid tokens and other authentication errors
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Unauthorized: Session expired. Please log in again.' });
        } else if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
            return res.status(403).json({ error: 'Unauthorized: Invalid token.' });
        }
        return res.status(403).json({ error: 'Unauthorized: Token verification failed.' });
    }
};
// --- END verifyFirebaseToken Middleware ---


// --- ROUTE: POST /api/interviews/create ---
// Handles the creation of a new interview session.
// Expected request body: { category: string, difficulty: string, numQuestions: number }
// Response: { interviewId: string, message: string }
app.post('/api/interviews/create', verifyFirebaseToken, async (req, res) => {
  try {
    const { category, difficulty, numQuestions } = req.body;
    const userId = req.user.uid; // Get userId from the decoded Firebase token (from verifyFirebaseToken)

    // Basic input validation
    if (!userId || !category || !difficulty || typeof numQuestions !== 'number' || numQuestions <= 0) {
      return res.status(400).json({ message: 'Missing or invalid required interview parameters (category, difficulty, numQuestions).' });
    }

    const interviewId = uuidv4(); // Generate a unique ID for the new interview session

    // Data structure for the new interview document in Firestore
    const newInterviewData = {
      userId: userId,
      category: category,
      difficulty: difficulty,
      numQuestions: numQuestions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Firestore server timestamp for creation time
      status: 'active', // Current status of the interview ('active', 'completed', etc.)
      questions: [], // Array to store questions generated during the interview
      score: 0 // Initial score for display on dashboard, can be updated later
    };

    // Save the new interview document to the 'interviews' collection in Firestore
    await db.collection('interviews').doc(interviewId).set(newInterviewData);

    console.log(`Successfully created interview session ${interviewId} for user ${userId}`);

    // Send the newly created interviewId back to the frontend
    res.status(200).json({
      interviewId: interviewId,
      message: 'Interview session created successfully.'
    });

  } catch (error) {
    console.error('Error creating interview session in backend:', error);
    res.status(500).json({ message: 'Failed to create interview session on the server.', error: error.message });
  }
});
// --- END /api/interviews/create ---


// --- ROUTE: GET /api/user/interviews ---
// Handles fetching all interview records for the authenticated user.
// Response: Array of InterviewRecord objects (e.g., [{ id, category, date, score, questions }])
app.get('/api/user/interviews', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid; // Get userId from the decoded Firebase token

    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token.' });
    }

    // Query Firestore for interviews belonging to this user, ordered by creation time (most recent first)
    const interviewsSnapshot = await db.collection('interviews')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    // Corrected line: Removed the ': any[]' TypeScript type annotation
    const interviews = []; 
    interviewsSnapshot.forEach(doc => {
      const data = doc.data(); // Get the document data
      interviews.push({
        id: doc.id, // Document ID is the interviewId
        category: data.category,
        // Convert Firestore Timestamp object to an ISO string for consistent date handling in frontend
        date: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        score: data.score || 0, // Default to 0 if score isn't set yet
        questions: data.numQuestions || 0, // Number of questions in the interview
      });
    });

    console.log(`Successfully fetched ${interviews.length} interviews for user ${userId}`);
    res.status(200).json(interviews); // Send the array of interviews

  } catch (error) {
    console.error('Error fetching user interviews in backend:', error);
    res.status(500).json({ message: 'Failed to fetch interview history from the server.', error: error.message });
  }
});
// --- END /api/user/interviews ---


// --- ROUTE: POST /api/interview/evaluate ---
// Handles sending a user's answer to OpenAI for feedback.
// Expected request body: { question: string, userAnswer: string, category: string, difficulty: string }
// Response: { feedback: string }
app.post('/api/interview/evaluate', verifyFirebaseToken, async (req, res) => {
    // Frontend sends { question, userAnswer, category, difficulty }
    const { question, userAnswer, category, difficulty } = req.body;

    // Input validation for the AI evaluation prompt
    if (!question || typeof question !== 'string' || question.trim() === '') {
        return res.status(400).json({ error: 'Interview question is required.' });
    }
    if (typeof userAnswer !== 'string') { // userAnswer can be an empty string, so just check type
        return res.status(400).json({ error: 'User answer must be a string.' });
    }
    // Category and difficulty are essential for providing relevant AI context
    if (!category || typeof category !== 'string' || !difficulty || typeof difficulty !== 'string') {
        return res.status(400).json({ error: 'Category and difficulty are required for AI evaluation context.' });
    }

    try {
        // Construct a specific prompt for OpenAI to generate constructive feedback
        const feedbackPrompt = `You are an expert interviewer providing concise and constructive feedback to a candidate's answer for a "${category}" interview question of "${difficulty}" difficulty. Focus on direct, actionable improvements and common pitfalls. If the answer is empty or very short, point that out. Keep your responses brief and to the point (max 150 words).

        Interview Question: "${question}"
        Candidate's Answer: "${userAnswer}"

        Provide feedback on the candidate's answer, focusing on clarity, completeness, accuracy, and any missing key points.`;

        // Call OpenAI API for chat completions
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Use appropriate model (e.g., 'gpt-4' if available and suitable)
            messages: [
                { role: "system", content: "You are an expert interviewer providing concise and constructive feedback. Keep responses brief and actionable." },
                { role: "user", content: feedbackPrompt }
            ],
            max_tokens: 200, // Limit the response length for efficiency
            temperature: 0.7, // Controls creativity (0.0 = very direct, 1.0 = more creative)
        });

        const aiFeedback = completion.choices[0].message.content; // Extract the feedback text
        res.json({ feedback: aiFeedback }); // Send the AI feedback back to the frontend

    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        // Detailed error handling for OpenAI API specific issues
        if (error.response && error.response.status) {
            if (error.response.status === 401) {
                return res.status(401).json({ error: "OpenAI API key is invalid or unauthorized." });
            }
            if (error.response.status === 429) {
                return res.status(429).json({ error: "OpenAI API rate limit exceeded. Please try again later." });
            }
            if (error.response.status >= 500) {
                return res.status(500).json({ error: "OpenAI service unavailable or internal server error." });
            }
        }
        res.status(500).json({ error: 'Failed to get AI feedback from OpenAI.' });
    }
});
// --- END /api/interview/evaluate ---


// Basic health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Backend is healthy and running!' });
});

// Start the server and listen for incoming requests
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log('Firebase Admin SDK initialized successfully.');
    console.log('OpenAI client initialized.');
});