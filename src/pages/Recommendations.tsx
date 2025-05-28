// frontend/src/pages/Recommendations.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext'; // To get the user's auth token
import axios from 'axios'; // For making API requests
import { auth } from '../services/firebase.ts'; // For Firebase auth token

// Define a type for a single recommendation (adjust based on your backend structure)
interface Recommendation {
    id: string;
    category: string;
    area: string;
    description: string;
    // You might add more fields like 'priority', 'suggestedResources', etc.
}

const Recommendations = () => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Redirect to login if not authenticated and auth check is complete
        if (!isAuthenticated && !authLoading) {
            navigate('/login');
            return;
        }

        // Fetch data only if authenticated and auth loading is done
        if (isAuthenticated && !authLoading) {
            const fetchRecommendations = async () => {
                setLoading(true);
                setError(null);
                try {
                    const currentUser = auth.currentUser;
                    if (!currentUser || typeof currentUser.getIdToken !== 'function') {
                        console.error("Authentication error: currentUser is invalid.");
                        setError('Authentication error: Please re-login.');
                        setLoading(false);
                        return;
                    }

                    const idToken = await currentUser.getIdToken();
                    const backendUrl = import.meta.env.VITE_BACKEND_URL;

                    if (!backendUrl) {
                        console.error("VITE_BACKEND_URL is not defined in your .env file!");
                        setError("Backend URL not configured. Please check your .env file.");
                        setLoading(false);
                        return;
                    }

                    const response = await axios.get(`${backendUrl}/api/recommendations`, { // <-- Your API endpoint for recommendations
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    });
                    setRecommendations(response.data);
                } catch (err: any) {
                    console.error('Error fetching recommendations:', err);
                    if (axios.isAxiosError(err) && err.response) {
                        setError(err.response.data?.error || `Failed to load recommendations. Status: ${err.response.status}`);
                    } else {
                        setError(err.message || 'Failed to load recommendations.');
                    }
                } finally {
                    setLoading(false);
                }
            };

            fetchRecommendations();
        }
    }, [isAuthenticated, authLoading, navigate]); // Depend on isAuthenticated, authLoading, navigate

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Practice Recommendations</h1>

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">Loading recommendations...</p>
                    {/* You can add a spinner component here */}
                </div>
            ) : error ? (
                <div className="text-center py-8 text-error-600">
                    <p>Error: {error}</p>
                    <p>Please try refreshing the page or contact support.</p>
                </div>
            ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((rec) => (
                        <div key={rec.id} className="bg-white shadow-md rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{rec.area}</h3>
                            <p className="text-sm text-primary-600 mb-3">{rec.category}</p>
                            <p className="text-gray-700 text-sm">{rec.description}</p>
                            {/* You could add a button here to "Practice this" which links to interview setup */}
                            {/* <div className="mt-4">
                                <Link to={`/interview/setup?category=${encodeURIComponent(rec.area)}`}>
                                    <Button variant="ghost" size="sm">Start Practice</Button>
                                </Link>
                            </div> */}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                        No specific recommendations available yet. Start more interviews to get personalized insights!
                    </p>
                    <Link to="/interview/setup">
                        <Button>Start Your First Interview</Button>
                    </Link>
                </div>
            )}

            <div className="mt-8 text-center">
                <Link to="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>
        </div>
    );
};

export default Recommendations;