import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <span className="text-primary-600 font-bold text-lg">InterviewAI</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Prepare for your next interview with AI assistance
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <a href="#" className="text-sm text-gray-500 hover:text-primary-600">About</a>
            <a href="#" className="text-sm text-gray-500 hover:text-primary-600">Privacy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-primary-600">Terms</a>
            <a href="#" className="text-sm text-gray-500 hover:text-primary-600">Contact</a>
          </div>
        </div>
        <div className="mt-6 border-t border-gray-100 pt-6 flex justify-center">
          <p className="text-sm text-gray-500 flex items-center">
            Made with <Heart size={14} className="mx-1 text-error-500" /> in 2025
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;