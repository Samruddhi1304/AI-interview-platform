// backend/server.js

// Load environment variables from .env file (for local development)
require('dotenv').config();

// --- Debugging for server startup ---
console.log('--- SERVER.JS IS STARTING UP ---');
console.log("Server.js: Initializing modules...");

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs
const PDFDocument = require('pdfkit');
const sgMail = require('@sendgrid/mail'); // SendGrid library
const path = require('path'); // IMPORTANT: Add this line to import the path module
const history = require('connect-history-api-fallback'); // NEW: Import history API fallback middleware

const app = express();
// Use process.env.PORT provided by Render, fallback to 3001 for local development
const port = process.env.PORT || 3001;
// --- START OF REQUIRED CODE FOR BASE64 DECODING ---

// Server.js: Initializing Firebase Admin SDK...
try {
    // IMPORTANT: Get the Base64 encoded service account string from environment variable
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
        console.error("Server.js ERROR: FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set!");
        process.exit(1); // Exit if critical variable is missing
    }

    // Attempt to decode the Base64 string into a JSON string
    let serviceAccountJsonString;
    try {
        serviceAccountJsonString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    } catch (decodeError) {
        console.error("Server.js ERROR: Failed to decode FIREBASE_SERVICE_ACCOUNT_BASE64. Check encoding:", decodeError.message);
        process.exit(1); // Exit if Base64 decoding fails
    }
    console.log("Server.js: Successfully decoded Base64 service account string.");


    // Attempt to parse the JSON string into an object
    let serviceAccount;
    try {
        serviceAccount = JSON.parse(serviceAccountJsonString);
    } catch (parseError) {
        console.error("Server.js ERROR: Failed to parse JSON from decoded service account string. Check format:", parseError.message);
        process.exit(1); // Exit if JSON parsing fails
    }
    console.log("Server.js: Successfully parsed service account JSON.");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Server.js: Firebase Admin SDK initialized successfully.');

} catch (error) {
    console.error('Server.js ERROR: Firebase Admin SDK initialization failed:', error.message);
    console.error('Please ensure FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is correct and accessible.');
    process.exit(1); // Exit if Firebase cannot be initialized
}
const db = admin.firestore();
console.log("Server.js: Firebase initialized. Continuing with other setup...");

// --- END OF REQUIRED CODE FOR BASE64 DECODING ---


// Middleware
app.use(cors());
app.use(express.json());

// --- Initialize Google Generative AI Client ---
const geminiApiKey = process.env.GOOGLE_API_KEY;
console.log('DEBUG: Value of GOOGLE_API_KEY:', geminiApiKey ? 'Loaded (Length: ' + geminiApiKey.length + ')' : 'Not loaded or empty');

