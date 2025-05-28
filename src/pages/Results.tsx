import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Home, ArrowLeft, CheckCircle, XCircle, AlertCircle, Download, Share2 } from 'lucide-react';
import Card, { CardBody, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// --- Interfaces for the fetched data structure ---
interface KeyPoint {
    text: string;
    met: boolean;
}

interface QuestionResult {
    id: string;
    text: string;
    userAnswer: string;
    feedback: string;
    score: number;
    keyPoints: KeyPoint[];
}

interface InterviewResult {
    id: string;
    category: string;
    difficulty: string;
    date: string; // ISO string
    duration: string; // e.g., "28 minutes"
    overallScore: number;
    strengths: string[];
    improvements: string[];
    questions: QuestionResult[];
}
// --- End Interfaces ---

const Results: React.FC = () => { // Specify React.FC for functional component
    const { isAuthenticated, firebaseUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    // useParams returns an object where keys are string, values are string | undefined
    const { id: interviewId } = useParams<{ id: string }>();

    // Type annotations for useState
    const [results, setResults] = useState<InterviewResult | null>(null);
    const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Redirect if not authenticated or auth is still loading
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
            return;
        }

        // Only fetch if authenticated and we have an interviewId and firebaseUser
        if (isAuthenticated && firebaseUser && interviewId) {
            const fetchResults = async () => {
                setLoading(true);
                setError(null);
                try {
                    const idToken = await firebaseUser.getIdToken();
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

                    const response = await axios.get<InterviewResult>( // Specify response type
                        `${backendUrl}/api/interviews/results/${interviewId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${idToken}`,
                            },
                        }
                    );

                    const fetchedResults = response.data;
                    setResults(fetchedResults);

                    // Initialize all questions as collapsed based on fetched data
                    const initialExpandState: Record<string, boolean> = {};
                    fetchedResults.questions.forEach(q => {
                        initialExpandState[q.id] = false;
                    });
                    setExpandedQuestions(initialExpandState);

                } catch (err: unknown) { // Use unknown for catch error type
                    console.error("Error fetching interview results:", err);
                    if (axios.isAxiosError(err) && err.response) {
                        if (err.response.status === 401 || err.response.status === 403) {
                            setError("Authentication expired or invalid. Please log in again.");
                            navigate('/login');
                        } else if (err.response.status === 404) {
                            setError("Interview results not found. It may not have completed or the ID is incorrect.");
                        } else {
                            // Access err.response.data safely, assuming it might have a message property
                            setError((err.response.data as { message?: string })?.message || "Failed to load interview results.");
                        }
                    } else if (err instanceof Error) { // Handle generic Error objects
                        setError(err.message || "An unexpected error occurred while loading results.");
                    } else { // Handle other unknown error types
                        setError("An unexpected error occurred while loading results.");
                    }
                } finally {
                    setLoading(false);
                }
            };

            fetchResults();
        } else if (!authLoading && !interviewId) {
            // Handle case where interviewId is missing from URL
            setError("No interview ID provided to view results.");
            setLoading(false);
        }
    }, [isAuthenticated, navigate, interviewId, firebaseUser, authLoading]);

    const toggleQuestion = (questionId: string) => {
        setExpandedQuestions(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const getScoreColor = (score: number): string => { // Explicit return type
        if (score >= 85) return 'text-success-600';
        if (score >= 70) return 'text-warning-600';
        return 'text-error-600';
    };

    const handleDownloadReport = async () => {
        if (!firebaseUser || !interviewId) {
            console.error("User not authenticated or interview ID missing for download.");
            setError("Cannot download report: Authentication or interview ID missing.");
            return;
        }

        try {
            setLoading(true);
            const idToken = await firebaseUser.getIdToken();
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

            const response = await axios.get(
                `${backendUrl}/api/interviews/results/${interviewId}/download`,
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                    responseType: 'blob',
                }
            );

            const contentDisposition = response.headers['content-disposition'];
            let filename = `interview_report_${interviewId}.pdf`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: unknown) {
            console.error("Error downloading report:", err);
            if (axios.isAxiosError(err) && err.response) {
                setError((err.response.data as { message?: string })?.message || "Failed to download report. Please ensure it's available.");
            } else if (err instanceof Error) {
                setError(err.message || "An unexpected error occurred during download.");
            } else {
                setError("An unexpected error occurred during download.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleShareResults = async () => {
        const shareUrl: string = window.location.href;
        const shareTitle: string = `My Interview Results: ${results?.category || 'AI Interview'} - ${results?.difficulty || 'Unknown Difficulty'}`;
        const shareText: string = results?.overallScore
            ? `Check out my interview results! Overall Score: ${results.overallScore}% in ${results.category} interview.`
            : `Check out my interview results!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                console.log('Content shared successfully');
            } catch (error: unknown) { // Use unknown for catch error type
                console.error('Error sharing content:', error);
                // Fallback to copying to clipboard
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareUrl)
                        .then(() => alert('Link copied to clipboard!'))
                        .catch(err => {
                            console.error('Could not copy text to clipboard: ', err);
                            alert('Could not share or copy link. Please try manually.');
                        });
                } else {
                    alert('Web Share API not supported and clipboard access denied/unavailable. Please copy the URL manually.');
                }
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareUrl)
                    .then(() => alert('Link copied to clipboard!'))
                    .catch(err => {
                        console.error('Could not copy text to clipboard: ', err);
                        alert('Could not copy link to clipboard. Your browser might not support this feature.');
                    });
            } else {
                alert('Your browser does not support the Web Share API or clipboard access. Please copy the URL manually.');
            }
        }
    };

    // --- Conditional Rendering for Loading/Error states ---
    if (loading || authLoading) {
        return <div className="text-center py-10 text-gray-700">Loading interview results...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-600">
                <AlertCircle size={48} className="mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Error loading results:</p>
                <p className="text-md">{error}</p>
                <Button onClick={() => navigate('/dashboard')} className="mt-6">
                    Go to Dashboard
                </Button>
            </div>
        );
    }

    // If results are null after loading and no error
    if (!results) {
        return (
            <div className="text-center py-10 text-gray-700">
                <AlertCircle size={48} className="mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No interview results found.</p>
                <p className="text-md">This could mean the interview did not complete or the ID is invalid.</p>
                <Button onClick={() => navigate('/interview/setup')} className="mt-6">
                    Start a New Interview
                </Button>
            </div>
        );
    }

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
                            <p className="text-sm text-gray-500">
                                {results.date ? new Date(results.date).toLocaleDateString() : 'N/A'}
                            </p>
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
                    <Button variant="outline" leftIcon={<Download size={16} />} onClick={handleDownloadReport}>
                        Download Report
                    </Button>
                    <Button variant="outline" leftIcon={<Share2 size={16} />} onClick={handleShareResults}>
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