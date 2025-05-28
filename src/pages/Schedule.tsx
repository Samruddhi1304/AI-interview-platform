// frontend/src/pages/Schedule.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { auth } from '../services/firebase.ts';
import { PlusCircle, Calendar, Trash2 } from 'lucide-react'; // Added icons

// Define a type for a scheduled item (adjust based on your backend structure)
interface ScheduledInterview {
    id: string;
    category: string;
    scheduledDateTime: string; // ISO 8601 string, e.g., '2025-05-30T14:00:00Z'
    notes?: string;
}

const Schedule = () => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [scheduledItems, setScheduledItems] = useState<ScheduledInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addingItem, setAddingItem] = useState(false); // State for showing/hiding add form
    const [newItemCategory, setNewItemCategory] = useState('');
    const [newItemDateTime, setNewItemDateTime] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        if (!isAuthenticated && !authLoading) {
            navigate('/login');
            return;
        }

        if (isAuthenticated && !authLoading) {
            const fetchSchedule = async () => {
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

                    const response = await axios.get(`${backendUrl}/api/schedule`, { // <-- Your API endpoint for schedule
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    });
                    // Sort items by date, newest first or by closest upcoming date
                    const sortedItems = response.data.sort((a: ScheduledInterview, b: ScheduledInterview) => 
                        new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()
                    );
                    setScheduledItems(sortedItems);
                } catch (err: any) {
                    console.error('Error fetching schedule:', err);
                    if (axios.isAxiosError(err) && err.response) {
                        setError(err.response.data?.error || `Failed to load schedule. Status: ${err.response.status}`);
                    } else {
                        setError(err.message || 'Failed to load schedule.');
                    }
                } finally {
                    setLoading(false);
                }
            };

            fetchSchedule();
        }
    }, [isAuthenticated, authLoading, navigate]);

    // --- Handle New Schedule Item Submission ---
    const handleAddScheduleItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        setSubmitError(null);

        if (!newItemCategory || !newItemDateTime) {
            setSubmitError("Please fill in both category and date/time.");
            setSubmitLoading(false);
            return;
        }

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                setSubmitError('Authentication error: Please re-login.');
                setSubmitLoading(false);
                return;
            }
            const idToken = await currentUser.getIdToken();
            const backendUrl = import.meta.env.VITE_BACKEND_URL;

            const response = await axios.post(`${backendUrl}/api/schedule`, { // <-- Your API endpoint for adding schedule
                category: newItemCategory,
                scheduledDateTime: new Date(newItemDateTime).toISOString(), // Ensure ISO format for backend
            }, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            setScheduledItems(prev => [...prev, response.data].sort((a,b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()));
            setNewItemCategory('');
            setNewItemDateTime('');
            setAddingItem(false); // Hide the form after submission
        } catch (err: any) {
            console.error('Error adding schedule item:', err);
            if (axios.isAxiosError(err) && err.response) {
                setSubmitError(err.response.data?.error || `Failed to add schedule item. Status: ${err.response.status}`);
            } else {
                setSubmitError(err.message || 'Failed to add schedule item.');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    // --- Handle Delete Schedule Item ---
    const handleDeleteScheduleItem = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this scheduled interview?")) {
            return;
        }
        setSubmitLoading(true); // Reusing submitLoading for deletion
        setSubmitError(null);

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                setSubmitError('Authentication error: Please re-login.');
                setSubmitLoading(false);
                return;
            }
            const idToken = await currentUser.getIdToken();
            const backendUrl = import.meta.env.VITE_BACKEND_URL;

            await axios.delete(`${backendUrl}/api/schedule/${id}`, { // <-- Your API endpoint for deleting schedule
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            setScheduledItems(prev => prev.filter(item => item.id !== id));
        } catch (err: any) {
            console.error('Error deleting schedule item:', err);
            if (axios.isAxiosError(err) && err.response) {
                setSubmitError(err.response.data?.error || `Failed to delete schedule item. Status: ${err.response.status}`);
            } else {
                setSubmitError(err.message || 'Failed to delete schedule item.');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Interview Schedule</h1>
            <p className="text-gray-700 mb-6">
                Plan your practice interviews and stay organized.
            </p>

            <div className="mb-8 p-6 bg-white shadow rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Your Scheduled Sessions</h2>
                    <Button 
                        variant="primary" 
                        leftIcon={<PlusCircle size={16} />} 
                        onClick={() => setAddingItem(!addingItem)}
                    >
                        {addingItem ? 'Cancel Add' : 'Add New Session'}
                    </Button>
                </div>

                {addingItem && (
                    <form onSubmit={handleAddScheduleItem} className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Scheduled Interview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                    Category
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={newItemCategory}
                                    onChange={(e) => setNewItemCategory(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="DSA">Data Structures & Algorithms</option>
                                    <option value="Web Development">Web Development</option>
                                    <option value="System Design">System Design</option>
                                    <option value="HR">HR & Behavioral</option>
                                    {/* Add more categories as needed */}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700">
                                    Date and Time
                                </label>
                                <input
                                    type="datetime-local"
                                    id="dateTime"
                                    name="dateTime"
                                    value={newItemDateTime}
                                    onChange={(e) => setNewItemDateTime(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    required
                                />
                            </div>
                        </div>
                        {submitError && (
                            <p className="text-error-600 text-sm mt-3">{submitError}</p>
                        )}
                        <div className="mt-6 flex justify-end">
                            <Button
                                type="submit"
                                disabled={submitLoading}
                                leftIcon={<Calendar size={16} />}
                            >
                                {submitLoading ? 'Scheduling...' : 'Schedule Interview'}
                            </Button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">Loading your schedule...</p>
                        {/* Add a spinner here */}
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-error-600">
                        <p>Error: {error}</p>
                        <p>Please try refreshing the page or contact support.</p>
                    </div>
                ) : scheduledItems.length > 0 ? (
                    <ul className="divide-y divide-gray-200 mt-4">
                        {scheduledItems.map((item) => (
                            <li key={item.id} className="py-4 flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-lg font-medium text-gray-900">{item.category}</p>
                                    <p className="text-sm text-gray-500">
                                        <Calendar size={14} className="inline-block mr-1 -mt-0.5" />
                                        {formatDateTime(item.scheduledDateTime)}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {/* You might add an "Edit" button here */}
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleDeleteScheduleItem(item.id)}
                                        disabled={submitLoading}
                                    >
                                        <Trash2 size={16} className="text-error-500" />
                                    </Button>
                                    {/* Optional: A button to start the interview if it's close to the scheduled time */}
                                    {/* <Link to={`/interview/setup?category=${encodeURIComponent(item.category)}`}>
                                        <Button size="sm">Start</Button>
                                    </Link> */}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">
                            You don't have any interviews scheduled yet.
                        </p>
                        <Button 
                            variant="primary" 
                            leftIcon={<PlusCircle size={16} />} 
                            onClick={() => setAddingItem(true)}
                        >
                            Add Your First Session
                        </Button>
                    </div>
                )}
            </div>

            <div className="mt-8 text-center">
                <Link to="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>
        </div>
    );
};

export default Schedule;