import { Upload, Download, Star, Calendar, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    username: '',
    joinDate: new Date(),
    uploadedNotes: 0,
    downloadedNotes: 0,
    reviewsReceived: 0,
    uploadedThisMonth: 0,
    downloadedThisMonth: 0,
    reviewsThisMonth: 0,
    averageRating: 0
  });

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:3000/api/auth/dashboard-stats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const { user, stats } = response.data;
        
        setUserData({
          username: user.username || user.name || 'User',
          joinDate: new Date(user.joinDate),
          uploadedNotes: stats.uploadedNotes,
          downloadedNotes: stats.downloadedNotes,
          reviewsReceived: stats.reviewsReceived,
          uploadedThisMonth: stats.uploadedThisMonth,
          downloadedThisMonth: stats.downloadedThisMonth,
          reviewsThisMonth: stats.reviewsThisMonth,
          averageRating: stats.averageRating
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.response?.data?.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Calculate join date in a readable format
  const formatJoinDate = (date) => {
    const options = { year: 'numeric', month: 'long' };
    return date.toLocaleDateString('en-US', options);
  };

  // Get time since joining
  const getTimeSinceJoining = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''}`;
  };

  // Navigation handlers
  const handleUploadNote = () => {
    navigate('/upload');
  };

  const handleBrowseNotes = () => {
    navigate('/browse');
  };

  const handleViewReviews = () => {
    navigate('/notes');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-6 py-10 font-sans text-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-purple-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-6 py-10 font-sans text-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <h3 className="font-bold mb-2">Error Loading Dashboard</h3>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-6 py-10 font-sans text-gray-800">

      {/* Profile Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 mb-10 border-t-4 border-purple-400">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Profile Icon */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {userData.username.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {userData.username} 👋</h2>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                <span>Joined {formatJoinDate(userData.joinDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                  {getTimeSinceJoining(userData.joinDate)} ago
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-10">
        {/* Uploaded Notes Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-purple-400 transition-all duration-300 hover:scale-105 hover:shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Upload className="text-purple-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Uploaded Notes</h3>
            </div>
            <span className="text-3xl font-bold text-purple-600">{userData.uploadedNotes}</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">This month</span>
              <span className="font-medium">{userData.uploadedThisMonth}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total views</span>
              <span className="font-medium">-</span>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <button className="w-full bg-purple-50 text-purple-600 py-2 px-4 rounded-lg font-medium hover:bg-purple-100 transition-colors" onClick={handleUploadNote}>
                Upload New Note
              </button>
            </div>
          </div>
        </div>

        {/* Downloaded Notes Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-pink-400 transition-all duration-300 hover:scale-105 hover:shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-100 rounded-xl">
                <Download className="text-pink-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Downloaded Notes</h3>
            </div>
            <span className="text-3xl font-bold text-pink-600">{userData.downloadedNotes}</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">This month</span>
              <span className="font-medium">{userData.downloadedThisMonth}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Favorites</span>
              <span className="font-medium">-</span>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <button className="w-full bg-pink-50 text-pink-600 py-2 px-4 rounded-lg font-medium hover:bg-pink-100 transition-colors" onClick={handleBrowseNotes}>
                Browse Notes
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Received Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-yellow-400 transition-all duration-300 hover:scale-105 hover:shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Star className="text-yellow-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Reviews Received</h3>
            </div>
            <span className="text-3xl font-bold text-yellow-600">{userData.reviewsReceived}</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Average rating</span>
              <span className="font-medium">{userData.averageRating > 0 ? `${userData.averageRating}★` : '-'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">This month</span>
              <span className="font-medium">{userData.reviewsThisMonth}</span>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <button className="w-full bg-yellow-50 text-yellow-600 py-2 px-4 rounded-lg font-medium hover:bg-yellow-100 transition-colors" onClick={handleViewReviews}>
                View Reviews
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 border-t-4 border-indigo-400">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <BookOpen className="text-indigo-600 w-6 h-6" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="text-center py-12 text-gray-500">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No recent activity</p>
          <p className="text-sm mt-2">Start uploading notes to see your activity here</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-20 text-gray-500 text-sm">
        <p>© 2025 <span className="font-semibold">NoteNest</span> • Built with 💜 by students</p>
      </footer>
    </div>
  );
}