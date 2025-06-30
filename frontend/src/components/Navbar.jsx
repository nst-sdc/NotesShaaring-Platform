import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // Listen for changes to localStorage (login/logout from other tabs)
  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Listen for login/logout in this tab
  useEffect(() => {
    const checkToken = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };
    // Custom event for login/logout
    window.addEventListener('authChange', checkToken);
    return () => window.removeEventListener('authChange', checkToken);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    // Notify other listeners
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">NoteNest</Link>
      </div>
      <div className="navbar-links">
        <Link to="/upload" className="nav-link">Upload</Link>
        <span
          className="nav-link"
          style={{ cursor: 'pointer' }}
          onClick={() => isLoggedIn ? navigate('/browse') : navigate('/login')}
        >
          Browse
        </span>
        <span
          className="nav-link"
          style={{ cursor: 'pointer' }}
          onClick={() => isLoggedIn ? navigate('/notes') : navigate('/login')}
        >
          Notes
        </span>
        {!isLoggedIn && (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Sign Up</Link>
          </>
        )}
        {isLoggedIn && (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <span
              className="nav-link"
              style={{ cursor: 'pointer' }}
              onClick={handleLogout}
            >
              Logout
            </span>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