if (!geminiApiKey) {
    console.error("Error: GOOGLE_API_KEY is not set!");
    console.error("Please ensure GOOGLE_API_KEY environment variable is set on Render.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
console.log('Server.js: Google Generative AI client initialized.');
// --- END Google Generative AI Client Initialization ---

// --- Configure SendGrid API Key ---
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log('Server.js: SendGrid API Key set.');
// --- END Configure SendGrid API Key ---

// --- Email Sending Utility Function ---
const sendScheduledInterviewEmail = async (userEmail, userName, interviewDetails) => {
    const { category, scheduledDateTime, notes } = interviewDetails;
    const dateObj = new Date(scheduledDateTime);
    const formattedDate = dateObj.toLocaleDateString();
    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!userEmail || !category || !scheduledDateTime || !process.env.SENDER_EMAIL) {
        console.error("sendScheduledInterviewEmail: Missing crucial details for email sending. userEmail:", userEmail, "category:", category, "scheduledDateTime:", scheduledDateTime, "SENDER_EMAIL:", process.env.SENDER_EMAIL);
        return false;
    }

    const msg = {
        to: userEmail,
        from: {
            email: process.env.SENDER_EMAIL,
            name: "InterviewAI Team"
        },
        subject: `Your Interview for ${category} is Scheduled!`,
        html: `
            <p>Hi ${userName},</p>
            <p>Your AI mock interview has been successfully scheduled!</p>
            <p><strong>Details:</strong></p>
            <ul>
                <li><strong>Category:</strong> ${category}</li>
                <li><strong>Date:</strong> ${formattedDate}</li>
                <li><strong>Time:</strong> ${formattedTime}</li>
                ${notes ? `<li><strong>Notes:</strong> ${notes}</li>` : ''}
            </ul>
            <p>Please log in to your dashboard at your scheduled time to start your interview.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard">Go to Dashboard</a></p>
            <p>Good luck with your preparation!</p>
            <p>Best regards,<br>The InterviewAI Team</p>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log(`Scheduled interview email sent to ${userEmail}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${userEmail}:`);
        if (error.response) {
            console.error(error.response.body);
        } else {
            console.error(error);
        }
        return false;
    }
};
// --- END Email Sending Utility Function ---

// --- Middleware to verify Firebase ID token ---
const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('Authentication failed: No authorization token or malformed header.');
        return res.status(401).json({ message: 'No authorization token provided or token is malformed.' });
    }

    const idToken = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ message: 'Unauthorized: Session expired. Please log in again.' });
        } else if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
            return res.status(403).json({ message: 'Unauthorized: Invalid token.' });
        }
        return res.status(403).json({ message: 'Unauthorized: Token verification failed.' });
    }
};
// --- END verifyFirebaseToken Middleware ---

// =======================================================
// --- Interview Session Management Routes ---
// =======================================================

// --- MODIFIED ROUTE: POST /api/schedule-interview ---
app.post('/api/schedule-interview', verifyFirebaseToken, async (req, res) => {
    try {
        const { userId, category, difficulty, numQuestions, interviewDate, interviewTime, userEmail, userName } = req.body;
        const authenticatedUserId = req.user.uid;

        if (userId !== authenticatedUserId) {
            console.warn(`[CREATE INTERVIEW] Mismatched User ID. Token UID: ${authenticatedUserId}, Body UID: ${userId}`);
            return res.status(403).json({ message: 'Unauthorized: User ID mismatch.' });
        }

        console.log(`[CREATE INTERVIEW] Request to create interview for user ${userId} (Category: ${category}, Difficulty: ${difficulty}, Questions: ${numQuestions})`);

        if (!userId || !category || !difficulty || typeof numQuestions !== 'number' || numQuestions <= 0) {
            return res.status(400).json({ message: 'Missing or invalid required interview parameters (userId, category, difficulty, numQuestions).' });
        }

        const interviewId = uuidv4();
        const newInterviewData = {
            userId: userId,
            category: category,
            difficulty: difficulty,
            numQuestions: numQuestions,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            scheduledDate: interviewDate,
            scheduledTime: interviewTime,
            userEmail: userEmail,
            userName: userName,
            status: 'active',
            questions: [],
            overallScore: null,
            duration: null,
            strengths: [],
            improvements: []
        };
        await db.collection('interviews').doc(interviewId).set(newInterviewData);
        console.log(`[CREATE INTERVIEW] Successfully created interview session ${interviewId} for user ${userId}`);
        res.status(200).json({
            interviewId: interviewId,
            message: 'Interview session created successfully.'
        });
    } catch (error) {
        console.error('[CREATE INTERVIEW ERROR] Error creating interview session in backend:', error);
        res.status(500).json({ message: 'Failed to create interview session on the server.', error: error.message });
    }
});
// --- END MODIFIED ROUTE: /api/schedule-interview ---

// --- ROUTE: GET /api/interviews/:interviewId ---
app.get('/api/interviews/:interviewId', verifyFirebaseToken, async (req, res) => {
    try {
        const { interviewId } = req.params;
        const userId = req.user.uid;

        console.log(`[FETCH/RESUME INTERVIEW] Received request for interview ID: ${interviewId} by user ${userId}`);

        if (!interviewId) {
            return res.status(400).json({ message: 'Interview ID is required.' });
        }

        const interviewDoc = await db.collection('interviews').doc(interviewId).get();

        if (!interviewDoc.exists) {
            console.warn(`[FETCH/RESUME INTERVIEW WARNING] Attempted to fetch non-existent interview: ${interviewId}`);
            return res.status(404).json({ message: 'Interview not found.' });
        }

        const interviewData = interviewDoc.data();

        if (interviewData.userId !== userId) {
            console.warn(`[FETCH/RESUME INTERVIEW WARNING] Unauthorized access attempt to interview ${interviewId} by user ${userId}.`);
            return res.status(403).json({ message: 'Access denied. This interview does not belong to your account.' });
        }

        if (interviewData.status !== 'active' && interviewData.status !== 'completed') {
            console.warn(`[FETCH/RESUME INTERVIEW WARNING] Interview ${interviewId} is not active or completed. Status: ${interviewData.status}.`);
            return res.status(400).json({ message: `Interview cannot be resumed. Current status is ${interviewData.status}.` });
        }

        if (!interviewData.questions || interviewData.questions.length === 0) {
            console.log(`[GENERATE QUESTIONS] Generating questions for interview ${interviewId} (Category: ${interviewData.category}, Difficulty: ${interviewData.difficulty}, Count: ${interviewData.numQuestions})`);

            const questionsPrompt = `Generate ${interviewData.numQuestions} unique, concise, and technical interview questions for a "${interviewData.category}" role with "${interviewData.difficulty}" difficulty. Provide only the questions in a JSON array format, like this: {"questions": [{"id": "uuid1", "text": "Question 1"}, {"id": "uuid2", "text": "Question 2"}]}. Ensure IDs are unique UUIDs for each question.`;

            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: questionsPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500,
                    responseMimeType: "application/json",
                },
            });

            const response = await result.response;
            let generatedQuestions;

            try {
                let parsedContent = JSON.parse(response.text());
                if (Array.isArray(parsedContent.questions)) {
                    generatedQuestions = parsedContent.questions;
                } else {
                    console.error("[GENERATE QUESTIONS ERROR] Unexpected JSON format from Gemini for questions: missing 'questions' array. Content:", response.text());
                    throw new Error("Failed to parse generated questions from AI: unexpected format.");
                }

                // Ensure each question has an ID (fallback if AI doesn't provide)
                generatedQuestions = generatedQuestions.map((q) => ({
                    id: q.id || uuidv4(),
                    text: q.text
                }));

            } catch (parseError) {
                console.error('[GENERATE QUESTIONS ERROR] Error parsing Gemini response for questions:', parseError);
                throw new Error('Failed to parse generated questions from AI. Check Gemini response format.');
            }

            await db.collection('interviews').doc(interviewId).update({
                questions: generatedQuestions,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            interviewData.questions = generatedQuestions; // Update in-memory data for current response
        }

        const durationMinutes = interviewData.numQuestions === 10 ? 30 : 15; // Example logic for duration

        res.status(200).json({
            interviewId: interviewDoc.id,
            category: interviewData.category,
            difficulty: interviewData.difficulty,
            totalQuestions: interviewData.numQuestions,
            questions: interviewData.questions,
            durationMinutes: durationMinutes,
            status: interviewData.status // Include status in response
        });

    } catch (error) {
        console.error('[FETCH/RESUME INTERVIEW ERROR] Error fetching or generating interview details:', error);
        res.status(500).json({ message: 'Failed to retrieve or generate interview details on the server.', error: error.message });
    }
});
// --- END /api/interviews/:interviewId ---

// --- ROUTE: GET /api/user/interviews/active ---
app.get('/api/user/interviews/active', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        console.log(`[FETCH ACTIVE INTERVIEWS] Request for user ${userId}`);

        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token.' });
        }

        const interviewsSnapshot = await db.collection('interviews')
            .where('userId', '==', userId)
            .where('status', '==', 'active') // Filter for active interviews
            .orderBy('createdAt', 'desc')
            .get();

        const activeInterviews = [];
        interviewsSnapshot.forEach(doc => {
            const data = doc.data();
            activeInterviews.push({
                id: doc.id,
                category: data.category,
                difficulty: data.difficulty,
                createdAt: data.createdAt.toDate().toISOString(),
                numQuestions: data.numQuestions,
                // You might want to track current question index or progress here if storing in Firestore
            });
        });

        console.log(`[FETCH ACTIVE INTERVIEWS] Successfully fetched ${activeInterviews.length} active interviews for user ${userId}`);
        res.status(200).json(activeInterviews);

    } catch (error) {
        console.error('[FETCH ACTIVE INTERVIEWS ERROR] Error fetching active interviews:', error);
        res.status(500).json({ message: 'Failed to fetch active interview sessions from the server.', error: error.message });
    }
});
// --- END /api/user/interviews/active ---

// --- ROUTE: PUT /api/interviews/:interviewId/cancel ---
app.put('/api/interviews/:interviewId/cancel', verifyFirebaseToken, async (req, res) => {
    try {
        const { interviewId } = req.params;
        const userId = req.user.uid;

        console.log(`[CANCEL INTERVIEW] Request to cancel interview ID: ${interviewId} by user ${userId}`);

        if (!interviewId) {
            return res.status(400).json({ message: 'Interview ID is required.' });
        }

        const interviewRef = db.collection('interviews').doc(interviewId);
        const interviewDoc = await interviewRef.get();

        if (!interviewDoc.exists) {
            console.warn(`[CANCEL INTERVIEW WARNING] Attempted to cancel non-existent interview: ${interviewId}`);
            return res.status(404).json({ message: 'Interview not found.' });
        }

        const interviewData = interviewDoc.data();

        if (interviewData.userId !== userId) {
            console.warn(`[CANCEL INTERVIEW WARNING] Unauthorized attempt to cancel interview ${interviewId} by user ${userId}. Interview belongs to: ${interviewData.userId}`);
            return res.status(403).json({ message: 'Access denied. This interview does not belong to your account.' });
        }

        if (interviewData.status !== 'active') {
            console.warn(`[CANCEL INTERVIEW WARNING] Interview ${interviewId} cannot be cancelled as its status is ${interviewData.status}.`);
            return res.status(400).json({ message: `Interview cannot be cancelled. Current status is ${interviewData.status}.` });
        }

        await interviewRef.update({
            status: 'cancelled',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[CANCEL INTERVIEW] Successfully cancelled interview ${interviewId}.`);
        res.status(200).json({ message: 'Interview cancelled successfully.' });

    } catch (error) {
        console.error('[CANCEL INTERVIEW ERROR] Error cancelling interview:', error);
        res.status(500).json({ message: 'Failed to cancel interview on the server.', error: error.message });
    }
});
// --- END /api/interviews/:interviewId/cancel ---

