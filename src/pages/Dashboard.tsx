// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, History, Settings, BarChart2, Clock, Medal, Bookmark, Code, Briefcase, Users } from 'lucide-react';
import Card, { CardBody, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { auth } from '../services/firebase.ts';

// Define a type for a single interview record
interface InterviewRecord {
    id: string;
    category: string;
    date: string; // ISO 8601 string, e.g., '2025-04-15T10:30:00Z'
    score: number | 'N/A'; // Backend sends 'N/A' for incomplete, number for completed
    questions: number; // Number of questions in the interview
    status: 'active' | 'completed' | 'cancelled' | 'unknown'; // Added 'cancelled' for completeness
    duration?: string;
}

// Define a type for a single recommendation
interface Recommendation {
    id: string;
    category: string;
    area: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

const Dashboard = () => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [pastInterviews, setPastInterviews] = useState<InterviewRecord[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]); // New state for recommendations
    const [stats, setStats] = useState({
        totalInterviews: 0,
        averageScore: 0,
        totalTime: 0,
        bestCategory: '',
    });
    const [dataLoading, setDataLoading] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated && !authLoading) {
            navigate('/login');
            return;
        }

        if (isAuthenticated && !authLoading) {
            const fetchData = async () => { // Renamed to fetchData as it handles multiple fetches
                setDataLoading(true);
                setDataError(null);

                try {
                    const currentUser = auth.currentUser;

                    if (!currentUser || typeof currentUser.getIdToken !== 'function') {
                        console.error("Critical: auth.currentUser is invalid or missing getIdToken. User object:", currentUser);
                        setDataError('Authentication error: User session invalid. Please re-login.');
                        setDataLoading(false);
                        return;
                    }

                    const idToken = await currentUser.getIdToken();
                    const backendUrl = import.meta.env.VITE_BACKEND_URL;

                    if (!backendUrl) {
                        console.error("VITE_BACKEND_URL is not defined in your .env file!");
                        setDataError("Backend URL not configured. Please check your .env file.");
                        setDataLoading(false);
                        return;
                    }

                    // --- Fetch Past Interviews ---
                    const interviewsResponse = await axios.get<InterviewRecord[]>(`${backendUrl}/api/user/interviews`, {
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    });
                    const fetchedInterviews: InterviewRecord[] = interviewsResponse.data;

                    // Filter only completed interviews for stats calculation
                    const completedInterviews = fetchedInterviews.filter(
                        (interview) =>
                            interview.status === 'completed' &&
                            typeof interview.score === 'number' &&
                            interview.score !== null
                    );

                    const total = fetchedInterviews.length;

                    // Calculate Average Score
                    const avgScore =
                        completedInterviews.length > 0
                            ? Math.round(
                                  completedInterviews.reduce((acc, interview) => acc + (interview.score as number), 0) /
                                  completedInterviews.length
                              )
                            : 0;

                    // Calculate Total Time
                    const totalTimeMinutes = completedInterviews.reduce((sum, interview) => {
                        if (interview.duration) {
                            const match = interview.duration.match(/\d+/);
                            if (match) {
                                return sum + parseInt(match[0], 10);
                            }
                        }
                        return sum + (interview.questions === 10 ? 30 : 15); // Fallback for duration
                    }, 0);

                    // Determine Best Category
                    const categoryScores: { [key: string]: { total: number; count: number } } = {};
                    completedInterviews.forEach((interview) => {
                        const score = interview.score as number;
                        if (categoryScores[interview.category]) {
                            categoryScores[interview.category].total += score;
                            categoryScores[interview.category].count += 1;
                        } else {
                            categoryScores[interview.category] = { total: score, count: 1 };
                        }
                    });

                    let bestCategory = 'N/A';
                    let highestAvgScore = -1;

                    for (const category in categoryScores) {
                        const avg = categoryScores[category].total / categoryScores[category].count;
                        if (avg > highestAvgScore) {
                            highestAvgScore = avg;
                            bestCategory = category;
                        }
                    }

                    setPastInterviews(fetchedInterviews);
                    setStats({
                        totalInterviews: total,
                        averageScore: avgScore,
                        totalTime: totalTimeMinutes,
                        bestCategory: bestCategory,
                    });

                    // --- Fetch Recommendations ---
                    const recommendationsResponse = await axios.get<Recommendation[]>(`${backendUrl}/api/recommendations`, {
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    });
                    setRecommendations(recommendationsResponse.data);

                } catch (err: any) {
                    console.error('Error fetching dashboard data:', err);
                    if (axios.isAxiosError(err) && err.response) {
                        console.error('Backend response error data:', err.response.data);
                        console.error('Backend response status:', err.response.status);
                        setDataError(err.response.data?.error || `Failed to load dashboard data. Status: ${err.response.status}`);
                    } else {
                        setDataError(err.message || 'Failed to load dashboard data.');
                    }
                } finally {
                    setDataLoading(false);
                }
            };

            fetchData();
        }
    }, [isAuthenticated, authLoading, navigate]);

    const renderScoreColor = (score: number | 'N/A') => {
        if (typeof score !== 'number') return 'text-gray-500';
        if (score >= 85) return 'text-success-600';
        if (score >= 70) return 'text-warning-600';
        return 'text-error-600';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Welcome back, {user?.name || user?.email || 'Guest'}
                    </p>
                </div>
                <div className="mt-4 md:mt-0">
                    <Link to="/interview/setup">
                        <Button leftIcon={<Play size={16} />}>
                            Start New Interview
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-primary-50 border border-primary-100">
                    <CardBody className="flex items-center p-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                            <History size={24} className="text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-primary-600">Total Interviews</p>
                            <p className="text-2xl font-bold text-primary-800">{stats.totalInterviews}</p>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-secondary-50 border border-secondary-100">
                    <CardBody className="flex items-center p-4">
                        <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mr-4">
                            <Medal size={24} className="text-secondary-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-secondary-600">Average Score</p>
                            <p className="text-2xl font-bold text-secondary-800">{stats.averageScore}%</p>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-accent-50 border border-accent-100">
                    <CardBody className="flex items-center p-4">
                        <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mr-4">
                            <Clock size={24} className="text-accent-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-accent-600">Total Time</p>
                            <p className="text-2xl font-bold text-accent-800">{stats.totalTime} mins</p>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-success-50 border border-success-100">
                    <CardBody className="flex items-center p-4">
                        <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mr-4">
                            <BarChart2 size={24} className="text-success-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-success-600">Best Category</p>
                            <p className="text-2xl font-bold text-success-800">{stats.bestCategory || 'N/A'}</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Interviews</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    {dataLoading ? (
                        <div className="py-8 text-center text-gray-500">Loading interviews...</div>
                    ) : dataError ? (
                        <div className="py-8 text-center text-red-500">{dataError}</div>
                    ) : pastInterviews.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {pastInterviews.map((interview) => (
                                <li key={interview.id}>
                                    {/* Conditional rendering of Link/action based on interview status */}
                                    {interview.status === 'completed' ? (
                                        <Link to={`/results/${interview.id}`} className="block hover:bg-gray-50">
                                            <div className="px-4 py-4 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                                <span className="text-primary-600 font-medium">{interview.category.substring(0, 2)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <p className="text-sm font-medium text-gray-900">{interview.category}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {new Date(interview.date).toLocaleDateString()} • {interview.questions} questions
                                                                {interview.status === 'completed' && interview.duration && ` • ${interview.duration}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 ${renderScoreColor(interview.score)}`}>
                                                            {typeof interview.score === 'number' ? `${interview.score}%` : interview.score}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        // For 'active' or 'cancelled' interviews, provide a different action or no action
                                        <div className="block px-4 py-4 sm:px-6 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                            <span className="text-primary-600 font-medium">{interview.category.substring(0, 2)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-medium text-gray-900">{interview.category}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(interview.date).toLocaleDateString()} • {interview.questions} questions
                                                           {` • Status: ${interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500`}>
                                                        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                                                    </span>
                                                    {interview.status === 'active' && (
                                                        // THIS IS THE CORRECTED LINE:
                                                        <Link to={`/interview/session/${interview.id}`} className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                                                            Resume
                                                        </Link>
                                                    )}
                                                    {/* Optional: Add a Cancel button for active interviews */}
                                                    {interview.status === 'active' && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation(); // Prevent Link navigation
                                                                try {
                                                                    const idToken = await auth.currentUser?.getIdToken();
                                                                    await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/interviews/${interview.id}/cancel`, {}, {
                                                                        headers: { Authorization: `Bearer ${idToken}` },
                                                                    });
                                                                    // Refresh interviews after cancellation or update status locally
                                                                    setPastInterviews(prev => prev.map(item => item.id === interview.id ? { ...item, status: 'cancelled' } : item));
                                                                    alert('Interview cancelled successfully!');
                                                                } catch (error) {
                                                                    console.error('Failed to cancel interview:', error);
                                                                    alert('Failed to cancel interview.');
                                                                }
                                                            }}
                                                            className="text-error-600 hover:text-error-800 text-sm font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-gray-500">No interviews yet</p>
                            <div className="mt-4">
                                <Link to="/interview/setup">
                                    <Button variant="outline" size="sm">Start your first interview</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-medium text-gray-900">Practice Recommendations</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-sm text-gray-600 mb-4">
                            Based on your past performance, we recommend focusing on these areas:
                        </p>
                        {dataLoading ? (
                            <div className="text-center text-gray-500 text-sm">Loading recommendations...</div>
                        ) : dataError ? (
                            <div className="text-center text-red-500 text-sm">Error loading recommendations.</div>
                        ) : recommendations.length > 0 ? (
                            <ul className="space-y-2">
                                {recommendations.map((rec) => (
                                    <li key={rec.id} className="flex items-center text-sm">
                                        <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                                        {rec.category} - {rec.area}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-gray-500 text-sm">
                                Complete an interview to get personalized recommendations!
                            </div>
                        )}
                    </CardBody>
                    <CardFooter>
                        <Link to="/recommendations">
                            <Button variant="outline" fullWidth leftIcon={<Bookmark size={16} />}>
                                View All Recommendations
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-medium text-gray-900">Interview Schedule</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-sm text-gray-600 mb-4">
                            Create a practice schedule to stay on track:
                        </p>
                        {/* The schedule section is still static here.
                            To make it dynamic, you'd need to fetch from /api/schedule
                            and display the actual scheduled items. For now, it remains
                            as placeholder text, but the /schedule route is active.
                        */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span>DSA Interview</span>
                                <span className="text-primary-600">Daily</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>System Design</span>
                                <span className="text-primary-600">Weekly</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>HR Interview</span>
                                <span className="text-primary-600">Bi-weekly</span>
                            </div>
                        </div>
                    </CardBody>
                    <CardFooter>
                        <Link to="/schedule">
                            <Button variant="outline" fullWidth leftIcon={<Settings size={16} />}>
                                Customize Schedule
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-medium text-gray-900">Quick Start</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-sm text-gray-600 mb-4">
                            Jump right into an interview session:
                        </p>
                        <div className="space-y-3">
                            <Link to="/interview/setup" state={{ category: 'DSA' }}>
                                <Button variant="outline" fullWidth size="sm" className="justify-start">
                                    <Code size={16} className="mr-2" /> Data Structures & Algorithms
                                </Button>
                            </Link>
                            <Link to="/interview/setup" state={{ category: 'Web Development' }}>
                                <Button variant="outline" fullWidth size="sm" className="justify-start">
                                    <Briefcase size={16} className="mr-2" /> Web Development
                                </Button>
                            </Link>
                            <Link to="/interview/setup" state={{ category: 'HR' }}>
                                <Button variant="outline" fullWidth size="sm" className="justify-start">
                                    <Users size={16} className="mr-2" /> HR & Behavioral
                                </Button>
                            </Link>
                        </div>
                    </CardBody>
                    <CardFooter>
                        <Link to="/interview/setup">
                            <Button fullWidth leftIcon={<Play size={16} />}>
                                Custom Interview
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;