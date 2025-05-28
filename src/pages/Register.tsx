import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string; // <--- ADD THIS LINE
  }>({});
  
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      general?: string; // <--- ADD THIS LINE (for consistency, though not strictly needed here)
    } = {};
    let isValid = true;

    if (!name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) { // Added .trim() here too for early validation
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous form errors on new submission attempt

    if (validateForm()) {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      console.log('Attempting to register with email:', `"${trimmedEmail}"`);
      console.log('Password length:', trimmedPassword.length);

      try {
        await register(trimmedEmail, trimmedPassword);
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Registration failed at Register.tsx:', err);
        let errorMessage = 'Registration failed. Please try again.';
        if (err.code === 'auth/email-already-in-use') {
          errorMessage = 'This email is already registered. Please login or use a different email.';
        } else if (err.code === 'auth/weak-password') {
          errorMessage = 'Password should be at least 6 characters long.';
        } else if (err.code === 'auth/invalid-email') {
          errorMessage = 'The email address is invalid. Please check your spelling.';
        } else if (err.message) { // Catch any other Firebase error messages
            errorMessage = err.message;
        }
        setFormErrors(prev => ({ ...prev, general: errorMessage }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="animate-slide-up">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Register</h3>
          </CardHeader>
          <CardBody>
            {formErrors.general && (
              <div className="mb-4 p-3 bg-error-50 text-error-700 rounded-md">
                {formErrors.general}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                id="name"
                type="text"
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={formErrors.name}
                autoComplete="name"
              />

              <Input
                id="email"
                type="email"
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={formErrors.email}
                autoComplete="email"
              />

              <Input
                id="password"
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={formErrors.password}
                autoComplete="new-password"
                helperText="Must be at least 6 characters"
              />

              <Input
                id="confirmPassword"
                type="password"
                label="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={formErrors.confirmPassword}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                fullWidth
                isLoading={loading}
                leftIcon={<UserPlus size={16} />}
              >
                Create Account
              </Button>
            </form>
            
            <div className="mt-6">
              <p className="text-center text-sm text-gray-600">
                By signing up, you agree to our{' '}
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </a>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Register;