// --- ROUTE: POST /api/interview/complete ---
app.post('/api/interview/complete', verifyFirebaseToken, async (req, res) => {
    const {
        interviewId,
        overallScore,
        strengths,
        improvements,
        questions, // This will be an array of questions with userAnswer, feedback, score, keyPoints
        duration
    } = req.body;
    const userId = req.user.uid;

    console.log(`[COMPLETE INTERVIEW] POST /api/interview/complete received for interview ID: ${interviewId}`);

    if (!interviewId || !questions || !Array.isArray(questions) || typeof overallScore === 'undefined') {
        console.error(`[COMPLETE INTERVIEW ERROR] Validation failed for /api/interview/complete. Missing data.`);
        return res.status(400).json({ message: 'Missing or invalid data for completing interview.' });
    }

    try {
        const interviewRef = db.collection('interviews').doc(interviewId);
        const interviewDoc = await interviewRef.get();

        if (!interviewDoc.exists) {
            console.warn(`[COMPLETE INTERVIEW WARNING] Attempted to complete non-existent interview: ${interviewId}`);
            return res.status(404).json({ message: 'Interview not found.' });
        }

        const interviewData = interviewDoc.data();

        // Ensure the interview belongs to the authenticated user
        if (interviewData.userId !== userId) {
            console.warn(`[COMPLETE INTERVIEW WARNING] Unauthorized attempt to complete interview ${interviewId} by user ${userId}. Interview belongs to: ${interviewData.userId}`);
            return res.status(403).json({ message: 'Access denied. This interview does not belong to your account.' });
        }

        // Prevent completing an already completed/cancelled interview
        if (interviewData.status !== 'active') {
            console.warn(`[COMPLETE INTERVIEW WARNING] Attempt to complete interview ${interviewId} which is already ${interviewData.status}.`);
            return res.status(400).json({ message: `Interview is already ${interviewData.status}. Cannot complete.` });
        }

        console.log(`[COMPLETE INTERVIEW] Attempting to update interview ${interviewId} with status 'completed' and new results data.`);

        await interviewRef.update({
            status: 'completed', // Mark as completed
            overallScore: overallScore,
            strengths: strengths || [],
            improvements: improvements || [],
            questions: questions, // Save the detailed questions array with user answers, feedback, etc.
            duration: duration || null,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[COMPLETE INTERVIEW] Successfully updated interview ${interviewId} to 'completed' status and saved results.`);
        res.status(200).json({ message: 'Interview results saved successfully.' });

    } catch (error) {
        console.error(`[COMPLETE INTERVIEW ERROR] Error completing interview ${interviewId} in Firestore:`, error);
        res.status(500).json({ message: 'Failed to save interview results on the server.', error: error.message });
    }
});
// --- END /api/interview/complete ---

// --- ROUTE: GET /api/interviews/results/:interviewId ---
app.get('/api/interviews/results/:interviewId', verifyFirebaseToken, async (req, res) => {
    try {
        const { interviewId } = req.params;
        const userId = req.user.uid;

        console.log(`[FETCH RESULTS] GET /api/interviews/results/${interviewId} received for user ${userId}`);

        if (!interviewId) {
            console.warn(`[FETCH RESULTS WARNING] Interview ID is missing for results fetch.`);
            return res.status(400).json({ message: 'Interview ID is required.' });
        }

        const interviewDoc = await db.collection('interviews').doc(interviewId).get();

        if (!interviewDoc.exists) {
            console.warn(`[FETCH RESULTS WARNING] Attempted to fetch results for non-existent interview: ${interviewId}`);
            return res.status(404).json({ message: 'Interview not found.' });
        }

        const interviewData = interviewDoc.data();
        console.log(`[FETCH RESULTS] Fetched interview data for ${interviewId}. Current status: ${interviewData.status}, overallScore: ${interviewData.overallScore}`);

        // Ensure the interview belongs to the authenticated user
        if (interviewData.userId !== userId) {
            console.warn(`[FETCH RESULTS WARNING] Unauthorized access attempt to interview results ${interviewId} by user ${userId}. Interview belongs to: ${interviewData.userId}`);
            return res.status(403).json({ message: 'Access denied. This interview does not belong to your account.' });
        }

        // Check if the interview status is 'completed' and has detailed results
        if (interviewData.status !== 'completed' || interviewData.overallScore === null || !interviewData.questions || !Array.isArray(interviewData.questions) || interviewData.questions.length === 0) {
            console.warn(`[FETCH RESULTS WARNING] Interview ${interviewId} not considered completed or results are incomplete.`);
            return res.status(404).json({
                message: 'Interview results not found. It may not have completed or the ID is incorrect.',
                detail: 'Interview is not marked as completed or detailed results are missing.'
            });
        }

        // Construct the response object to match the frontend's InterviewResult interface
        res.status(200).json({
            id: interviewDoc.id,
            category: interviewData.category,
            difficulty: interviewData.difficulty,
            date: interviewData.completedAt ? interviewData.completedAt.toDate().toISOString() : interviewData.createdAt.toDate().toISOString(),
            duration: interviewData.duration || `${interviewData.numQuestions === 10 ? 30 : 15} minutes`, // Fallback
            overallScore: interviewData.overallScore,
            strengths: interviewData.strengths || [],
            improvements: interviewData.improvements || [],
            questions: interviewData.questions || [],
        });

    } catch (error) {
        console.error('[FETCH RESULTS ERROR] Error fetching interview results:', error);
        res.status(500).json({ message: 'Failed to retrieve interview results on the server.', error: error.message });
    }
});
// --- END /api/interviews/results/:interviewId ---

// --- ROUTE: GET /api/interviews/results/:interviewId/download ---
app.get('/api/interviews/results/:interviewId/download', verifyFirebaseToken, async (req, res) => {
    try {
        const { interviewId } = req.params;
        const userId = req.user.uid;

        console.log(`[DOWNLOAD REPORT] GET /api/interviews/results/${interviewId}/download received for user ${userId}`);

        if (!interviewId) {
            console.warn(`[DOWNLOAD REPORT WARNING] Interview ID is missing for report download.`);
            return res.status(400).json({ message: 'Interview ID is required.' });
        }

        const interviewDoc = await db.collection('interviews').doc(interviewId).get();

        if (!interviewDoc.exists) {
            console.warn(`[DOWNLOAD REPORT WARNING] Attempted to download report for non-existent interview: ${interviewId}`);
            return res.status(404).json({ message: 'Interview report not found.' });
        }

        const interviewData = interviewDoc.data();

        // Ensure the interview belongs to the authenticated user
        if (interviewData.userId !== userId) {
            console.warn(`[DOWNLOAD REPORT WARNING] Unauthorized access attempt to download report for interview ${interviewId} by user ${userId}. Interview belongs to: ${interviewData.userId}`);
            return res.status(403).json({ message: 'Access denied. This interview report does not belong to your account.' });
        }

        // Check if the interview is completed and has results
        if (interviewData.status !== 'completed' || interviewData.overallScore === null || !interviewData.questions || interviewData.questions.length === 0) {
            console.warn(`[DOWNLOAD REPORT WARNING] Interview ${interviewId} not completed or results incomplete for download.`);
            return res.status(404).json({
                message: 'Interview results not complete or available for download.',
                detail: 'Interview must be completed with full results to generate a report.'
            });
        }

        // --- PDF Generation Logic ---
        const doc = new PDFDocument({ margin: 50 });
        const filename = `interview_report_${interviewId}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res); // Pipe the PDF directly to the response

        // Title
        doc.fontSize(24).font('Helvetica-Bold').text('Interview Report', { align: 'center' });
        doc.moveDown(1.5);

        // Interview Summary
        doc.fontSize(16).font('Helvetica-Bold').text('Interview Summary');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Category: ${interviewData.category}`);
        doc.text(`Difficulty: ${interviewData.difficulty}`);
        doc.text(`Date: ${interviewData.completedAt ? interviewData.completedAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}`);
        doc.text(`Duration: ${interviewData.duration || 'N/A'}`);
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Bold').text(`Overall Score: ${interviewData.overallScore}%`);
        doc.moveDown(1);

        // Strengths
        doc.fontSize(16).font('Helvetica-Bold').text('Strengths');
        doc.fontSize(12).font('Helvetica');
        if (interviewData.strengths && interviewData.strengths.length > 0) {
            interviewData.strengths.forEach(s => doc.text(`• ${s}`));
        } else {
            doc.text('No specific strengths noted.');
        }
        doc.moveDown(1);

        // Areas for Improvement
        doc.fontSize(16).font('Helvetica-Bold').text('Areas for Improvement');
        doc.fontSize(12).font('Helvetica');
        if (interviewData.improvements && interviewData.improvements.length > 0) {
            interviewData.improvements.forEach(i => doc.text(`• ${i}`));
        } else {
            doc.text('No specific improvements noted.');
        }
        doc.moveDown(1.5);

        // Question Breakdown
        doc.fontSize(18).font('Helvetica-Bold').text('Question Breakdown', { align: 'center' });
        doc.moveDown(1);

        if (interviewData.questions && interviewData.questions.length > 0) {
            interviewData.questions.forEach((q, index) => {
                doc.fontSize(14).font('Helvetica-Bold').text(`Question ${index + 1}: ${q.text}`);
                doc.fontSize(12).font('Helvetica');
                doc.moveDown(0.2);
                doc.text(`Your Answer: ${q.userAnswer}`);
                doc.text(`AI Feedback: ${q.feedback}`);
                doc.text(`Score: ${q.score}%`);
                doc.moveDown(0.2);
                doc.text('Key Points:');
                if (q.keyPoints && q.keyPoints.length > 0) {
                    q.keyPoints.forEach(kp => {
                        doc.text(`   [${kp.met ? '✓' : '✗'}] ${kp.text}`);
                    });
                } else {
                    doc.text('   No key points provided.');
                }
                doc.moveDown(1); // Space after each question
            });
        } else {
            doc.fontSize(12).font('Helvetica').text('No detailed question results available.');
        }

        doc.end(); // Finalize the PDF and send it

        console.log(`[DOWNLOAD REPORT] Successfully generated and sent PDF report for interview ${interviewId}.`);

    } catch (error) {
        console.error('[DOWNLOAD REPORT ERROR] Error generating or sending interview report:', error);
        res.status(500).json({ message: 'Failed to generate or retrieve interview report on the server.', error: error.message });
    }
});
// --- END /api/interviews/results/:interviewId/download ---

// --- ROUTE: GET /api/user/interviews ---
app.get('/api/user/interviews', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        console.log(`[FETCH ALL USER INTERVIEWS] Received request for user ${userId}`);

        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token.' });
        }

        const interviewsSnapshot = await db.collection('interviews')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const interviews = [];
        interviewsSnapshot.forEach(doc => {
            const data = doc.data();
            interviews.push({
                id: doc.id,
                category: data.category,
                // Use completedAt if available, otherwise createdAt
                date: (data.completedAt || data.createdAt).toDate().toISOString(),
                score: data.overallScore !== null ? data.overallScore : (data.status === 'completed' ? data.overallScore : 'N/A'),
                questions: data.numQuestions || 0,
                status: data.status || 'unknown',
                duration: data.duration || null,
            });
        });

        console.log(`[FETCH ALL USER INTERVIEWS] Successfully fetched ${interviews.length} interviews for user ${userId}`);
        res.status(200).json(interviews);

    } catch (error) {
        console.error('[FETCH ALL USER INTERVIEWS ERROR] Error fetching user interviews in backend:', error);
        res.status(500).json({ message: 'Failed to fetch interview history from the server.', error: error.message });
    }
});
// --- END /api/user/interviews ---

// --- ROUTE: POST /api/interview/evaluate ---
app.post('/api/interview/evaluate', verifyFirebaseToken, async (req, res) => {
    const { question, userAnswer, category, difficulty, interviewId, questionId } = req.body;

    console.log(`[EVALUATE] Received request for interviewId: ${interviewId}, questionId: ${questionId}`);

    if (!question || typeof question !== 'string' || question.trim() === '') {
        console.error('[EVALUATE ERROR] Validation failed: Interview question is required.');
        return res.status(400).json({ message: 'Interview question is required.' });
    }
    if (typeof userAnswer !== 'string') {
        console.error('[EVALUATE ERROR] Validation failed: User answer must be a string.');
        return res.status(400).json({ message: 'User answer must be a string.' });
    }
    if (!category || typeof category !== 'string' || !difficulty || typeof difficulty !== 'string') {
        console.error('[EVALUATE ERROR] Validation failed: Category and difficulty are required for AI evaluation context.');
        return res.status(400).json({ message: 'Category and difficulty are required for AI evaluation context.' });
    }
    if (!interviewId || !questionId) {
        console.error('[EVALUATE ERROR] Validation failed: Interview ID and Question ID are required.');
        return res.status(400).json({ message: 'Interview ID and Question ID are required for evaluation.' });
    }

    try {
        const feedbackPrompt = `You are an expert interviewer providing concise and constructive feedback to a candidate's answer for a "${category}" interview question of "${difficulty}" difficulty. Provide a score out of 100 based on the answer's accuracy, completeness, and clarity. List 2-3 specific key points the answer *should* have covered, indicating whether the candidate met each. Keep your feedback brief (max 100 words).

        Example JSON format for output:
        {
          "feedback": "Your answer was accurate but lacked depth. You missed a key detail about X. Consider providing more context.",
          "score": 75,
          "keyPoints": [
            {"text": "Key point A explained", "met": true},
            {"text": "Key point B explained", "met": false}
          ]
        }

        Interview Question: "${question}"
        Candidate's Answer: "${userAnswer}"
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: feedbackPrompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300,
                responseMimeType: "application/json",
            },
        });

        const response = await result.response;
        const rawAiResponse = response.text();
        console.log(`[EVALUATE] Raw AI response received: ${rawAiResponse.substring(0, 200)}...`);

        let parsedAiResponse;
        try {
            parsedAiResponse = JSON.parse(rawAiResponse);
        } catch (parseError) {
            console.error(`[EVALUATE ERROR] Error parsing Gemini evaluation response. Raw: ${rawAiResponse}`, parseError);
            return res.status(500).json({
                message: 'AI provided malformed response. Please try again.',
                feedback: `Failed to parse AI feedback. Raw response: ${rawAiResponse}`,
                score: 50, // Default score on parse failure
                keyPoints: [{ text: "AI response parsing failed", met: false }]
            });
        }

        const aiFeedback = parsedAiResponse.feedback || "No specific feedback provided.";
        const aiScore = typeof parsedAiResponse.score === 'number' ? parsedAiResponse.score : 0;
        const aiKeyPoints = parsedAiResponse.keyPoints || [];

        res.json({
            feedback: aiFeedback,
            score: aiScore,
            keyPoints: aiKeyPoints
        });

    } catch (error) {
        console.error('[EVALUATE ERROR] Error calling Gemini API for evaluation:', error);
        res.status(500).json({ message: 'Failed to get AI feedback from Gemini.', details: error.message });
    }
});
// --- END /api/interview/evaluate ---

