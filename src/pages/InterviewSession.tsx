// src/pages/InterviewSession.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Clock, AlertCircle, ArrowRight, Send, Lightbulb } from 'lucide-react';
import Card, { CardBody, CardFooter, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import TextArea from '../components/ui/TextArea';
import { useAuth } from '../context/AuthContext'; // Using useAuth to get user details for API
import axios from 'axios'; // For making API calls

// Interface for a single question object fetched from backend
interface Question {
    id: string;
    text: string;
}

// Interface for a detailed answered question (to be stored in state)
interface AnsweredQuestion {
    id: string; // Question ID
    text: string; // Question text
    userAnswer: string;
    feedback: string;
    score: number;
    keyPoints: { text: string; met: boolean }[];
}

// Interface for the full interview data fetched from the backend
interface InterviewData {
    category: string;
    difficulty: string;
    totalQuestions: number;
    questions: Question[];
    durationMinutes: number; // Assuming your backend gives duration in minutes
}

const InterviewSession = () => {
    const { user, firebaseUser, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id: interviewId } = useParams<{ id: string }>();
    const location = useLocation();

    // State for the fetched interview data
    const [interviewDetails, setInterviewDetails] = useState<InterviewData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(0); // In seconds
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState<AnsweredQuestion[]>([]); // Stores all user answers with feedback
    const [isTimeWarning, setIsTimeWarning] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);

    // New states for loading/error specific to fetching the interview session
    const [sessionLoading, setSessionLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [isCompletingInterview, setIsCompletingInterview] = useState(false); // State for interview finalization loading

    // Diagnostic logs
    console.log(`InterviewSession Render (ID: ${interviewId}) for path: ${location.pathname}`);
    console.log(`   - authLoading: ${authLoading}`);
    console.log(`   - isAuthenticated: ${isAuthenticated}`);
    console.log(`   - user:`, user);
    console.log(`   - firebaseUser:`, firebaseUser);

    // --- Function to COMPLETE INTERVIEW on backend ---
    const completeInterview = useCallback(async () => {
        if (!interviewId || !firebaseUser || !interviewDetails) {
            console.error("InterviewSession: Cannot complete interview - ID, user, or interview details missing.");
            return;
        }

        setIsCompletingInterview(true);
        try {
            const idToken = await firebaseUser.getIdToken();
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

            // Calculate Overall Score from collected answers
            const totalScore = answers.reduce((sum, q) => sum + q.score, 0);
            const overallScore = answers.length > 0 ? Math.round(totalScore / answers.length) : 0; // Round the score

            // Calculate actual duration taken
            const actualDurationSeconds = (interviewDetails.durationMinutes * 60) - timeRemaining;
            const minutesTaken = Math.floor(actualDurationSeconds / 60);
            const secondsTaken = actualDurationSeconds % 60;
            const finalDurationString = `${minutesTaken}:${secondsTaken.toString().padStart(2, '0')}`;

            // Basic Strengths/Improvements - enhance this with more sophisticated AI logic or analysis later
            const strengths: string[] = [];
            const improvements: string[] = [];

            if (overallScore >= 70) {
                strengths.push("Demonstrated a strong understanding of core concepts.");
            } else if (overallScore >= 50) {
                strengths.push("Good grasp of some areas, with potential for improvement.");
            }

            if (overallScore < 70) {
                improvements.push("Could improve on fundamental understanding.");
            }
            if (answers.length < interviewDetails.totalQuestions) {
                improvements.push("Not all questions were attempted or evaluated.");
            }
            // Example: Analyze specific questions with low scores to add more targeted improvements
            answers.forEach(ans => {
                if (ans.score < 50) {
                    improvements.push(`Review material related to "${ans.text.substring(0, 30)}..." (scored ${ans.score}/100)`);
                }
            });


            console.log("InterviewSession: Sending payload to /api/interview/complete:", {
                interviewId: interviewId,
                overallScore: overallScore,
                strengths: strengths,
                improvements: improvements,
                questions: answers, // This is the detailed array of AnsweredQuestion objects
                duration: finalDurationString
            });

            await axios.post(`${backendUrl}/api/interview/complete`, {
                interviewId: interviewId,
                overallScore: overallScore,
                strengths: strengths,
                improvements: improvements,
                questions: answers, // Crucial: Send the compiled detailed answers array
                duration: finalDurationString // Send the calculated duration
            }, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json', // Good practice to explicitly set this
                },
            });
            console.log("InterviewSession: Interview completion recorded successfully.");
            navigate(`/results/${interviewId}`); // Navigate after successful completion API call

        } catch (err: any) {
            console.error("InterviewSession: Error completing interview on backend:", err);
            if (axios.isAxiosError(err) && err.response) {
                console.error("Backend response status:", err.response.status);
                console.error("Backend response data:", err.response.data);
                setSessionError(err.response.data.message || "Failed to finalize interview. Please try again.");
            } else {
                setSessionError("An unexpected error occurred while finalizing interview.");
            }
        } finally {
            setIsCompletingInterview(false);
        }
    }, [interviewId, firebaseUser, answers, interviewDetails, timeRemaining, navigate]);


    // Memoize handleEndInterview to prevent unnecessary re-renders in useEffect
    const handleEndInterview = useCallback(() => {
        console.log("InterviewSession: Ending interview. Calling completeInterview.");
        completeInterview(); // Call the new completion function
    }, [completeInterview]); // Added completeInterview to dependencies


    // --- Effect to FETCH INTERVIEW DETAILS from backend ---
    useEffect(() => {
        const fetchInterviewDetails = async () => {
            if (!interviewId) {
                console.error("InterviewSession: No interviewId found in URL parameters.");
                setSessionError("No interview ID provided. Please start a new interview.");
                setSessionLoading(false);
                return;
            }

            if (authLoading || !isAuthenticated || !firebaseUser) {
                console.log("InterviewSession: Waiting for authentication to load or user to be present.");
                return;
            }

            setSessionLoading(true);
            setSessionError(null);
            console.log("InterviewSession: Attempting to fetch interview details...");

            try {
                const idToken = await firebaseUser.getIdToken();
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

                const response = await axios.get(`${backendUrl}/api/interviews/${interviewId}`, {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                });

                const fetchedData: InterviewData = response.data;
                console.log("InterviewSession: Fetched interview details:", fetchedData);

                setInterviewDetails(fetchedData);
                setTimeRemaining(fetchedData.durationMinutes * 60); // Set time in seconds
                setCurrentQuestionIndex(0); // Always start from the first question
                setAnswers([]); // Ensure answers are cleared for a new session
            } catch (err) {
                console.error("InterviewSession: Error fetching interview details:", err);
                if (axios.isAxiosError(err) && err.response) {
                    if (err.response.status === 401 || err.response.status === 403) {
                        setSessionError("Authentication expired or invalid. Please log in again.");
                        navigate('/login');
                    } else {
                        setSessionError(err.response.data.message || "Failed to load interview details. Please check your backend.");
                    }
                } else {
                    setSessionError("An unexpected error occurred while loading interview details.");
                }
            } finally {
                setSessionLoading(false);
            }
        };

        fetchInterviewDetails();
    }, [interviewId, isAuthenticated, authLoading, firebaseUser, navigate]); // Dependencies for this effect

    // --- Timer Effect ---
    useEffect(() => {
        if (interviewDetails && timeRemaining > 0 && !isCompletingInterview) { // Also stop timer if completing
            const timer = setInterval(() => {
                setTimeRemaining((prevTime) => {
                    if (prevTime <= 0) {
                        clearInterval(timer);
                        handleEndInterview(); // End interview if time runs out
                        return 0;
                    }

                    if (prevTime <= 300 && !isTimeWarning) { // 5 minutes warning (300 seconds)
                        setIsTimeWarning(true);
                    }
                    return prevTime - 1;
                });
            }, 1000);

            return () => clearInterval(timer); // Cleanup on unmount or dependency change
        }
    }, [interviewDetails, timeRemaining, isTimeWarning, handleEndInterview, isCompletingInterview]);

    const currentQuestion = interviewDetails?.questions[currentQuestionIndex];

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSubmitAnswer = async () => {
        setIsSubmitting(true);
        setAiFeedback(null); // Clear previous feedback
        setFeedbackError(null); // Clear previous errors

        if (!firebaseUser || !currentQuestion || !interviewDetails) { // Check for all required data
            setFeedbackError("Authentication, question details, or interview context missing. Please try again.");
            console.error("InterviewSession: handleSubmitAnswer - Missing critical data for API call.");
            navigate('/login'); // Consider navigating to login or just showing error
            setIsSubmitting(false);
            return;
        }

        try {
            const idToken = await firebaseUser.getIdToken();
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

            console.log("InterviewSession: handleSubmitAnswer - Sending data for AI feedback:", {
                interviewId: interviewId,
                questionId: currentQuestion.id,
                question: currentQuestion.text,
                userAnswer: answer,
                category: interviewDetails.category,
                difficulty: interviewDetails.difficulty
            });

            const response = await fetch(`${backendUrl}/api/interview/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    interviewId: interviewId,
                    questionId: currentQuestion.id,
                    question: currentQuestion.text,
                    userAnswer: answer,
                    category: interviewDetails.category,
                    difficulty: interviewDetails.difficulty
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401 || response.status === 403) {
                    console.error("InterviewSession: handleSubmitAnswer - API returned 401/403. Redirecting to login.");
                    navigate('/login');
                    return;
                }
                throw new Error(errorData.message || 'Failed to get AI feedback.');
            }

            const data = await response.json();
            console.log("InterviewSession: AI Feedback received:", data);

            setAiFeedback(data.feedback);

            // Store the full evaluated question data in the answers array
            setAnswers(prevAnswers => {
                const existingQuestionIndex = prevAnswers.findIndex(q => q.id === currentQuestion.id);
                const newAnsweredQuestion: AnsweredQuestion = {
                    id: currentQuestion.id,
                    text: currentQuestion.text,
                    userAnswer: answer,
                    feedback: data.feedback,
                    score: data.score,
                    keyPoints: data.keyPoints || [] // Ensure keyPoints is an array, even if empty
                };

                if (existingQuestionIndex > -1) {
                    // Update existing if already answered (e.g., if user went back)
                    const updatedAnswers = [...prevAnswers];
                    updatedAnswers[existingQuestionIndex] = newAnsweredQuestion;
                    return updatedAnswers;
                } else {
                    // Add new if it's the first time answering this question
                    return [...prevAnswers, newAnsweredQuestion];
                }
            });

        } catch (err: any) {
            console.error("InterviewSession: Error getting AI feedback:", err);
            setFeedbackError(err.message || "An error occurred while getting AI feedback.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNextQuestion = () => {
        setAiFeedback(null); // Clear feedback for next question
        setFeedbackError(null); // Clear errors for next question
        setAnswer(''); // Clear the answer input for the next question
        console.log("InterviewSession: Moving to next question.");

        if (currentQuestionIndex === (interviewDetails?.questions.length || 0) - 1) {
            console.log("InterviewSession: Last question. Calling handleEndInterview.");
            handleEndInterview();
        } else {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        }
    };

    // --- Conditional Rendering for Loading/Error states ---
    if (sessionLoading || authLoading) {
        return <div className="text-center py-10 text-gray-700">Loading interview session...</div>;
    }

    if (sessionError) {
        return (
            <div className="text-center py-10 text-red-600">
                <AlertCircle size={48} className="mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Error loading interview:</p>
                <p className="text-md">{sessionError}</p>
                <Button onClick={() => navigate('/dashboard')} className="mt-6">
                    Go to Dashboard
                </Button>
            </div>
        );
    }

    // If interviewDetails is null after loading, something went wrong or no interview found
    if (!interviewDetails || !currentQuestion) {
        return (
            <div className="text-center py-10 text-gray-700">
                <AlertCircle size={48} className="mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Interview not found or questions missing.</p>
                <p className="text-md">Please ensure the interview ID is valid and try again from the setup page.</p>
                <Button onClick={() => navigate('/interview/setup')} className="mt-6">
                    Setup New Interview
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {interviewDetails.category} Interview
                    </h1>
                    <p className="text-sm text-gray-500">
                        Difficulty: {interviewDetails.difficulty} • Question {currentQuestionIndex + 1}/{interviewDetails.totalQuestions}
                    </p>
                </div>
                <div className={`mt-4 md:mt-0 ${isTimeWarning ? 'animate-pulse' : ''}`}>
                    <div className={`flex items-center px-4 py-2 rounded-full ${
                        isTimeWarning ? 'bg-error-100 text-error-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                        <Clock size={18} className="mr-2" />
                        <span className="font-medium">{formatTime(timeRemaining)}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-12">
                    <Card className="mb-6">
                        <CardHeader className="bg-primary-50">
                            <h2 className="text-lg font-medium text-primary-800">Question {currentQuestionIndex + 1}</h2>
                        </CardHeader>
                        <CardBody>
                            <p className="text-gray-800">{currentQuestion.text}</p>
                        </CardBody>
                    </Card>
                </div>

                {/* Display AI Feedback here */}
                {aiFeedback && (
                    <div className="md:col-span-12">
                        <Card className="mb-6 bg-green-50 border border-green-200">
                            <CardHeader className="bg-green-100">
                                <h3 className="text-lg font-medium text-green-800 flex items-center">
                                    <Lightbulb size={18} className="mr-2" /> AI Feedback
                                </h3>
                            </CardHeader>
                            <CardBody>
                                <p className="text-gray-800 whitespace-pre-wrap">{aiFeedback}</p>
                            </CardBody>
                        </Card>
                    </div>
                )}

                {feedbackError && (
                    <div className="md:col-span-12">
                        <div className="flex items-center mt-4 p-3 bg-error-50 text-error-700 rounded-md">
                            <AlertCircle size={18} className="mr-2" />
                            <span>Error getting feedback: {feedbackError}</span>
                        </div>
                    </div>
                )}

                <div className="md:col-span-12">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-medium text-gray-900">Your Answer</h3>
                        </CardHeader>
                        <CardBody>
                            <TextArea
                                id="answer"
                                placeholder="Type your answer here..."
                                rows={8}
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className="focus:border-primary-500 focus:ring-primary-500"
                                disabled={isSubmitting || !!aiFeedback || isCompletingInterview} // Disable while submitting, feedback is shown, or completing
                            />

                            {isTimeWarning && (
                                <div className="flex items-center mt-4 p-3 bg-error-50 text-error-700 rounded-md">
                                    <AlertCircle size={18} className="mr-2" />
                                    <span>Less than 5 minutes remaining!</span>
                                </div>
                            )}
                        </CardBody>
                        <CardFooter className="flex justify-between">
                            <div className="flex items-center">
                                <span className="text-sm text-gray-500">
                                    {(interviewDetails?.questions.length || 0) - currentQuestionIndex - 1} questions remaining
                                </span>
                            </div>
                            <div className="flex space-x-4">
                                {aiFeedback ? ( // Show Next Question button AFTER feedback is received
                                    currentQuestionIndex < (interviewDetails?.questions.length || 0) - 1 ? (
                                        <Button
                                            onClick={handleNextQuestion}
                                            rightIcon={<ArrowRight size={16} />}
                                            isLoading={isCompletingInterview} // Show loading if interview is finalizing
                                            disabled={isCompletingInterview}
                                        >
                                            Next Question
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleEndInterview}
                                            rightIcon={<Send size={16} />}
                                            isLoading={isCompletingInterview} // Show loading if interview is finalizing
                                            disabled={isCompletingInterview}
                                        >
                                            Finish Interview
                                        </Button>
                                    )
                                ) : ( // Show Submit Answer button BEFORE feedback is received
                                    <Button
                                        onClick={handleSubmitAnswer}
                                        isLoading={isSubmitting || isCompletingInterview} // Disable if submitting answer or completing interview
                                        disabled={!answer.trim() || isCompletingInterview}
                                        rightIcon={<ArrowRight size={16} />}
                                    >
                                        Submit Answer
                                    </Button>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default InterviewSession;