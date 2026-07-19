import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="fixed top-0 inset-x-0 z-30 flex justify-center px-4 pt-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-gray-950/70 backdrop-blur-xl shadow-lift pl-5 pr-1.5 py-1.5">
        <Link to="/" className="text-sm font-bold tracking-tight text-white mr-2">
          Task<span className="text-primary-400">Flow</span>
        </Link>
        <span className="hidden sm:block text-xs text-gray-500 mr-2 max-w-[10rem] truncate">{user?.name}</span>
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors duration-500 ease-fluid"
          >
            Admin
          </Link>
        )}
        <Link
          to="/settings"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors duration-500 ease-fluid"
        >
          Settings
        </Link>
        <button
          onClick={logout}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors duration-500 ease-fluid active:scale-[0.98]"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
