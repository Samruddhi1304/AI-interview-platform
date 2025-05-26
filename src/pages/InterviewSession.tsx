// src/pages/InterviewSession.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom'; // Import useLocation
import { Clock, AlertCircle, ArrowRight, Send, Lightbulb } from 'lucide-react';
import Card, { CardBody, CardFooter, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import TextArea from '../components/ui/TextArea';
import { useAuth } from '../context/AuthContext'; // Using useAuth to get user details for API

// Mock data for a sample interview (for development/testing purposes)
const mockInterviewData = {
  category: 'Web Development',
  difficulty: 'Medium',
  currentQuestionIndex: 0,
  totalQuestions: 10,
  timeRemaining: 30 * 60, // 30 minutes in seconds
  questions: [
    {
      id: 'q1',
      text: 'Explain the difference between React props and state. When would you use one over the other?',
      expectedAnswerPoints: [
        'Props are passed from parent components, state is managed within a component',
        'Props are immutable, state can be updated with setState',
        'Props configure a component, state tracks changing data',
        'Use props for data that doesn\'t change, state for data that changes over time'
      ]
    },
    {
      id: 'q2',
      text: 'What is the virtual DOM in React and how does it improve performance?',
      expectedAnswerPoints: [
        'Virtual DOM is a lightweight copy of the actual DOM',
        'React uses it to perform diffing before updating the real DOM',
        'Minimizes direct DOM manipulation which is slow',
        'Batches multiple updates together for better performance'
      ]
    },
    // ... (rest of your mock questions, ensuring you have at least 10 if totalQuestions is 10)
    {
      id: 'q10',
      text: 'Explain the concept of code splitting in React and how it improves application performance.',
      expectedAnswerPoints: [
        'Splitting code into smaller chunks loaded on demand',
        'Uses dynamic import() and React.lazy',
        'Reduces initial bundle size and load time',
        'Can be route-based or component-based'
      ]
    }
  ]
};

const InterviewSession = () => {
  const { currentUser, isAuthenticated, isLoading } = useAuth(); // We need all three for debugging
  const navigate = useNavigate();
  const { id } = useParams(); // 'id' will be the interviewId from InterviewSetup
  const location = useLocation(); // To get state passed from InterviewSetup

  // >>> ADDED LOGS HERE <<<
  console.log(`InterviewSession Render (ID: ${id}) for path: ${location.pathname}`);
  console.log(`  - isLoading from AuthContext: ${isLoading}`);
  console.log(`  - isAuthenticated from AuthContext: ${isAuthenticated}`);
  console.log(`  - currentUser from AuthContext: ${currentUser ? currentUser.uid : "null"}`);
  // >>> END LOGS <<<

  const [interviewData, setInterviewData] = useState(mockInterviewData); // In a real app, this would be fetched from backend
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(interviewData.timeRemaining);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // Stores all user answers
  const [isTimeWarning, setIsTimeWarning] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const currentQuestion = interviewData.questions[currentQuestionIndex];

  // Memoize handleEndInterview to prevent unnecessary re-renders in useEffect
  const handleEndInterview = useCallback(() => {
    // In a real app, send all answers to the backend for final evaluation
    // and then redirect to the results page.
    console.log("InterviewSession: Ending interview. Navigating to results page.");
    navigate(`/results/new-result-123`); // Use a real interview ID here
  }, [navigate]);

  useEffect(() => {
    // This component is only rendered if ProtectedRoute allows it,
    // so `isAuthenticated` check is not strictly needed here for navigation.
    // However, it's good to ensure currentUser is available for API calls.

    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          handleEndInterview();
          return 0;
        }

        // Set warning when less than 5 minutes remain (300 seconds)
        if (prevTime <= 300 && !isTimeWarning) {
          setIsTimeWarning(true);
        }

        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleEndInterview, isTimeWarning]);


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmitAnswer = async () => {
    setIsSubmitting(true);
    setAiFeedback(null); // Clear previous feedback
    setFeedbackError(null); // Clear previous errors

    // Save the current answer locally
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));

    if (!currentUser) {
      setFeedbackError("User not authenticated. Please log in to get AI feedback.");
      console.error("InterviewSession: handleSubmitAnswer - No current user detected for API call. Redirecting to login.");
      navigate('/login');
      setIsSubmitting(false);
      return;
    }

    try {
      const idToken = await currentUser.getIdToken(); // Get the Firebase ID token
      console.log("InterviewSession: handleSubmitAnswer - Firebase ID Token obtained for AI feedback.");

      // --- ACTUAL API CALL TO YOUR BACKEND FOR AI EVALUATION ---
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      console.log("InterviewSession: handleSubmitAnswer - Backend URL for AI feedback:", backendUrl);
      console.log("InterviewSession: handleSubmitAnswer - Sending data for AI feedback:", {
        interviewId: id,
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        userAnswer: answer,
        category: interviewData.category,
        difficulty: interviewData.difficulty
      });

      const response = await fetch(`${backendUrl}/api/interview/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}` // Pass the token
        },
        body: JSON.stringify({
          interviewId: id, // Pass the actual interview ID
          questionId: currentQuestion.id,
          questionText: currentQuestion.text,
          userAnswer: answer,
          // You might send expectedAnswerPoints for richer evaluation if your backend uses them
          // expectedAnswerPoints: currentQuestion.expectedAnswerPoints,
          category: interviewData.category, // Pass context for AI
          difficulty: interviewData.difficulty // Pass context for AI
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
            console.error("InterviewSession: handleSubmitAnswer - API returned 401/403. Redirecting to login.");
            navigate('/login');
            return; // Stop execution here
        }
        throw new Error(errorData.message || 'Failed to get AI feedback.');
      }

      const data = await response.json();
      console.log("InterviewSession: AI Feedback received:", data);

      setAiFeedback(data.feedback); // Assuming your backend sends { feedback: "..." }

    } catch (err: any) {
      console.error("InterviewSession: Error getting AI feedback:", err);
      setFeedbackError(err.message || "An error occurred while getting AI feedback.");
    } finally {
      setIsSubmitting(false);
      // Do NOT clear answer here. User might want to see it with feedback.
    }
  };

  const handleNextQuestion = () => {
    setAiFeedback(null); // Clear feedback for next question
    setFeedbackError(null); // Clear errors for next question
    setAnswer(''); // Clear the answer input for the next question
    console.log("InterviewSession: Moving to next question.");

    if (currentQuestionIndex === interviewData.questions.length - 1) {
      console.log("InterviewSession: Last question. Calling handleEndInterview.");
      handleEndInterview();
    } else {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {interviewData.category} Interview
          </h1>
          <p className="text-sm text-gray-500">
            Difficulty: {interviewData.difficulty} • Question {currentQuestionIndex + 1}/{interviewData.totalQuestions}
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
                disabled={isSubmitting || !!aiFeedback} // Disable while submitting or if feedback is already shown
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
                  {interviewData.totalQuestions - currentQuestionIndex - 1} questions remaining
                </span>
              </div>
              <div className="flex space-x-4">
                {aiFeedback ? ( // Show Next Question button AFTER feedback is received
                  currentQuestionIndex < interviewData.questions.length - 1 ? (
                    <Button
                      onClick={handleNextQuestion}
                      rightIcon={<ArrowRight size={16} />}
                    >
                      Next Question
                    </Button>
                  ) : (
                    <Button
                      onClick={handleEndInterview}
                      rightIcon={<Send size={16} />}
                    >
                      Finish Interview
                    </Button>
                  )
                ) : ( // Show Submit Answer button BEFORE feedback is received
                  currentQuestionIndex < interviewData.questions.length ? ( // Corrected condition here
                    <Button
                      onClick={handleSubmitAnswer}
                      isLoading={isSubmitting}
                      disabled={!answer.trim()}
                      rightIcon={<ArrowRight size={16} />}
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitAnswer}
                      isLoading={isSubmitting}
                      disabled={!answer.trim()}
                      rightIcon={<Send size={16} />}
                    >
                      Submit Final Answer
                    </Button>
                  )
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