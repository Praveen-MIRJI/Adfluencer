import React from 'react';
import { motion } from 'framer-motion';
import { Image, CheckCircle, Clock, Star, Award, Users, TrendingUp } from 'lucide-react';

const Portfolio: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        {/* Main Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-600/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header Section */}
          <div className="relative p-8 md:p-12 text-center">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-pink-600/10"></div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative inline-flex items-center justify-center w-24 h-24 mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-purple-500 to-blue-600 rounded-full p-6">
                <Image className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              Portfolio
            </motion.h1>

            {/* Coming Soon Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full mb-6"
            >
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-semibold text-yellow-400">Coming Soon</span>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
            >
              We're building a powerful portfolio showcase to help you display your best work and attract more clients.
              Stay tuned for this exciting feature!
            </motion.p>
          </div>

          {/* Features Grid */}
          <div className="p-8 md:p-12 bg-slate-900/30">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">What to Expect</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Image className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Media Showcase</h4>
                <p className="text-sm text-slate-400">
                  Upload and display your best work with images, videos, and case studies
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Performance Metrics</h4>
                <p className="text-sm text-slate-400">
                  Showcase your reach, engagement rates, and campaign success stories
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-6 hover:border-pink-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-pink-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Achievements</h4>
                <p className="text-sm text-slate-400">
                  Highlight your awards, certifications, and notable collaborations
                </p>
              </motion.div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="p-8 md:p-12 border-t border-slate-600/50">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">Benefits of Portfolio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {[
                'Showcase your best work professionally',
                'Attract more high-value clients',
                'Build credibility and trust',
                'Stand out from other influencers',
                'Increase your bid acceptance rate',
                'Track your growth over time'
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-900/50 border-t border-slate-600/50 text-center">
            <div className="flex items-center justify-center space-x-2 text-slate-400">
              <Star className="w-4 h-4" />
              <span className="text-sm">Build your professional portfolio to win more campaigns</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-center"
        >
          <p className="text-slate-400 text-sm">
            Have suggestions for portfolio features? Contact us at{' '}
            <a href="mailto:support@adfluencer.com" className="text-blue-400 hover:text-blue-300 transition-colors">
              support@adfluencer.com
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Portfolio;
