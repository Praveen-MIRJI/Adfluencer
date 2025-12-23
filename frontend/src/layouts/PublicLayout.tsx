import { Outlet, Link } from 'react-router-dom';
import { Megaphone } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">InfluenceHub</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
