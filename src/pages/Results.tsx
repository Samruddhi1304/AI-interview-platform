import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Home, ArrowLeft, CheckCircle, XCircle, AlertCircle, Download, Share2 } from 'lucide-react';
import Card, { CardBody, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

// Mock data for interview results
const mockResults = {
  id: 'new-result-123',
  category: 'Web Development',
  difficulty: 'Medium',
  date: new Date().toISOString(),
  duration: '28 minutes',
  overallScore: 85,
  strengths: [
    'Clear understanding of React fundamentals',
    'Good explanation of component lifecycle',
    'Strong knowledge of hooks and their use cases'
  ],
  improvements: [
    'More depth on performance optimization techniques',
    'Specific examples would strengthen answers'
  ],
  questions: [
    {
      id: 'q1',
      text: 'Explain the difference between React props and state. When would you use one over the other?',
      userAnswer: 'Props are data passed from parent components to children and are immutable within the receiving component. State is internal data managed by the component itself and can be updated using setState or useState hook. I would use props for data that should be passed down from parents and doesn\'t change within the component, like configuration values. State is for data that changes over time based on user interactions or other events within the component.',
      feedback: 'Good explanation of the fundamental differences. You correctly identified that props are passed down and immutable while state is internal and mutable.',
      score: 90,
      keyPoints: [
        { text: 'Props are passed from parent components', met: true },
        { text: 'Props are immutable within component', met: true },
        { text: 'State is managed internally', met: true },
        { text: 'Use cases clearly differentiated', met: true }
      ]
    },
    {
      id: 'q2',
      text: 'What is the virtual DOM in React and how does it improve performance?',
      userAnswer: 'The virtual DOM is a lightweight JavaScript representation of the actual DOM. React uses it to minimize direct manipulation of the DOM which is expensive. When state changes, React first updates the virtual DOM, then compares it with the previous version (diffing), and finally only updates the real DOM with the necessary changes. This batch updating process is more efficient than directly manipulating the DOM for each small change.',
      feedback: 'Excellent explanation. You covered all the key aspects of the virtual DOM and how it contributes to React\'s performance.',
      score: 95,
      keyPoints: [
        { text: 'Described virtual DOM correctly', met: true },
        { text: 'Explained diffing process', met: true },
        { text: 'Mentioned batch updating', met: true },
        { text: 'Connected to performance benefits', met: true }
      ]
    },
    {
      id: 'q3',
      text: 'Explain how useEffect works in React and list its common use cases.',
      userAnswer: 'useEffect is a hook that handles side effects in functional components. It runs after every render by default, but you can control this by providing a dependency array. If the array is empty, it only runs once after the initial render. Common use cases include data fetching, subscriptions, manually changing the DOM, and setting up event listeners.',
      feedback: 'Your explanation is correct but could be more detailed. You didn\'t mention the cleanup function that can be returned from useEffect to handle unmounting or dependency changes.',
      score: 75,
      keyPoints: [
        { text: 'Explained timing of useEffect execution', met: true },
        { text: 'Mentioned dependency array', met: true },
        { text: 'Listed common use cases', met: true },
        { text: 'Described cleanup function', met: false }
      ]
    },
    {
      id: 'q4',
      text: 'Describe the concept of "lifting state up" in React. Why is it important?',
      userAnswer: 'Lifting state up means moving the state from child components to a common parent component. This is important because it helps maintain a single source of truth for that data and makes the data flow more predictable. It\'s especially useful when multiple components need to share and react to the same data changes.',
      feedback: 'Your answer captures the core concept well, but could benefit from a practical example to demonstrate the pattern.',
      score: 80,
      keyPoints: [
        { text: 'Correctly defined the concept', met: true },
        { text: 'Mentioned single source of truth', met: true },
        { text: 'Explained data flow benefits', met: false },
        { text: 'Provided practical use case', met: false }
      ]
    },
    {
      id: 'q5',
      text: 'What are the key differences between server-side rendering (SSR) and client-side rendering (CSR)?',
      userAnswer: 'In server-side rendering, the HTML is generated on the server and sent to the browser as a complete page. In client-side rendering, the server sends minimal HTML and JavaScript, which then renders the page in the browser. SSR provides better initial load times and SEO since search engines can see the full content. CSR offers better interactivity after the initial load and reduces server load.',
      feedback: 'Great comparison. You clearly understand the tradeoffs between these two rendering approaches.',
      score: 90,
      keyPoints: [
        { text: 'Distinguished where rendering occurs', met: true },
        { text: 'Mentioned SEO benefits of SSR', met: true },
        { text: 'Noted performance characteristics', met: true },
        { text: 'Discussed appropriate use cases', met: true }
      ]
    }
  ]
};

const Results = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [results, setResults] = useState(mockResults);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // In a real app, we would fetch the results from an API
    // For now, just use the mock data
    setResults(mockResults);

    // Initialize all questions as collapsed
    const initialExpandState: Record<string, boolean> = {};
    mockResults.questions.forEach(q => {
      initialExpandState[q.id] = false;
    });
    setExpandedQuestions(initialExpandState);
  }, [isAuthenticated, navigate, id]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-success-600';
    if (score >= 70) return 'text-warning-600';
    return 'text-error-600';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Interview Results</h1>
      </div>

      {/* Summary Card */}
      <Card className="mb-8">
        <CardHeader className="bg-primary-50">
          <h2 className="text-lg font-medium text-primary-800">Performance Summary</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Overall Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(results.overallScore)}`}>
                {results.overallScore}%
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Category</p>
              <p className="text-lg font-medium text-gray-900">{results.category}</p>
              <p className="text-sm text-gray-500">{results.difficulty} difficulty</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Duration</p>
              <p className="text-lg font-medium text-gray-900">{results.duration}</p>
              <p className="text-sm text-gray-500">{new Date(results.date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Strengths</h3>
              <ul className="space-y-2">
                {results.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle size={18} className="text-success-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Areas for Improvement</h3>
              <ul className="space-y-2">
                {results.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle size={18} className="text-warning-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardBody>
        <CardFooter className="flex justify-between bg-gray-50">
          <Button variant="outline" leftIcon={<Download size={16} />}>
            Download Report
          </Button>
          <Button variant="outline" leftIcon={<Share2 size={16} />}>
            Share Results
          </Button>
        </CardFooter>
      </Card>

      {/* Detailed Questions */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Question Details</h2>
      <div className="space-y-4">
        {results.questions.map((question) => (
          <Card key={question.id} className="overflow-hidden">
            <div 
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleQuestion(question.id)}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    question.score >= 85 ? 'bg-success-100 text-success-600' : 
                    question.score >= 70 ? 'bg-warning-100 text-warning-600' : 
                    'bg-error-100 text-error-600'
                  }`}>
                    {question.score >= 85 ? <CheckCircle size={16} /> : 
                     question.score >= 70 ? <AlertCircle size={16} /> : 
                     <XCircle size={16} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{question.text}</h3>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`font-medium ${getScoreColor(question.score)}`}>{question.score}%</span>
                <svg 
                  className={`ml-2 w-5 h-5 transform transition-transform ${expandedQuestions[question.id] ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {expandedQuestions[question.id] && (
              <div className="p-4 border-t border-gray-200">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Question</h4>
                  <p className="text-gray-900">{question.text}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Your Answer</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{question.userAnswer}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Feedback</h4>
                  <p className="text-gray-700">{question.feedback}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Key Points</h4>
                  <ul className="space-y-1">
                    {question.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        {point.met ? (
                          <CheckCircle size={16} className="text-success-500 mr-2 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle size={16} className="text-error-500 mr-2 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-gray-700">{point.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <Link to="/dashboard">
          <Button variant="outline" leftIcon={<Home size={16} />} fullWidth>
            Back to Dashboard
          </Button>
        </Link>
        <Link to="/interview/setup">
          <Button leftIcon={<ArrowLeft size={16} />} fullWidth>
            Start New Interview
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Results;