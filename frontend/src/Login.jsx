import React, { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('All fields are required.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email.');
      return;
    }

    setError('');
    console.log('Logging in:', { email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-pink-700">
      <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-xl">
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
            }}
          >
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Welcome
        </h2>
        <p className="text-sm text-center text-gray-500 mb-6">
          Login in to access your notes
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="w-full mt-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full mt-1 p-3 border rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 focus:outline-none"
              >
                {showPassword ? 'Close' : 'Open'}
              </button>
            </div>
          </div>

          <p
            className={`text-sm pl-1 min-h-[20px] transition-all duration-300 ${
              error ? 'text-red-500 opacity-100' : 'opacity-0'
            }`}
          >
            {error || ' '}
          </p>

          <button
            type="submit"
            className="w-full py-3 text-white font-semibold rounded-xl transition duration-300 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-indigo-600"
          >
            LOGIN
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Don't have an account?{' '}
          <a href="/signup" className="text-indigo-600 hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
