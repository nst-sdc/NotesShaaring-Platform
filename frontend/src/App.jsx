import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import HomePage from './components/HomePage';
import Navbar from './components/Navbar';
import Login from './components/Login';
import SignUp from './components/SignUp';
import NotesUploadPage from './components/NotesUploadPage';
import NotesBrowsingPage from './components/NotesBrowsingPage';
import NotesPage from "./pages/NotesPage"; 
import DoubtsPage from './pages/DoubtsPage';
import Dashboard from './pages/Dashboard';
import AuthSuccess from './components/AuthSuccess'; 
import PrivateRoute from './components/PrivateRoute';
import NoteDetailsPage from './pages/NoteDetailsPage';
import PublicRoute from './components/PublicRoute';
import DoubtDetailPage from './pages/DoubtDetailPage';
import NotesHistory from './pages/NotesHistory';
import Footer from './components/Footer';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import AdminLogin from './components/AdminLogin';
import AuthError from './components/AuthError';

function App() {
  return (
    <ThemeProvider>
      <div className="theme-transition min-h-screen flex flex-col">
        <Router>
          <div className="flex-1 flex flex-col">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/notes" element={<PrivateRoute><NotesPage /></PrivateRoute>} />
              <Route path="/history" element={<PrivateRoute><NotesHistory /></PrivateRoute>} />
              <Route path="/notes/:id" element={<PrivateRoute><NoteDetailsPage /></PrivateRoute>} />
              <Route path="/upload" element={<PrivateRoute><NotesUploadPage /></PrivateRoute>} />
              <Route path="/browse" element={<PrivateRoute><NotesBrowsingPage /></PrivateRoute>} />
              <Route path="/doubts" element={<PrivateRoute><DoubtsPage /></PrivateRoute>} />
              <Route path="/doubts/:id" element={<PrivateRoute><DoubtDetailPage /></PrivateRoute>} />
              <Route path="/auth/success" element={<AuthSuccess />} />
              <Route path="/auth-error" element={<AuthError />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin" element={<AdminLogin />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
