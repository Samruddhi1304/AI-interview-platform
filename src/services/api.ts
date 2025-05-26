// frontend/src/services/api.ts

import axios from 'axios';
import { InterviewCategory, InterviewDifficulty, InterviewDuration, InterviewSession, InterviewResult } from '../types';

// This is where your Express server will run, typically loaded from .env for production
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// --- Mock API Delay (for simulated async operations) ---
const MOCK_API_DELAY = 500; // milliseconds

/**
 * Directly fetches AI response from your Express backend.
 * This is intended for your actual AI interaction, like generating questions or evaluating answers.
 */
export const getAiResponse = async (prompt: string, idToken: string): Promise<string> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/get-ai-response`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` // IMPORTANT: Pass the Firebase ID token for authentication
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.response; // The AI's response text from your backend
    } catch (error: any) {
        console.error('Error fetching AI response from Express backend:', error);
        throw new Error(`Could not get AI response. Please ensure backend is running. Details: ${error.message}`);
    }
};

/**
 * Consolidated API client with mock implementations for parts not yet backed by your server.
 * Your application can use this 'api' object for other features, while 'getAiResponse' is for direct AI calls.
 */
const api = {
    // Auth endpoints (MOCKED - Use Firebase Auth directly for authentication)
    auth: {
        login: async (email: string, password: string) => {
            console.warn("Using MOCKED auth.login. If you're using Firebase, this won't be called for actual login.");
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (email === 'demo@example.com' && password === 'password') {
                        resolve({ user: { id: 'mock-auth-1', name: 'Demo User', email: 'demo@example.com' }, token: 'mock-jwt-token' });
                    } else {
                        reject(new Error('Invalid credentials (mock)'));
                    }
                }, MOCK_API_DELAY);
            });
        },

        register: async (name: string, email: string, password: string) => {
            console.warn("Using MOCKED auth.register. If you're using Firebase, this won't be called for actual registration.");
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ user: { id: 'mock-auth-2', name, email }, token: 'mock-jwt-token' });
                }, MOCK_API_DELAY);
            });
        },

        logout: async () => {
            console.warn("Using MOCKED auth.logout. If you're using Firebase, this won't be called for actual logout.");
            return new Promise((resolve) => {
                setTimeout(resolve, MOCK_API_DELAY);
            });
        }
    },

    // Interview endpoints (MOCKED - Replace with actual backend calls as your server grows)
    interviews: {
        createSession: async (
            category: InterviewCategory,
            difficulty: InterviewDifficulty,
            duration: InterviewDuration,
            idToken: string // Add idToken for authentication if your backend needs it
        ) => {
            console.log("MOCKED interviews.createSession called.");
            // Example for a real API call if you set up a backend endpoint:
            /*
            const response = await axios.post(`${BACKEND_URL}/api/interview/create`, { category, difficulty, duration }, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            return response.data;
            */
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ id: `mock-session-${Math.random().toString(36).substring(2, 11)}`, status: 'created' });
                }, MOCK_API_DELAY);
            });
        },

        getQuestion: async (sessionId: string, questionIndex: number, idToken: string) => {
            console.log("MOCKED interviews.getQuestion called.");
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        id: `mock-q-${questionIndex}`,
                        text: `This is a sample question for session ${sessionId}, question ${questionIndex + 1}. (MOCKED)`,
                        questionIndex,
                        totalQuestions: 10
                    });
                }, MOCK_API_DELAY);
            });
        },

        submitAnswer: async (sessionId: string, questionId: string, answer: string, idToken: string) => {
            console.warn("MOCKED interviews.submitAnswer called. Consider using getAiResponse or a dedicated backend endpoint for evaluation.");
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ received: true, nextQuestion: questionId.endsWith('9') ? null : { id: `mock-q-${parseInt(questionId.split('-')[1]) + 1}` } });
                }, MOCK_API_DELAY);
            });
        },

        endSession: async (sessionId: string, idToken: string) => {
            console.log("MOCKED interviews.endSession called.");
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ resultId: `mock-result-${Math.random().toString(36).substring(2, 11)}` });
                }, MOCK_API_DELAY);
            });
        }
    },

    // Results endpoints (MOCKED - Replace with actual backend calls)
    results: {
        getResult: async (resultId: string): Promise<InterviewResult> => {
            console.log("MOCKED results.getResult called.");
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        id: resultId,
                        category: 'General', difficulty: 'Easy', date: new Date().toISOString(), duration: '10 minutes',
                        overallScore: 75, strengths: ['Good communication (mock)'], improvements: ['More technical depth (mock)'],
                        questions: [{ id: 'q1', text: 'Tell me about yourself.', userAnswer: '...', feedback: '...', score: 75, keyPoints: [] }]
                    });
                }, MOCK_API_DELAY);
            });
        },

        getUserResults: async (idToken: string) => {
            console.log("MOCKED results.getUserResults called.");
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve([
                        { id: 'mock-user-result-1', category: 'Backend', date: '2025-05-20', score: 90 },
                        { id: 'mock-user-result-2', category: 'Frontend', date: '2025-05-18', score: 80 }
                    ]);
                }, MOCK_API_DELAY);
            });
        }
    },

    // AI endpoints (Placeholder/MOCKED - getAiResponse is the primary one for backend interaction)
    ai: {
        // This is a mock; your getAiResponse is the actual backend call for AI
        generateQuestion: async (category: InterviewCategory, difficulty: InterviewDifficulty, idToken?: string) => {
            console.warn("MOCKED ai.generateQuestion called. Use getAiResponse for actual backend AI calls.");
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ question: 'This is a sample question generated by mock AI.' });
                }, MOCK_API_DELAY);
            });
        },

        // This is a mock; your getAiResponse is the actual backend call for AI
        evaluateAnswer: async (question: string, answer: string, idToken?: string) => {
            console.warn("MOCKED ai.evaluateAnswer called. Use getAiResponse for actual backend AI calls for evaluation.");
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ score: 80, feedback: 'Sample feedback from mock AI evaluation.', strengths: [], improvements: [] });
                }, MOCK_API_DELAY);
            });
        }
    }
};

export default api;