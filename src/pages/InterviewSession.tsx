import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, AlertCircle, ArrowRight, Send } from 'lucide-react';
import Card, { CardBody, CardFooter, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import TextArea from '../components/ui/TextArea';
import { useAuth } from '../context/AuthContext';

// Mock data for a sample interview
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
        'Use props for data that doesn't change, state for data that changes over time'
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
    {
      id: 'q3',
      text: 'Explain how useEffect works in React and list its common use cases.',
      expectedAnswerPoints: [
        'useEffect runs after render and on dependency changes',
        'Can handle side effects like data fetching, subscriptions',
        'Clean-up function can be returned to handle unmounting',
        'Empty dependency array makes it run only once (like componentDidMount)'
      ]
    },
    {
      id: 'q4',
      text: 'Describe the concept of "lifting state up" in React. Why is it important?',
      expectedAnswerPoints: [
        'Moving shared state to closest common ancestor component',
        'Helps maintain single source of truth',
        'Makes data flow predictable (top-down)',
        'Avoids prop drilling and component coupling'
      ]
    },
    {
      id: 'q5',
      text: 'What are the key differences between server-side rendering (SSR) and client-side rendering (CSR)?',
      expectedAnswerPoints: [
        'SSR generates HTML on server, CSR in browser',
        'SSR provides better initial load and SEO',
        'CSR offers better interactivity after initial load',
        'SSR reduces client-side JavaScript burden'
      ]
    },
    {
      id: 'q6',
      text: 'Explain how React's Context API works and when you should use it instead of prop drilling.',
      expectedAnswerPoints: [
        'Context provides a way to share values without explicitly passing props',
        'Uses Provider to supply value and Consumer to use it',
        'Useful for global themes, user data, localization',
        'Better than prop drilling for deeply nested components'
      ]
    },
    {
      id: 'q7',
      text: 'What are React hooks? Name and explain three built-in hooks and their use cases.',
      expectedAnswerPoints: [
        'Hooks let you use state and other React features without classes',
        'useState: manage local component state',
        'useEffect: handle side effects, lifecycle events',
        'useContext: consume context values without Consumer component'
      ]
    },
    {
      id: 'q8',
      text: 'Describe how you would implement authentication in a React application.',
      expectedAnswerPoints: [
        'Store auth tokens (JWT) in secure storage',
        'Create protected routes with conditional rendering',
        'Use context or state management for global auth state',
        'Include auth headers in API requests'
      ]
    },
    {
      id: 'q9',
      text: 'What are the best practices for managing forms in React?',
      expectedAnswerPoints: [
        'Controlled components with state',
        'Form libraries like Formik or React Hook Form for complex forms',
        'Input validation and error handling',
        'Accessibility considerations for form elements'
      ]
    },
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
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [interviewData, setInterviewData] = useState(mockInterviewData);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(interviewData.timeRemaining);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTimeWarning, setIsTimeWarning] = useState(false);

  const currentQuestion = interviewData.questions[currentQuestionIndex];

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Set up timer
    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          handleEndInterview();
          return 0;
        }
        
        // Set warning when less than 5 minutes remain
        if (prevTime <= 300 && !isTimeWarning) {
          setIsTimeWarning(true);
        }
        
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, navigate, isTimeWarning]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmitAnswer = () => {
    setIsSubmitting(true);
    
    // Save the current answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));

    // Simulate API call for AI evaluation
    setTimeout(() => {
      setIsSubmitting(false);
      setAnswer('');
      
      // If this was the last question, end the interview
      if (currentQuestionIndex === interviewData.questions.length - 1) {
        handleEndInterview();
      } else {
        // Otherwise, move to the next question
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      }
    }, 1500);
  };

  const handleEndInterview = () => {
    // In a real app, we would send all answers to the backend for final evaluation
    // and then redirect to the results page
    navigate(`/results/new-result-123`);
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
                {currentQuestionIndex < interviewData.questions.length - 1 ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    isLoading={isSubmitting}
                    disabled={!answer.trim()}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Next Question
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