// --- ROUTE: GET /api/recommendations ---
app.get('/api/recommendations', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        console.log(`[RECOMMENDATIONS] Received request for user ${userId}`);

        // Fetch all completed interviews for the user
        const interviewsSnapshot = await db.collection('interviews')
            .where('userId', '==', userId)
            .where('status', '==', 'completed')
            .get();

        const categoryScores = {}; // To store total score and count per category

        // Calculate average score for each category
        interviewsSnapshot.forEach(doc => {
            const data = doc.data();
            if (typeof data.overallScore === 'number' && data.overallScore !== null) {
                if (!categoryScores[data.category]) {
                    categoryScores[data.category] = { totalScore: 0, count: 0 };
                }
                categoryScores[data.category].totalScore += data.overallScore;
                categoryScores[data.category].count += 1;
            }
        });

        const recommendations = [];
        const THRESHOLD_SCORE = 75; // Define a threshold for "weak" performance

        // Generate recommendations based on categories with average scores below the threshold
        for (const category in categoryScores) {
            const avgScore = categoryScores[category].totalScore / categoryScores[category].count;
            if (avgScore < THRESHOLD_SCORE) {
                recommendations.push({
                    id: uuidv4(),
                    category: category,
                    area: `${category} Fundamentals`,
                    description: `Your average score in ${category} interviews is ${avgScore.toFixed(0)}%. Focus on core concepts and common problems in this area.`,
                    priority: 'high'
                });
            }
        }

        // Add general recommendations if no specific weak areas, or if user hasn't started
        if (recommendations.length === 0 && interviewsSnapshot.empty) {
            recommendations.push({
                id: uuidv4(),
                category: 'Getting Started',
                area: 'First Interview',
                description: 'Welcome! Start your first interview to get personalized recommendations and track your progress.',
                priority: 'high'
            });
        } else if (recommendations.length === 0) {
            recommendations.push({
                id: uuidv4(),
                category: 'General Improvement',
                area: 'Advanced Topics',
                description: 'You are performing well across categories! Consider exploring more advanced topics or challenging interview types.',
                priority: 'medium'
            });
        }

        console.log(`[RECOMMENDATIONS] Generated ${recommendations.length} recommendations for user ${userId}`);
        res.status(200).json(recommendations);

    } catch (error) {
        console.error('[RECOMMENDATIONS ERROR] Error fetching recommendations:', error);
        res.status(500).json({ message: 'Failed to fetch recommendations.', error: error.message });
    }
});
// --- END /api/recommendations ---

