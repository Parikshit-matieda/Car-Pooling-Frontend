import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';


const UserDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState([
        { label: 'Rides Offered', value: '0', icon: '🚗', color: 'bg-yellow-100 text-black' },
        { label: 'Rides Taken', value: '0', icon: '🎫', color: 'bg-yellow-100 text-black' },
        { label: 'Carbon Saved', value: '0kg', icon: '🌿', color: 'bg-green-100 text-green-700' },
    ]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);



    const refreshData = useCallback(async () => {
        try {
            const response = await api.get('/users/me/dashboard');
            const { stats: realStats, recentActivity: realActivity } = response.data;

            if (realStats) {
                setStats([
                    { label: 'Rides Offered', value: realStats.ridesOffered.toString(), icon: '🚗', color: 'bg-yellow-100 text-black' },
                    { label: 'Rides Taken', value: realStats.ridesTaken.toString(), icon: '🎫', color: 'bg-yellow-100 text-black' },
                    { label: 'Carbon Saved', value: `${realStats.carbonSaved}kg`, icon: '🌿', color: 'bg-green-100 text-green-700' },
                ]);
            }

            if (realActivity) setRecentActivity(realActivity);
        } catch (error) {
            console.error('Error refreshing dashboard data', error);
        }
    }, []);

    useEffect(() => {
        refreshData().finally(() => setLoading(false));
    }, [refreshData]);


    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] font-sans">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">

                <div className="mb-8 sm:mb-12 animate-fade-in">
                    <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tighter mb-2 sm:mb-3 leading-none">
                        Hi, {user?.full_name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Your activity snapshot</p>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 sm:mb-12 animate-slide-in">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-black/5 shadow-sm hover:shadow-xl transition-all group">
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 ${stat.color} rounded-xl sm:rounded-[24px] flex items-center justify-center text-2xl sm:text-3xl mb-6 sm:mb-8 group-hover:rotate-12 transition-transform`}>
                                {stat.icon}
                            </div>
                            <p className="text-gray-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-3xl sm:text-4xl font-black text-black tracking-tight">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Activity Feed */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[32px] sm:rounded-[48px] border border-black/5 p-8 sm:p-10 md:p-14 shadow-sm animate-fade-in">
                            <div className="flex justify-between items-center mb-10 sm:mb-12">
                                <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Recent Activity</h2>
                                <button className="text-black font-black text-[9px] sm:text-[10px] uppercase tracking-widest border-b-2 border-yellow-400 pb-1 hover:text-yellow-600 transition-all">View all</button>
                            </div>

                            <div className="space-y-8 sm:space-y-10">
                                {recentActivity.length === 0 ? (
                                    <p className="text-gray-400 font-bold italic text-sm">No recent activity found.</p>
                                ) : (
                                    recentActivity.map((activity, i) => (
                                        <div key={i} className="flex gap-4 sm:gap-8 items-start pb-8 sm:pb-10 border-b border-gray-50 last:border-0 last:pb-0 group">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 rounded-xl sm:rounded-[20px] flex-none flex items-center justify-center text-xl sm:text-2xl group-hover:bg-yellow-100 transition-colors">
                                                {activity.activity_type === 'RIDE_OFFERED' ? '🚗' : '🎫'}
                                            </div>
                                            <div>
                                                <p className="text-black font-black text-base sm:text-lg leading-tight mb-2">
                                                    {activity.activity_type === 'RIDE_OFFERED'
                                                        ? `You offered a ride from ${activity.source} to ${activity.destination}`
                                                        : `You booked a ride to ${activity.destination}`}
                                                </p>
                                                <p className="text-gray-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest italic">
                                                    {new Date(activity.created_at).toLocaleDateString()} at {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Promo-Banner Quick Tip */}
                        <div className="bg-black rounded-[48px] p-12 text-white relative overflow-hidden group">
                            <div className="relative z-10 md:w-2/3">
                                <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-6 inline-block">Pro Tip</div>
                                <h3 className="text-4xl font-black mb-6 leading-none">Make money while traveling?</h3>
                                <p className="text-white/60 font-medium mb-10 leading-relaxed text-lg">Share your empty seats with verified travelers and pay for your fuel. It's safe and instant.</p>
                                <button
                                    onClick={() => navigate('/create-ride')}
                                    className="bg-[#f7d302] text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-yellow-400/20"
                                >
                                    Offer a ride ➔
                                </button>
                            </div>
                            <span className="absolute -right-16 -bottom-16 text-[280px] opacity-10 grayscale-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">🏎️</span>
                        </div>
                    </div>

                    {/* Sidebar: Upcoming / Tasks */}
                    <div className="space-y-8">


                        {/* High-Contrast Profile Nudge */}
                        <div className="bg-[#f7d302] rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 text-black border border-black/5">
                            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center text-xl mb-6">🛡️</div>
                            <h4 className="text-sm font-black uppercase tracking-widest mb-4 italic">Verify Account</h4>
                            <p className="text-black/60 text-sm font-bold leading-relaxed mb-8">Verified profiles are 3x more likely to get picked for rides. Complete yours today.</p>
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-full py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl shadow-black/10"
                            >
                                Verify Now ➔
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default UserDashboard;
