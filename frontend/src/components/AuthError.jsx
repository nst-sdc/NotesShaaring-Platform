import { useLocation, Link } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const errorMessages = {
  user_not_found: 'User does not exist. Please sign up first.',
  default: 'An authentication error occurred. Please try again.'
};

export default function AuthError() {
  const query = useQuery();
  const reason = query.get('reason');
  const message = errorMessages[reason] || errorMessages.default;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="bg-white/80 rounded-xl shadow-lg p-8 max-w-md w-full border border-red-200">
        <div className="flex flex-col items-center mb-4">
          <svg className="w-14 h-14 text-red-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#fee2e2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" />
          </svg>
          <h1 className="text-2xl font-bold text-red-600 mb-1">Authentication Error</h1>
        </div>
        <p className="mb-6 text-gray-700 text-base">{message}</p>
        <Link
          to="/signup"
          className="inline-block px-6 py-2 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold shadow hover:from-green-500 hover:to-blue-600 transition-colors duration-200"
        >
          Go to Sign Up
        </Link>
      </div>
    </div>
  );
} 