// =======================================================
// --- Scheduling Management Routes (Now sending email for new scheduled items) ---
// These manage scheduled interviews, distinct from active/completed sessions
// =======================================================

// --- MODIFIED ROUTE: POST /api/schedule (Add a new scheduled interview AND send email) ---
// This endpoint is called by frontend's Schedule.tsx.
app.post('/api/schedule', verifyFirebaseToken, async (req, res) => {
    try {
        const { category, scheduledDateTime, notes } = req.body;
        const userId = req.user.uid; // Get userId from the verified token

        console.log(`[SCHEDULE] Received request to schedule for user ${userId}, category: ${category}`);

        if (!userId || !category || !scheduledDateTime) {
            return res.status(400).json({ message: 'Missing required fields: category, scheduledDateTime.' });
        }

        // Get user details for email from Firebase Auth
        let userEmail = 'unknown@example.com';
        let userName = 'User';
        try {
            const userRecord = await admin.auth().getUser(userId);
            userEmail = userRecord.email || userEmail;
            userName = userRecord.displayName || userRecord.email || userName;
        } catch (authError) {
            console.warn(`Could not fetch user details for email for userId: ${userId}. Using defaults.`, authError);
        }

        const newScheduleId = uuidv4(); // Generate a unique ID for the scheduled item

        const newScheduledItem = {
            id: newScheduleId, // Store ID in the document too for easy reference
            userId: userId,
            category: category,
            scheduledDateTime: new Date(scheduledDateTime), // Store as Firestore Timestamp
            notes: notes || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            // Store user email/name in scheduled item for audit/future use
            userEmail: userEmail,
            userName: userName
        };
        await db.collection('scheduledInterviews').doc(newScheduleId).set(newScheduledItem);

        console.log(`[SCHEDULE] Successfully scheduled interview ${newScheduleId} for user ${userId} in category ${category}.`);

        // --- NEW: Send the email confirmation from this route ---
        const emailSent = await sendScheduledInterviewEmail(
            userEmail,
            userName,
            {
                category: category,
                scheduledDateTime: newScheduledItem.scheduledDateTime.toISOString(), // Pass ISO string
                notes: notes
            }
        );

        if (emailSent) {
            console.log(`[SCHEDULE] Confirmation email sent for scheduled item ID: ${newScheduleId}`);
        } else {
            console.warn(`[SCHEDULE] Failed to send confirmation email for scheduled item ID: ${newScheduleId}.`);
        }

        // Return the newly created item including its ID, converting date back to ISO string for frontend
        res.status(201).json({
            ...newScheduledItem,
            scheduledDateTime: newScheduledItem.scheduledDateTime.toISOString(),
            emailStatus: emailSent ? 'sent' : 'failed' // Include email status in response
        });

    } catch (error) {
        console.error('[SCHEDULE ERROR] Error scheduling interview:', error);
        res.status(500).json({ message: 'Failed to schedule interview on the server.', error: error.message });
    }
});
// --- END MODIFIED ROUTE: /api/schedule POST ---

