import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import Navbar from './components/Navbar';
import Login from './components/Login';
import SignUp from './components/SignUp';
import NotesUploadPage from './components/NotesUploadPage';
import NotesBrowsingPage from './components/NotesBrowsingPage';
import NotesPage from "./pages/NotesPage"; 
import Dashboard from './pages/Dashboard';
import AuthSuccess from './components/AuthSuccess'; 
import PrivateRoute from './components/PrivateRoute';
import NoteDetailsPage from './pages/NoteDetailsPage';
import PublicRoute from './components/PublicRoute';
import ForgotPassword from './components/ForgotPassword';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
      <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
          <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route 
          path="/notes" 
          element={
            <PrivateRoute>
              <NotesPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/notes/:id" 
          element={
            <PrivateRoute>
              <NoteDetailsPage />
            </PrivateRoute>
          } 
        /> 
        <Route 
          path="/upload" 
          element={
            <PrivateRoute>
              <NotesUploadPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/browse" 
          element={
            <PrivateRoute>
              <NotesBrowsingPage />
            </PrivateRoute>
          } 
        />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
