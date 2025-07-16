import React, { useEffect, useState } from 'react';
import { Star, MessageCircle, AlertCircle, Edit, Trash2, User, Calendar } from 'lucide-react';
import ReviewForm from './ReviewForm';
const API_BASE_URL = 'http://localhost:3000/api';
const ReviewList = ({ noteId, currentUserId }) => {
const [reviews, setReviews] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [editing, setEditing] = useState(null);
const fetchReviews = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/reviews/${noteId}/reviews`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  const handleDelete = async () => {
    if (!window.confirm('Delete your review?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to delete reviews');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/reviews/${noteId}/reviews`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setEditing(null);
        fetchReviews();
      } else {
        alert('Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);
  console.log('ReviewList - currentUserId:', currentUserId);
  console.log('ReviewList - reviews:', reviews);
  console.log('ReviewList - currentUserReview:', reviews.find(r => r.user?._id === currentUserId));

  const currentUserReview = reviews.find(r => r.user?._id === currentUserId);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (

    <div className="mt-8 animate-slide-up">
    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center space-x-2">
    <MessageCircle className="w-5 h-5 text-primary" />
    <span>Reviews</span>
    </h3>

    <div className="text-center py-8">
    <div className="loading mx-auto mb-4"></div>
    <p className="text-muted-foreground">Loading reviews...</p>
    </div>

    </div>
    );
  }

  return (
    
    <div className="mt-8 animate-slide-up">
    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center space-x-2">
    <MessageCircle className="w-5 h-5 text-primary" />
    <span>Reviews</span>
    </h3>
    {error && (
    <div className="flex items-center space-x-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
    <p className="text-destructive text-sm">{error}</p>
    </div>
    )}
    {currentUserId ? (
    <div className="card-interactive p-6 mb-6">
    {editing && (
    <p className="mb-4 font-medium text-foreground">Update Your Review</p>
    )}
    {!currentUserReview && !editing && (
    <p className="mb-4 font-medium text-foreground">Add a Review</p>
       )}
    {(!currentUserReview || editing) ? (
    <ReviewForm
    noteId={noteId}
    existingReview={editing || null}
    refreshReviews={() => { fetchReviews(); setEditing(null); }}
    />
    ) : (
        <div className="bg-accent rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{currentUserReview.user?.username || 'Anonymous'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {renderStars(currentUserReview.rating || 0)}
                </div>
              </div>
              <p className="text-foreground mb-3">{currentUserReview.comment}</p>
              <div className="flex items-center justify-between text-xs text-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(currentUserReview.createdAt)}</span>
                  {currentUserReview.updatedAt && currentUserReview.updatedAt !== currentUserReview.createdAt && (
                    <span className="italic">(edited)</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditing(currentUserReview)}
                    className="bg-white border border-green-600 text-green-700 font-semibold px-3 py-1 rounded hover:bg-green-600 hover:text-white transition-colors flex items-center space-x-1 shadow"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive/80 transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card-interactive p-6 mb-6 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Please login to leave a review.</p>
        </div>
      )}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="card-interactive p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reviews yet.</p>
          </div>
        ) : (
          reviews
            .filter(r => r.user?._id !== currentUserId)
            .map((review) => (
              <div key={review._id} className="card-interactive p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{review.user?.username || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating || 0)}
                  </div>
                </div>
                <p className="text-foreground mb-3">{review.comment}</p>
                <div className="flex items-center space-x-1 text-xs text-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(review.createdAt)}</span>
                  {review.updatedAt && review.updatedAt !== review.createdAt && (
                    <span className="italic">(edited)</span>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ReviewList;
