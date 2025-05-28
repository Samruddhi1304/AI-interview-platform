import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Briefcase, Code, Users } from 'lucide-react';
import Button from '../components/ui/Button';

const Home = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="animate-slide-up">
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
                Ace Your Next Interview with AI-Powered Practice
              </h1>
              <p className="text-lg mb-8 text-primary-100">
                Practice with realistic mock interviews using our advanced AI. Get instant feedback, improve your skills, and boost your confidence.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/register">
                  <Button size="lg" variant="outline" className="border-white text-primary-700 hover:bg-white ">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-white text-primary-700 hover:bg-white ">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.pexels.com/photos/7988079/pexels-photo-7988079.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Person preparing for interview" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Practice in Multiple Categories</h2>
            <p className="mt-4 text-lg text-gray-600">
              Prepare for any type of interview with specialized AI questions and feedback
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Code size={24} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Structures & Algorithms</h3>
              <p className="text-gray-600">
                Practice solving technical coding problems with detailed explanations and optimal solutions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase size={24} className="text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Web Development</h3>
              <p className="text-gray-600">
                Answer questions about frameworks, languages, and best practices in web development.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                <Users size={24} className="text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">HR & Behavioral</h3>
              <p className="text-gray-600">
                Refine your answers to common behavioral questions and present your experiences effectively.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                <Award size={24} className="text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">System Design</h3>
              <p className="text-gray-600">
                Learn how to design scalable systems and communicate architectural decisions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">
              A simple process to help you prepare for your interviews
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex flex-col items-center text-center max-w-xs mx-auto">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose a Category</h3>
              <p className="text-gray-600">
                Select from DSA, Web Dev, HR, or System Design interviews
              </p>
            </div>

            <div className="hidden md:block w-24 h-0.5 bg-gray-200"></div>

            <div className="flex flex-col items-center text-center max-w-xs mx-auto">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Answer AI Questions</h3>
              <p className="text-gray-600">
                Respond to tailored questions from our AI interviewer
              </p>
            </div>

            <div className="hidden md:block w-24 h-0.5 bg-gray-200"></div>

            <div className="flex flex-col items-center text-center max-w-xs mx-auto">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Instant Feedback</h3>
              <p className="text-gray-600">
                Receive detailed feedback and suggestions to improve
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link to="/register">
              <Button size="lg">Start Practicing Now</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Our Users Say</h2>
            <p className="mt-4 text-lg text-gray-600">
              Join thousands who have improved their interview skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 italic mb-4">
                "InterviewAI helped me prepare for my Google interview. The AI feedback was spot on and I could practice at my own pace."
              </p>
              <div className="flex items-center">
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">Sarah L.</p>
                  <p className="text-gray-500">Software Engineer</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 italic mb-4">
                "The behavioral questions and feedback helped me improve my storytelling. I got much better at STAR method responses."
              </p>
              <div className="flex items-center">
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">Michael K.</p>
                  <p className="text-gray-500">Product Manager</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 italic mb-4">
                "As a recent graduate, I had no idea how to tackle system design interviews. This platform was a game-changer for me."
              </p>
              <div className="flex items-center">
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">Jennifer T.</p>
                  <p className="text-gray-500">Backend Developer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to ace your next interview?</h2>
            <p className="text-lg mb-8 text-primary-100 max-w-3xl mx-auto">
              Start practicing with our AI-powered mock interviews today and gain the confidence you need to succeed.
            </p>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-white text-primary-700 hover:bg-white ">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;