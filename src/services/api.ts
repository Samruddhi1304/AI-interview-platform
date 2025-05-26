// frontend/src/services/api.ts

const BACKEND_URL = 'http://localhost:3001'; // This is where your Express server will run

export const getAiResponse = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/get-ai-response`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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

// You can remove all other mock functions (auth, interviews, results, ai.generateQuestion, ai.evaluateAnswer)
// from this file, as your application might not be using them, or they might be handled
// by Firebase Auth and the mock data in InterviewSession.tsx for questions.
// The key is that getAiResponse is the one calling your Node.js backend.