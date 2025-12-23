import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    TrendingUp, Users, Megaphone, FileText, DollarSign, Star, Target,
    Activity, Percent, Award, PieChart as PieChartIcon, BarChart3,
} from 'lucide-react';
import api from '../../lib/api';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { PageLoader } from '../ui/Spinner';

interface ChartData {
    monthlyTrends: Array<{
        month: string;
        users: number;
        advertisements: number;
        bids: number;
        revenue: number;
    }>;
    usersByRole: Array<{ name: string; value: number; color: string }>;
    usersByStatus: Array<{ name: string; value: number; color: string }>;
    adsByPlatform: Array<{ name: string; value: number; color: string }>;
    adsByStatus: Array<{ name: string; value: number; color: string }>;
    bidsByStatus: Array<{ name: string; value: number; color: string }>;
    contractsByStatus: Array<{ name: string; value: number; color: string }>;
    adsByCategory: Array<{ name: string; value: number }>;
    adsByBudget: Array<{ range: string; count: number }>;
    ratingDistribution: Array<{ rating: string; count: number }>;
    summary: {
        totalUsers: number;
        totalAds: number;
        totalBids: number;
        totalContracts: number;
        totalRevenue: number;
        avgRating: string;
        successRate: string;
        avgContractValue: string;
    };
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 shadow-xl">
                <p className="text-slate-300 text-sm font-medium mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-semibold">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Summary stat card
function SummaryCard({ title, value, icon: Icon, color, suffix = '' }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    suffix?: string;
}) {
    const colorClasses: Record<string, string> = {
        rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
        emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
        amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
        cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colorClasses[color]} border p-4`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                    </p>
                </div>
                <div className={`p-3 rounded-xl bg-slate-800/50`}>
                    <Icon className={`w-6 h-6 ${colorClasses[color].split(' ').find(c => c.startsWith('text-'))}`} />
                </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
                <Icon className="w-24 h-24" />
            </div>
        </motion.div>
    );
}

// Donut chart component
function DonutChart({ data, title, icon: Icon }: { data: Array<{ name: string; value: number; color: string }>; title: string; icon: any }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="h-full">
            <CardHeader className="border-b border-slate-700/50 pb-3">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-rose-400" />
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={55}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-xl font-bold text-white">{total}</p>
                                <p className="text-xs text-slate-400">Total</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-sm text-slate-300">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white">{item.value}</span>
                                    <span className="text-xs text-slate-400">
                                        {total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Horizontal bar chart
function HorizontalBarChart({ data, title, icon: Icon, color = '#f43f5e' }: {
    data: Array<{ name: string; value: number }>;
    title: string;
    icon: any;
    color?: string;
}) {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <Card className="h-full">
            <CardHeader className="border-b border-slate-700/50 pb-3">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-rose-400" />
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="space-y-3">
                    {data.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-300 truncate max-w-[60%]">{item.name}</span>
                                <span className="text-sm font-semibold text-white">{item.value}</span>
                            </div>
                            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.value / maxValue) * 100}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// Area chart for trends
function TrendAreaChart({ data, title }: { data: ChartData['monthlyTrends']; title: string }) {
    return (
        <Card>
            <CardHeader className="border-b border-slate-700/50 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-rose-400" />
                        <h3 className="text-base font-semibold text-white">{title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <span className="text-slate-400">Users</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-cyan-500" />
                            <span className="text-slate-400">Ads</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            <span className="text-slate-400">Bids</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="users"
                                name="Users"
                                stroke="#f43f5e"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                            />
                            <Area
                                type="monotone"
                                dataKey="advertisements"
                                name="Ads"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorAds)"
                            />
                            <Area
                                type="monotone"
                                dataKey="bids"
                                name="Bids"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorBids)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Revenue chart
function RevenueChart({ data }: { data: ChartData['monthlyTrends'] }) {
    return (
        <Card>
            <CardHeader className="border-b border-slate-700/50 pb-3">
                <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-semibold text-white">Revenue Trend</h3>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="revenue" name="Revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} />
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Budget distribution chart
function BudgetChart({ data }: { data: ChartData['adsByBudget'] }) {
    return (
        <Card>
            <CardHeader className="border-b border-slate-700/50 pb-3">
                <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-semibold text-white">Budget Distribution</h3>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis
                                type="category"
                                dataKey="range"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                width={60}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="Campaigns" fill="url(#budgetGradient)" radius={[0, 4, 4, 0]} />
                            <defs>
                                <linearGradient id="budgetGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#d97706" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Rating distribution
function RatingChart({ data, avgRating }: { data: ChartData['ratingDistribution']; avgRating: string }) {
    return (
        <Card>
            <CardHeader className="border-b border-slate-700/50 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        <h3 className="text-base font-semibold text-white">Average Rating</h3>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-amber-400 font-bold">{avgRating}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="space-y-2">
                    {data.map((item, index) => {
                        const maxCount = Math.max(...data.map(d => d.count), 1);
                        const stars = 5 - index;
                        return (
                            <div key={index} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-20">
                                    {[...Array(stars)].map((_, i) => (
                                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.count / maxCount) * 100}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                                    />
                                </div>
                                <span className="text-sm text-slate-400 w-8 text-right">{item.count}</span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default function AnalyticsCharts() {
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await api.get('/admin/analytics-charts');
                setChartData(response.data.data);
            } catch (error) {
                console.error('Failed to fetch chart data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchChartData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <PageLoader />
            </div>
        );
    }

    if (!chartData) {
        return (
            <div className="text-center py-8 text-slate-400">
                Failed to load analytics data
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Activity className="w-6 h-6 text-rose-400" />
                        Analytics & Insights
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Comprehensive platform analytics and performance metrics
                    </p>
                </div>
            </motion.div>

            {/* Key Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total Revenue"
                    value={`$${chartData.summary.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="emerald"
                />
                <SummaryCard
                    title="Success Rate"
                    value={chartData.summary.successRate}
                    suffix="%"
                    icon={Target}
                    color="blue"
                />
                <SummaryCard
                    title="Avg Rating"
                    value={chartData.summary.avgRating}
                    icon={Star}
                    color="amber"
                />
                <SummaryCard
                    title="Avg Contract"
                    value={`$${Number(chartData.summary.avgContractValue).toLocaleString()}`}
                    icon={Award}
                    color="purple"
                />
            </div>

            {/* Main Trend Chart */}
            <TrendAreaChart data={chartData.monthlyTrends} title="Platform Growth Overview" />

            {/* Distribution Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DonutChart
                    data={chartData.usersByRole}
                    title="Users by Role"
                    icon={Users}
                />
                <DonutChart
                    data={chartData.usersByStatus}
                    title="Users by Status"
                    icon={Users}
                />
                <DonutChart
                    data={chartData.adsByPlatform.length > 0 ? chartData.adsByPlatform : [{ name: 'No Data', value: 1, color: '#475569' }]}
                    title="Ads by Platform"
                    icon={Megaphone}
                />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DonutChart
                    data={chartData.bidsByStatus}
                    title="Bids by Status"
                    icon={FileText}
                />
                <DonutChart
                    data={chartData.contractsByStatus}
                    title="Contracts by Status"
                    icon={Award}
                />
                <DonutChart
                    data={chartData.adsByStatus}
                    title="Ads by Status"
                    icon={Megaphone}
                />
            </div>

            {/* Bar Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HorizontalBarChart
                    data={chartData.adsByCategory.length > 0 ? chartData.adsByCategory : [{ name: 'No Categories', value: 0 }]}
                    title="Top Categories"
                    icon={BarChart3}
                    color="#f43f5e"
                />
                <RatingChart data={chartData.ratingDistribution} avgRating={chartData.summary.avgRating} />
            </div>

            {/* Revenue and Budget */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart data={chartData.monthlyTrends} />
                <BudgetChart data={chartData.adsByBudget} />
            </div>
        </div>
    );
}
