import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Download, 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  BookOpen, 
  AlertCircle, 
  Loader,
  ArrowLeft,
  Upload
} from 'lucide-react';
import ReviewList from '../components/Reviews/ReviewList';
import RelatedVideos from '../components/RelatedVideos';
import RelatedArticles from '../components/RelatedArticles';
import ReactModal from 'react-modal';
import BookModeViewer from './BookModeViewer';


const API_BASE_URL = 'http://localhost:3000/api';

const NoteDetailsPage = () => {
  const { id: noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  

  const fetchNote = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`);
      
      if (response.ok) {
        const data = await response.json();
        setNote(data.note);
      } else {
        setError('Note not found');
      }
    } catch (err) {
      console.error('Failed to load note:', err);
      setError('Failed to load note');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  const fetchCurrentUser = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchNote();
    fetchCurrentUser();
  }, [fetchNote, fetchCurrentUser]);

  useEffect(() => {
    if (note) {
      setEditTitle(note.title || '');
      setEditSubject(note.subject || '');
      setEditDescription(note.description || '');
      setEditFile(null);
    }
  }, [note]);

  
  useEffect(() => {
    let url = null;
    async function fetchPdfBlob() {
      if (!note || !note.fileUrl) {
        setPdfBlobUrl(null);
        return;
      }
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(note.fileUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch PDF');
        const blob = await response.blob();
        url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        setPdfBlobUrl(url);
      } catch {
        setPdfBlobUrl(null);
      }
    }
    fetchPdfBlob();
    return () => {
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [note]);

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to download notes');
        navigate('/login');
        return;
      }

      const downloadResponse = await fetch(`${API_BASE_URL}/notes/${noteId}/download`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!downloadResponse.ok) {
        if (downloadResponse.status === 401) {
          alert('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        console.warn('Failed to track download, but continuing with file download');
      }


      if (note) {
        const downloadUrl = `${API_BASE_URL}/notes/${noteId}/download-file`;
        

        const response = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        
        if (response.ok) {

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${note.title || 'note'}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          

          window.URL.revokeObjectURL(url);
        } else {
          const errorText = await response.text();
          console.error('Download failed with status:', response.status, 'Error:', errorText);
          
          if (response.status === 401) {
            alert('Your session has expired. Please log in again.');
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          
          throw new Error(`Failed to download file: ${response.status}`);
        }
      }


      fetchNote();
    } catch (error) {
      console.error('Error downloading note:', error);
      alert('Failed to download note. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to delete notes');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        navigate('/browse');
      } else {
        alert('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="card-interactive p-8 text-center max-w-md animate-scale-in">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Note Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'The note you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/browse')}
            className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover-scale btn-animated"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && note.uploadedBy && (
    (typeof note.uploadedBy === 'object' ? note.uploadedBy._id : note.uploadedBy)?.toString() === (currentUser.userId || currentUser._id)?.toString()
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/browse')}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-6 animate-slide-up"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </button>
        <div className="card-interactive p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {note.subject}
                </span>
                {note.status && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold border ${
                    note.status === 'approved' ? 'bg-green-100 text-green-700 border-green-300' :
                    note.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                    'bg-red-100 text-red-700 border-red-300'
                  }`}>
                    {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                  </span>
                )}
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>{note.uploadedBy?.username || 'Anonymous'}</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(note.createdAt)}</span>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-4">{note.title}</h1>
              
              {note.description && (
                <p className="text-muted-foreground leading-relaxed mb-6">{note.description}</p>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 hover-scale"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 hover-scale"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {note.reviewCount > 0 && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="p-2 text-yellow-600 border border-yellow-400 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-all duration-200 hover-scale font-semibold flex items-center gap-1"
                    title="Re-upload or update your note after reviews"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Re-upload Note</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-bold text-foreground">{note.downloadCount || 0}</div>
              <div className="text-xs text-foreground">Downloads</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-bold text-foreground">{note.likes || 0}</div>
              <div className="text-xs text-foreground">Likes</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-bold text-foreground">{note.reviewCount || 0}</div>
              <div className="text-xs text-foreground">Reviews</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {note.averageRating ? note.averageRating.toFixed(1) : '0.0'}
              </div>
              <div className="text-xs text-foreground">Rating</div>
            </div>
          </div>
         {note.fileUrl && (
  <div className="flex justify-center mb-8 gap-4 flex-wrap">
    <button
      onClick={handleDownload}
      className="bg-gradient-primary text-white px-8 py-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover-scale btn-animated flex items-center space-x-2"
    >
      <Download className="w-5 h-5" />
      <span>Download Note</span>
    </button>

    <button
      onClick={async () => {
        const token = localStorage.getItem('token');
        try {
          const response = await fetch(note.fileUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Failed to fetch PDF');
          const blob = await response.blob();
          const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(
              `<iframe src="${url}" frameborder="0" style="width:100vw;height:100vh;" allowfullscreen></iframe>`
            );
          } else {
            alert('Please allow popups for this site');
          }
          setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        } catch {
          alert('Could not open PDF.');
        }
      }}
      className="border-2 border-primary text-primary px-8 py-4 rounded-lg font-medium hover:bg-primary/10 transition-all duration-200 hover-scale flex items-center space-x-2"
    >
      <BookOpen className="w-5 h-5" />
      <span>View Note</span>
    </button>

    <button
  onClick={() => setShowViewer(true)}
  className="border-2 border-primary text-primary px-8 py-4 rounded-lg font-medium hover:bg-primary/10 transition-all duration-200 hover-scale flex items-center space-x-2">
  <BookOpen className="w-5 h-5" />
  <span>Book Mode</span>
  </button>

  </div>
)}
          {note.fileUrl && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">File Information</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {note.title || 'Untitled Note'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Downloads: {note.downloadCount || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-accent-light/20 dark:bg-accent/30 rounded-lg border border-accent/30 dark:border-accent/50">
                <p className="text-sm text-accent dark:text-accent-light">
                  💡 <strong>Tip:</strong> Click the download or view button above to save or view this file on your device.
                </p>
              </div>
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⚠️ <strong>Note:</strong> Some older files may not be immediately accessible. If download fails, please try again later or contact the uploader.
                </p>
              </div>
              <div className="mt-6 w-full flex justify-center">
                {pdfBlobUrl ? (
                  <iframe
                    src={pdfBlobUrl}
                    title="PDF Viewer"
                    width="100%"
                    height="600px"
                    style={{ border: 'none', borderRadius: '8px', background: '#fff' }}
                    allow="autoplay"
                  />
                ) : (
                  <div className="w-full h-[600px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground">PDF preview unavailable</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="mt-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <ReviewList noteId={noteId} currentUserId={currentUser?.userId} />
        </div>
        <div className="mt-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <RelatedVideos noteId={noteId} />
        </div>
        <div className="mt-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <RelatedArticles noteId={noteId} />
        </div>
        <ReactModal
          isOpen={showEditModal}
          onRequestClose={() => setShowEditModal(false)}
          className="bg-card p-8 rounded-xl shadow-xl w-full max-w-md mx-auto mt-24 animate-scale-in max-h-[90vh] overflow-y-auto outline-none"
          overlayClassName="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          ariaHideApp={false}
        >
          <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2 pr-8">
            <Edit className="w-5 h-5 text-primary" /> Edit Note
          </h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setEditLoading(true);
              setEditError('');
              try {
                const token = localStorage.getItem('token');
                const formData = new FormData();
                formData.append('title', editTitle);
                formData.append('subject', editSubject);
                formData.append('description', editDescription);
                if (editFile) {
                  formData.append('file', editFile);
                }
                const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  body: formData,
                });
                if (response.ok) {
                  setShowEditModal(false);
                  fetchNote();
                } else {
                  let errorMsg = `Error: ${response.status}`;
                  try {
                    const data = await response.json();
                    errorMsg = data.message || errorMsg;
                  } catch {
                    // Not JSON
                  }
                  setEditError(errorMsg);
                }
              } catch (err) {
                setEditError('Network error: ' + (err?.message || 'Please try again.'));
              } finally {
                setEditLoading(false);
              }
            }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                required
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
              <input
                type="text"
                value={editSubject}
                onChange={e => setEditSubject(e.target.value)}
                required
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={4}
                required
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Replace File (optional)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={e => setEditFile(e.target.files[0])}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
              {editFile && (
                <p className="text-xs text-muted-foreground mt-1">Selected: {editFile.name}</p>
              )}
            </div>
            {editError && (
              <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-destructive text-sm">{editError}</p>
              </div>
            )}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border-2 border-border text-foreground rounded-lg font-medium hover:bg-accent transition-all duration-200 hover-scale"
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="bg-gradient-primary text-white px-8 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover-scale btn-animated disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {editLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Edit className="w-5 h-5" />}
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
              
            </div>
          </form>
        </ReactModal>
 {showViewer && currentUser && note && pdfBlobUrl && (
  <BookModeViewer
    fileUrl={pdfBlobUrl}
    userId={currentUser._id || currentUser.userId}
    noteId={note._id}
    onClose={() => setShowViewer(false)}
  />
)}

      </div>
    </div>
  );
};

export default NoteDetailsPage;