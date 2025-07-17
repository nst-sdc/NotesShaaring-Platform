import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Calendar,
  AlertCircle,
  Loader,
  Send,
  X,
  Check,
  BookOpen,
  Filter
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

const subjects = [
  'DSA',
  'WAP',
  'ADA',
  'Maths',
  'Eng',
  'PSP',
  'IKS',
  'Phy',
  'General',
  'Others'
];

export default function DoubtsPage() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDoubt, setEditingDoubt] = useState(null);
  const [editingAnswer, setEditingAnswer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [sortOption, setSortOption] = useState('newest');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: ''
  });

  const [answerData, setAnswerData] = useState({});

    useEffect(() => {
    fetchDoubts();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/doubts`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Doubts API response:', data); 
        
        if (data && Array.isArray(data.doubts)) {
          setDoubts(data.doubts);
        } else if (Array.isArray(data)) {
          setDoubts(data);
        } else if (data.doubts && typeof data.doubts === 'object') {
          setDoubts(Object.values(data.doubts));
        } else {
          setDoubts([]);
        }
      } else {
        setError('Failed to load doubts');
        setDoubts([]);
      }
    } catch (error) {
      console.error('Error fetching doubts:', error);
      setError('Network error. Please try again.');
      setDoubts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.subject.trim()) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to post doubts');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/doubts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const data = await response.json();
        setDoubts(prev => [data.doubt, ...prev]);
        setFormData({ title: '', description: '', subject: '' });
        setShowForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to create doubt');
      }
    } catch (error) {
      console.error('Error creating doubt:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleAnswerSubmit = async (doubtId) => {
    if (!answerData[doubtId] || !answerData[doubtId].trim()) {
      alert('Please enter an answer');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to answer doubts');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/doubts/${doubtId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: answerData[doubtId] })
      });

      if (response.ok) {
        const newAnswer = await response.json();
        setDoubts(doubts.map(doubt => 
          doubt._id === doubtId 
            ? { ...doubt, answers: [...(doubt.answers || []), newAnswer.answer] }
            : doubt
        ));
        setAnswerData((prev) => ({ ...prev, [doubtId]: '' }));
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to create answer');
      }
    } catch (error) {
      console.error('Error creating answer:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleEditDoubt = async (doubtId) => {
    if (!editingDoubt.title.trim() || !editingDoubt.description.trim() || !editingDoubt.subject.trim()) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doubts/${doubtId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingDoubt)
      });

      if (response.ok) {
        const data = await response.json();
        setDoubts(doubts.map(doubt => 
          doubt._id === doubtId ? data.doubt : doubt
        ));
        setEditingDoubt(null);
      } else {
        alert('Failed to update doubt');
      }
    } catch (error) {
      console.error('Error updating doubt:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleEditAnswer = async (doubtId, answerId) => {
    if (!editingAnswer.text.trim()) {
      alert('Please enter an answer');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doubts/${doubtId}/answers/${answerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingAnswer)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedAnswer = data.answer;
        setDoubts(doubts.map(doubt => 
          doubt._id === doubtId 
            ? { 
                ...doubt, 
                answers: (doubt.answers || []).map(answer => 
                  answer._id === answerId ? updatedAnswer : answer
                )
              }
            : doubt
        ));
        setEditingAnswer(null);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update answer');
      }
    } catch (error) {
      console.error('Error updating answer:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteDoubt = async (doubtId) => {
    if (!confirm('Are you sure you want to delete this doubt?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doubts/${doubtId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setDoubts(doubts.filter(doubt => doubt._id !== doubtId));
      } else {
        alert('Failed to delete doubt');
      }
    } catch (error) {
      console.error('Error deleting doubt:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteAnswer = async (doubtId, answerId) => {
    if (!confirm('Are you sure you want to delete this answer?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doubts/${doubtId}/answers/${answerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setDoubts(doubts.map(doubt => 
          doubt._id === doubtId 
            ? { ...doubt, answers: (doubt.answers || []).filter(answer => answer._id !== answerId) }
            : doubt
        ));
      } else {
        alert('Failed to delete answer');
      }
    } catch (error) {
      console.error('Error deleting answer:', error);
      alert('Network error. Please try again.');
    }
  };
  const filteredDoubts = Array.isArray(doubts) ? doubts.filter(doubt => {
    const matchesSearch = (doubt.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (doubt.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || doubt.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  }) : [];
  const getSortedDoubts = () => {
    let sorted = [...filteredDoubts];
    if (sortOption === 'newest') {
      sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortOption === 'oldest') {
      sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortOption === 'mostAnswered') {
      sorted.sort((a, b) => (b.answers?.length || 0) - (a.answers?.length || 0));
    } else if (sortOption === 'leastAnswered') {
      sorted.sort((a, b) => (a.answers?.length || 0) - (b.answers?.length || 0));
    }
    return sorted;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isEdited = (createdAt, updatedAt) => {
    return new Date(updatedAt).getTime() > new Date(createdAt).getTime();
  };

  const isDoubtOwner = (doubt) => {
    if (!currentUser || !doubt.userId) return false;
    const doubtUserId = typeof doubt.userId === 'object' ? doubt.userId._id : doubt.userId;
    const currentId = currentUser.userId || currentUser._id;
    return doubtUserId?.toString() === currentId?.toString();
  };
  const isAnswerOwner = (answer) => currentUser && (answer.author?._id || answer.author)?.toString() === (currentUser.userId || currentUser._id)?.toString();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading doubts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="card-interactive p-8 text-center max-w-md animate-scale-in">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Doubts</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={fetchDoubts}
            className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover-scale btn-animated"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Study Doubts</h1>
            <p className="text-xl text-muted-foreground">Ask questions and get help from the community</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover-scale btn-animated flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ask Doubt</span>
          </button>
            </div>
        <div className="card-interactive p-6 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                    placeholder="Search doubts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 appearance-none"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject, index) => (
                    <option key={index} value={subject}>{subject}</option>
                  ))}
                </select>
            </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mb-4">
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="border rounded px-3 py-1 text-sm bg-background text-foreground"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostAnswered">Most Answered</option>
            <option value="leastAnswered">Least Answered</option>
          </select>
        </div>
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          {getSortedDoubts().length === 0 ? (
            <div className="card-interactive p-12 text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">No doubts found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || selectedSubject 
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to ask a doubt!'
                }
              </p>
              {!searchTerm && !selectedSubject && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover-scale btn-animated"
                >
                  Ask Your First Doubt
                </button>
              )}
            </div>
          ) : (
            getSortedDoubts().map((doubt, index) => (
              <div key={doubt._id} className="card-interactive p-6 animate-slide-up" style={{ animationDelay: `${600 + index * 100}ms` }}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {doubt.subject}
                      </span>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{doubt.userId?.username || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(doubt.timestamp)}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{doubt.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{doubt.description}</p>
                  </div>
                  {isDoubtOwner(doubt) && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setEditingDoubt(doubt)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 hover-scale"
                        title="Edit Doubt"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoubt(doubt._id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 hover-scale"
                        title="Delete Doubt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-foreground flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <span>{(doubt.answers || []).length} Answer{(doubt.answers || []).length !== 1 ? 's' : ''}</span>
                  </h4>
                  
                  {(doubt.answers || []).map((answer) => (
                    <div key={answer._id} className="bg-accent rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{answer.author?.username || answer.author?.name || answer.author?.email || 'Anonymous'}</span>
                          <div className="flex items-center space-x-1 text-xs text-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(answer.time)}</span>
                          </div>
                          {isEdited(answer.time, answer.updatedAt) && (
                            <span className="text-xs text-foreground italic">(edited)</span>
                          )}
                        </div>
                        {isAnswerOwner(answer) && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingAnswer({ ...answer, doubtId: doubt._id })}
                              className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteAnswer(doubt._id, answer._id)}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-foreground">{answer.text}</p>
                    </div>
                  ))}
                  <div className="mt-6">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        placeholder="Write your answer..."
                        value={answerData[doubt._id] || ''}
                        onChange={(e) => setAnswerData((prev) => ({ ...prev, [doubt._id]: e.target.value }))}
                        className="flex-1 px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      />
                      <button
                        onClick={() => handleAnswerSubmit(doubt._id)}
                        className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover-scale btn-animated flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Answer</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card-interactive p-8 w-full max-w-2xl animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Ask a Doubt</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
            </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter your question title"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Subject <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject, index) => (
                      <option key={index} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Describe your doubt in detail..."
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border-2 border-border text-foreground rounded-lg font-medium hover:bg-accent transition-all duration-200 hover-scale"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover-scale btn-animated flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Post Doubt</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {editingDoubt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card-interactive p-8 w-full max-w-2xl animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Edit Doubt</h2>
                <button
                  onClick={() => setEditingDoubt(null)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
            </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingDoubt.title}
                    onChange={(e) => setEditingDoubt({ ...editingDoubt, title: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Subject <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={editingDoubt.subject}
                    onChange={(e) => setEditingDoubt({ ...editingDoubt, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    {subjects.map((subject, index) => (
                      <option key={index} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={editingDoubt.description}
                    onChange={(e) => setEditingDoubt({ ...editingDoubt, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setEditingDoubt(null)}
                    className="px-6 py-3 border-2 border-border text-foreground rounded-lg font-medium hover:bg-accent transition-all duration-200 hover-scale"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditDoubt(editingDoubt._id)}
                    className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover-scale btn-animated flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {editingAnswer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card-interactive p-8 w-full max-w-2xl animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Edit Answer</h2>
                <button
                  onClick={() => setEditingAnswer(null)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Answer <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={editingAnswer.text}
                    onChange={(e) => setEditingAnswer({ ...editingAnswer, text: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setEditingAnswer(null)}
                    className="px-6 py-3 border-2 border-border text-foreground rounded-lg font-medium hover:bg-accent transition-all duration-200 hover-scale"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditAnswer(editingAnswer.doubtId, editingAnswer._id)}
                    className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover-scale btn-animated flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
            </div>
        </div>
    );
}