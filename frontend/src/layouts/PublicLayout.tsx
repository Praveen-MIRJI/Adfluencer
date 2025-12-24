import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="fixed top-0 w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500" />
                <img src="/adfluencer-logo.png" alt="Adfluencer" className="relative w-10 h-10 object-contain" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Adfluencer</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5">
                Login
              </Link>
              <Link
                to="/login?mode=register"
                className="group relative px-6 py-2.5 rounded-full font-bold text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:shadow-rose-500/40 hover:scale-105 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-indigo-600 transition-transform duration-300 group-hover:scale-110" />
                <span className="relative z-10 flex items-center gap-2 text-sm">Get Started</span>
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