// --- ROUTE: GET /api/schedule (Fetch all scheduled interviews for a user) ---
app.get('/api/schedule', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        console.log(`[FETCH SCHEDULES] Received request to fetch schedules for user ${userId}`);

        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token.' });
        }

        const scheduleSnapshot = await db.collection('scheduledInterviews')
            .where('userId', '==', userId)
            .orderBy('scheduledDateTime', 'asc') // Order by upcoming dates
            .get();

        const scheduledItems = [];
        scheduleSnapshot.forEach(doc => {
            const data = doc.data();
            scheduledItems.push({
                id: doc.id,
                category: data.category,
                // Convert Firestore Timestamp to ISO string for frontend
                scheduledDateTime: data.scheduledDateTime ? data.scheduledDateTime.toDate().toISOString() : null,
                notes: data.notes || '',
            });
        });
        console.log(`[FETCH SCHEDULES] Successfully fetched ${scheduledItems.length} scheduled interviews for user ${userId}.`);
        res.status(200).json(scheduledItems);

    } catch (error) {
        console.error('[FETCH SCHEDULES ERROR] Error fetching scheduled interviews:', error);
        res.status(500).json({ message: 'Failed to fetch scheduled interviews from the server.', error: error.message });
    }
});
// --- END /api/schedule GET ---

