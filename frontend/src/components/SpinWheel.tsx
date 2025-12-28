import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../lib/api';

interface SpinWheelProps {
  isOpen: boolean;
  onClose: (credits: number) => void;
  userRole: 'CLIENT' | 'INFLUENCER';
}

const WHEEL_SEGMENTS = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]; // 10 segments
const SEGMENT_COLORS = [
  '#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
  '#ec4899', '#6366f1', '#0ea5e9', '#22c55e', '#eab308'
];

export default function SpinWheel({ isOpen, onClose, userRole }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [wonCredits, setWonCredits] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const hasStartedSpin = useRef(false);

  // Generate random credits (1-5) and calculate rotation
  const spinWheel = () => {
    if (isSpinning || hasSpun || hasStartedSpin.current) return;
    
    hasStartedSpin.current = true;
    setIsSpinning(true);
    
    // Generate random credits (1-5)
    const credits = Math.floor(Math.random() * 5) + 1;
    setWonCredits(credits);
    
    // Find the index of the segment with our target value
    const targetIndex = WHEEL_SEGMENTS.indexOf(credits);
    // Each segment is 36 degrees (360/10)
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    // Calculate base rotation to land on target segment
    // Add extra rotations for effect (5 full spins)
    const baseRotation = 360 * 5;
    // Offset to center on segment
    const targetRotation = baseRotation + (360 - (targetIndex * segmentAngle) - segmentAngle / 2);
    
    setRotation(targetRotation);

    // Show result after spin completes
    setTimeout(() => {
      setIsSpinning(false);
      setHasSpun(true);
      setShowResult(true);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 4000);
  };

  // Auto-spin when modal opens
  useEffect(() => {
    if (isOpen && !hasSpun && !hasStartedSpin.current) {
      const timer = setTimeout(() => {
        spinWheel();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hasSpun]);

  // Claim credits via API
  const handleClaim = async () => {
    if (claiming) return;
    
    setClaiming(true);
    try {
      await api.post('/credits/claim-spin-wheel', { credits: wonCredits });
      onClose(wonCredits);
    } catch (error) {
      console.error('Failed to claim credits:', error);
      // Still close the modal even if API fails (credits might already be claimed)
      onClose(wonCredits);
    }
  };

  if (!isOpen) return null;

  const creditLabel = userRole === 'CLIENT' ? 'Post Credits' : 'Bid Credits';
  const roleLabel = userRole === 'CLIENT' ? 'Brand' : 'Creator';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-8 relative overflow-hidden"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,63,94,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.15),transparent_50%)]" />

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full mb-4"
              >
                <Gift className="w-5 h-5 text-amber-400" />
                <span className="text-amber-300 font-semibold">Welcome Bonus!</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">
                🎉 Welcome, {roleLabel}!
              </h2>
              <p className="text-slate-400">
                Spin the wheel to win free credits!
              </p>
            </div>

            {/* Wheel Container */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-lg" />
              </div>

              {/* Wheel */}
              <motion.div
                className="w-full h-full rounded-full relative overflow-hidden border-4 border-slate-600 shadow-2xl"
                style={{ 
                  background: `conic-gradient(${SEGMENT_COLORS.map((color, i) => 
                    `${color} ${i * 36}deg ${(i + 1) * 36}deg`
                  ).join(', ')})`
                }}
                animate={{ rotate: rotation }}
                transition={{ 
                  duration: 4, 
                  ease: [0.17, 0.67, 0.12, 0.99]
                }}
              >
                {/* Segment Labels */}
                {WHEEL_SEGMENTS.map((value, index) => {
                  const angle = (index * 36) + 18;
                  return (
                    <div
                      key={index}
                      className="absolute w-full h-full flex items-center justify-center"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <span 
                        className="absolute text-white font-bold text-xl drop-shadow-lg"
                        style={{ 
                          transform: `translateY(-90px) rotate(0deg)`,
                          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  );
                })}

                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-900 rounded-full border-4 border-slate-600 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
              </motion.div>

              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-amber-500/20 to-transparent pointer-events-none" />
            </div>

            {/* Result Display */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-6 mb-6">
                    <p className="text-emerald-400 text-sm font-medium mb-2">You won</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-5xl font-black text-white">{wonCredits}</span>
                      <div className="text-left">
                        <p className="text-emerald-400 font-bold text-lg">FREE</p>
                        <p className="text-slate-400 text-sm">{creditLabel}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm mb-6">
                    {userRole === 'CLIENT' 
                      ? `Use your credits to post ${wonCredits} campaign${wonCredits > 1 ? 's' : ''} for free!`
                      : `Use your credits to bid on ${wonCredits} campaign${wonCredits > 1 ? 's' : ''} for free!`
                    }
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClaim}
                    disabled={claiming}
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {claiming ? 'Claiming...' : 'Claim & Start Exploring 🚀'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Spinning State */}
            {isSpinning && (
              <div className="text-center">
                <p className="text-slate-400 animate-pulse">Spinning...</p>
              </div>
            )}

            {/* Pre-spin State */}
            {!isSpinning && !hasSpun && (
              <div className="text-center">
                <p className="text-slate-400">Get ready...</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
