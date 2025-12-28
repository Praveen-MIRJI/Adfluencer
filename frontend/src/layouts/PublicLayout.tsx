import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { X, Users, Megaphone, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicLayout() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

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
            <nav className="flex items-center gap-4">
              <button
                onClick={() => setShowHowItWorks(true)}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5"
              >
                How It Works
              </button>
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5">
                Login
              </Link>
              <Link
                to="/login?mode=register"
                className="group relative px-6 py-2.5 rounded-full font-bold text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:shadow-rose-500/40 hover:scale-105 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-indigo-600 transition-transform duration-300 group-hover:scale-110" />
                <span className="relative z-10 flex items-center gap-2 text-sm">Sign Up</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* How It Works Modal */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowHowItWorks(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h2 className="text-2xl font-bold text-white">How Adfluencer Works</h2>
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Early Bird Offer Banner */}
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🎉</span>
                    </div>
                    <div>
                      <h4 className="text-amber-300 font-bold">Early Bird Offer!</h4>
                      <p className="text-amber-200/80 text-sm">First few posts and bids are FREE for limited early users. Sign up now to claim your free credits!</p>
                    </div>
                  </div>
                </div>

                {/* For Clients Section */}
                <div className="bg-gradient-to-br from-rose-500/10 to-purple-500/10 border border-rose-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                      <Megaphone className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">For Clients (Brands)</h3>
                      <p className="text-slate-400 text-sm">Find the perfect influencers for your campaigns</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-rose-400 text-xs font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Post Your Campaign</h4>
                        <p className="text-slate-400 text-sm">Create an advertisement with your requirements, budget, and target audience. Each post costs ₹10 (1 post credit). <span className="text-amber-400 font-medium">Free posts available for early users!</span></p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-rose-400 text-xs font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Receive Bids from Influencers</h4>
                        <p className="text-slate-400 text-sm">Verified influencers will submit proposals with their rates and ideas for your campaign.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-rose-400 text-xs font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Select & Collaborate</h4>
                        <p className="text-slate-400 text-sm">Review profiles, ratings, and portfolios. Accept the best bid and start your collaboration!</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Benefits: Access to verified creators, transparent pricing, secure messaging</span>
                    </div>
                  </div>
                </div>

                {/* For Influencers Section */}
                <div className="bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">For Influencers (Creators)</h3>
                      <p className="text-slate-400 text-sm">Monetize your audience with brand partnerships</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-xs font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Create Your Profile</h4>
                        <p className="text-slate-400 text-sm">Showcase your social media stats, niche, portfolio, and past work to attract brands.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-xs font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Browse & Bid on Campaigns</h4>
                        <p className="text-slate-400 text-sm">Find campaigns that match your niche and submit proposals. Each bid costs ₹5 (1 bid credit). <span className="text-amber-400 font-medium">Free bids available for early users!</span></p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-xs font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Get Hired & Earn</h4>
                        <p className="text-slate-400 text-sm">When a brand accepts your bid, collaborate on the campaign and get paid for your work!</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Benefits: Direct brand connections, build your portfolio, grow your career</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Link
                    to="/login?mode=register&role=CLIENT"
                    onClick={() => setShowHowItWorks(false)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Join as Client <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login?mode=register&role=INFLUENCER"
                    onClick={() => setShowHowItWorks(false)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Join as Influencer <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