// --- ROUTE: DELETE /api/schedule/:id (Delete a scheduled interview) ---
app.delete('/api/schedule/:id', verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        console.log(`[DELETE SCHEDULE] Received request to delete schedule ID: ${id} by user ${userId}`);


        if (!id) {
            return res.status(400).json({ message: 'Scheduled interview ID is required.' });
        }

        const scheduledItemRef = db.collection('scheduledInterviews').doc(id);
        const doc = await scheduledItemRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Scheduled interview not found.' });
        }

        // Ensure the user owns this scheduled item before deleting
        if (doc.data().userId !== userId) {
            return res.status(403).json({ message: 'Access denied. You do not have permission to delete this item.' });
        }

        await scheduledItemRef.delete();
        console.log(`[DELETE SCHEDULE] Successfully deleted scheduled interview ${id} for user ${userId}.`);
        res.status(200).json({ message: 'Scheduled interview deleted successfully.' });

    } catch (error) {
        console.error('[DELETE SCHEDULE ERROR] Error deleting scheduled interview:', error);
        res.status(500).json({ message: 'Failed to delete scheduled interview on the server.', error: error.message });
    }
});
// --- END /api/schedule DELETE ---


// --- Serve React App (Frontend) ---
console.log("Server.js: Setting up history API fallback for frontend routing."); // NEW: Log for history fallback
app.use(history()); // NEW: Use history API fallback
console.log("Server.js: Setting up static file serving for frontend.");
// Serve static files from 'backend/build'
app.use(express.static(path.join(__dirname, 'build')));
console.log("Server.js: Static files path set to:", path.join(__dirname, 'build'));

// IMPORTANT: No app.get('/') or app.get('/*') needed here,
// as connect-history-api-fallback and express.static handle it.


// Start the server
console.log(`Server.js: Attempting to start server on port: ${port}`);
app.listen(port, () => {
    console.log(`Server.js: Backend server is running on port ${port}`);
    console.log(`Server.js: SENDER_EMAIL: ${process.env.SENDER_EMAIL ? 'Loaded' : 'Not Loaded'}`); // Confirm env var is loaded
    console.log(`Server.js: FRONTEND_URL: ${process.env.FRONTEND_URL ? process.env.FRONTEND_URL : 'Not Loaded'}`); // Confirm env var is loaded
    console.log("Server.js: Application fully started!");
});

// Add general error handler at the very end to catch unhandled promise rejections or uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Server.js UNHANDLED REJECTION:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Server.js UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});