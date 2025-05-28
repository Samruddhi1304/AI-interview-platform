// frontend/src/pages/InterviewSetup.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, ListChecks, Settings, Code, Briefcase, Users, Award } from 'lucide-react';
import Card, { CardBody, CardFooter, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext'; // Import useAuth to get user info
import axios, { AxiosError } from 'axios'; // For making API calls, import AxiosError for type checking

// --- Interface Definitions ---
interface CategoryOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface DifficultyOption {
  id: string;
  name: string;
  description: string;
}

interface DurationOption {
  id: string;
  name: string;
  questions: number;
  time: number;
}

// --- Interview Options Data ---
const categoryOptions: CategoryOption[] = [
  {
    id: 'DSA',
    name: 'Data Structures & Algorithms',
    description: 'Coding problems, algorithm analysis, and optimization',
    icon: <Code size={24} />
  },
  {
    id: 'Web Development',
    name: 'Web Development',
    description: 'Frontend, backend, and full-stack development questions',
    icon: <Briefcase size={24} />
  },
  {
    id: 'HR',
    name: 'HR & Behavioral',
    description: 'Soft skills, situational, and behavioral questions',
    icon: <Users size={24} />
  },
  {
    id: 'System Design',
    name: 'System Design',
    description: 'Architecture, scalability, and design patterns',
    icon: <Award size={24} />
  }
];

const difficultyOptions: DifficultyOption[] = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Beginner-friendly questions to build confidence'
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Moderate difficulty for intermediate practice'
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'Challenging questions for experienced candidates'
  }
];

const durationOptions: DurationOption[] = [
  {
    id: 'short',
    name: 'Short',
    questions: 5,
    time: 15
  },
  {
    id: 'medium',
    name: 'Medium',
    questions: 10,
    time: 30
  },
  {
    id: 'long',
    name: 'Long',
    questions: 15,
    time: 45
  }
];

