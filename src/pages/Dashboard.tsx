import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, History, Settings, BarChart2, Clock, Medal, Bookmark } from 'lucide-react';
import Card, { CardBody, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

// Mock data for past interviews
const mockPastInterviews = [
  {
    id: '1',
    category: 'DSA',
    date: '2025-04-15',
    score: 85,
    questions: 8,
  },
  {
    id: '2',
    category: 'Web Development',
    date: '2025-04-10',
    score: 72,
    questions: 10,
  },
  {
    id: '3',
    category: 'HR',
    date: '2025-04-05',
    score: 90,
    questions: 6,
  }
];

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pastInterviews, setPastInterviews] = useState(mockPastInterviews);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    totalTime: 0,
    bestCategory: '',
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Mock loading data
    setPastInterviews(mockPastInterviews);
    setStats({
      totalInterviews: mockPastInterviews.length,
      averageScore: Math.round(mockPastInterviews.reduce((acc, interview) => acc + interview.score, 0) / mockPastInterviews.length),
      totalTime: 205, // minutes
      bestCategory: 'HR',
    });
  }, [isAuthenticated, navigate]);

  const renderScoreColor = (score: number) => {
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
            Welcome back, {user?.name}
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

      {/* Stats Overview */}
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
              <p className="text-2xl font-bold text-success-800">{stats.bestCategory}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Interviews */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Interviews</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {pastInterviews.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {pastInterviews.map((interview) => (
                <li key={interview.id}>
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
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 ${renderScoreColor(interview.score)}`}>
                            {interview.score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Practice Recommendations</h3>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-600 mb-4">
              Based on your past performance, we recommend focusing on these areas:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm">
                <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                Web Development - React Hooks and State Management
              </li>
              <li className="flex items-center text-sm">
                <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                DSA - Dynamic Programming Problems
              </li>
              <li className="flex items-center text-sm">
                <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                System Design - Scalability Concepts
              </li>
            </ul>
          </CardBody>
          <CardFooter>
            <Button variant="outline" fullWidth leftIcon={<Bookmark size={16} />}>
              View All Recommendations
            </Button>
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
            <Button variant="outline" fullWidth leftIcon={<Settings size={16} />}>
              Customize Schedule
            </Button>
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