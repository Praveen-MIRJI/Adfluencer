import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: 'rose' | 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan';
    suffix?: string;
    onClick?: () => void;
}

const colorClasses: Record<string, string> = {
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
};

const textColors: Record<string, string> = {
    rose: 'text-rose-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
};

export default function SummaryCard({ title, value, icon: Icon, color, suffix = '', onClick }: SummaryCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={onClick}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colorClasses[color]} border p-4 cursor-pointer transition-all duration-300`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                    </p>
                </div>
                <div className={`p-3 rounded-xl bg-slate-800/50`}>
                    <Icon className={`w-6 h-6 ${textColors[color]}`} />
                </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
                <Icon className="w-24 h-24" />
            </div>
        </motion.div>
    );
}