// --- InterviewSetup Component ---
const InterviewSetup = () => {
  const { isAuthenticated, user, firebaseUser } = useAuth(); // `user` is your custom AppUser, `firebaseUser` is the raw Firebase User

  const navigate = useNavigate();
  const location = useLocation();

  // Get the preselected category from location state if available
  const preselectedCategoryName = location.state?.category || categoryOptions[0].name;
  const initialCategory = categoryOptions.find(cat => cat.name === preselectedCategoryName) || categoryOptions[0];

  const [selectedCategory, setSelectedCategory] = useState<CategoryOption>(initialCategory);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyOption>(difficultyOptions[1]);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(durationOptions[1]);
  const [isLoading, setIsLoading] = useState(false); // New loading state for API call
  const [error, setError] = useState<string | null>(null); // New error state for API call

  // Note: mockInterviewDate and mockInterviewTime are used here only for record-keeping in the backend
  // when starting a new interview, not for sending an email from this page.
  const [mockInterviewDate, setMockInterviewDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [mockInterviewTime, setMockInterviewTime] = useState<string>(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })); // Default to current time

  const handleStartInterview = async () => {
    if (!firebaseUser) {
      setError("User not authenticated. Please log in.");
      console.error("InterviewSetup: Cannot start interview, Firebase user not detected. Redirecting to login.");
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setError(null); // Clear previous errors

    console.log("InterviewSetup: Attempting to start interview...");
    console.log("InterviewSetup: Current Firebase User UID:", firebaseUser.uid);
    console.log("InterviewSetup: User Email:", firebaseUser.email);
    console.log("InterviewSetup: User Display Name:", firebaseUser.displayName);
    console.log("InterviewSetup: Selected Category:", selectedCategory.name);
    console.log("InterviewSetup: Selected Difficulty:", selectedDifficulty.name);
    console.log("InterviewSetup: Selected Duration Questions:", selectedDuration.questions);

    try {
      const idToken = await firebaseUser.getIdToken();
      console.log("InterviewSetup: Firebase ID Token obtained.");

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      console.log("InterviewSetup: Backend URL:", backendUrl);

      // --- CRITICAL FIX: Call /api/schedule-interview (new endpoint) ---
      // This endpoint creates the main interview record in Firestore.
      // The email sending logic is now in the /api/schedule endpoint (used by Schedule.tsx).
      const response = await axios.post(`${backendUrl}/api/schedule-interview`, {
        userId: firebaseUser.uid,              // Firebase user ID
        category: selectedCategory.name,
        difficulty: selectedDifficulty.name,
        numQuestions: selectedDuration.questions,
        // Pass current date/time for record-keeping in the 'interviews' collection
        interviewDate: mockInterviewDate,
        interviewTime: mockInterviewTime,
        userEmail: firebaseUser.email,         // User's email from Firebase
        userName: firebaseUser.displayName || firebaseUser.email // User's name from Firebase
      }, {
        headers: {
          Authorization: `Bearer ${idToken}`, // Pass the Firebase ID token
          'Content-Type': 'application/json'
        }
      });

      const interviewId = response.data.interviewId;

      if (!interviewId) {
        throw new Error("Backend did not return an interview ID. Please verify your backend's API response.");
      }
      console.log("InterviewSetup: Backend returned interviewId:", interviewId);

      // Navigate to the interview session page with the obtained ID
      navigate(`/interview/session/${interviewId}`, {
        state: {
          category: selectedCategory.name,
          difficulty: selectedDifficulty.name,
          numQuestions: selectedDuration.questions
        }
      });
      console.log(`InterviewSetup: Navigated to /interview/session/${interviewId}`);

    } catch (err) {
      console.error("Error starting interview:", err); // Log the full error object

      // --- IMPROVED ERROR HANDLING FOR AXIOS ERRORS ---
      if (axios.isAxiosError(err)) {
        // Now 'err' is properly typed as AxiosError
        if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            if (err.response.status === 401 || err.response.status === 403) {
                setError("Authentication failed. Please log in again.");
                console.error("InterviewSetup: API returned 401/403. Redirecting to login.");
                navigate('/login'); // Redirect to login on authentication failure
            } else if (err.response.status === 404 && err.config && err.config.method === 'post' && err.config.url && err.config.url.includes('/api/interviews/create')) {
                // This specific error message helps diagnose if the frontend is still calling the old endpoint
                setError("Backend endpoint /api/interviews/create not found. Please ensure your frontend is updated to call /api/schedule-interview for starting new interviews.");
                console.error("Specific 404 for /api/interviews/create detected. This endpoint has been replaced in the backend.");
            }
            else {
                setError(err.response.data?.message || `Failed to start interview. Status: ${err.response.status}.`);
                console.error("InterviewSetup: API Error Response:", err.response.data);
            }
        } else if (err.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an http.ClientRequest in node.js
            setError("No response from server. Please check your backend server is running and accessible.");
            console.error("InterviewSetup: No response from server:", err.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            setError(`Error setting up request: ${err.message}`);
            console.error("InterviewSetup: Error setting up request:", err.message);
        }
      } else {
        // Handle non-Axios errors (e.g., from firebaseUser.getIdToken())
        setError("An unexpected error occurred. Please try again. Check console for details.");
        console.error("InterviewSetup: Non-Axios error:", err);
      }
    } finally {
      setIsLoading(false); // Always stop loading, whether successful or not
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Setup Your Interview</h1>
      </div>

      {/* Error Message Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Category Selection */}
        <Card>
          <CardHeader className="flex items-center">
            <Settings size={20} className="mr-2 text-primary-600" />
            <h2 className="text-lg font-medium text-gray-900">Select Interview Category</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryOptions.map((category) => (
                <div
                  key={category.id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${selectedCategory.id === category.id
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center mr-3
                      ${selectedCategory.id === category.id ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Difficulty Selection */}
        <Card>
          <CardHeader className="flex items-center">
            <ListChecks size={20} className="mr-2 text-primary-600" />
            <h2 className="text-lg font-medium text-gray-900">Select Difficulty Level</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {difficultyOptions.map((difficulty) => (
                <div
                  key={difficulty.id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${selectedDifficulty.id === difficulty.id
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setSelectedDifficulty(difficulty)}
                >
                  <h3 className="font-medium text-gray-900">{difficulty.name}</h3>
                  <p className="text-sm text-gray-500">{difficulty.description}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Duration Selection */}
        <Card>
          <CardHeader className="flex items-center">
            <Clock size={20} className="mr-2 text-primary-600" />
            <h2 className="text-lg font-medium text-gray-900">Select Interview Duration</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {durationOptions.map((duration) => (
                <div
                  key={duration.id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${selectedDuration.id === duration.id
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setSelectedDuration(duration)}
                >
                  <h3 className="font-medium text-gray-900">{duration.name}</h3>
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>{duration.questions} questions</span>
                    <span>~{duration.time} mins</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Summary & Start Button */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Interview Summary</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-gray-900">{selectedCategory.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Difficulty</p>
                  <p className="font-medium text-gray-900">{selectedDifficulty.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">{selectedDuration.questions} questions (~{selectedDuration.time} mins)</p>
                </div>
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartInterview}
              disabled={isLoading}
            >
              {isLoading ? 'Starting Interview...' : 'Start Interview'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default InterviewSetup;
