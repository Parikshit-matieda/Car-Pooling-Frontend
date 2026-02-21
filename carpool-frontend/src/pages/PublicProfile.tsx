import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

interface UserProfile {
    user_id: number;
    full_name: string;
    email: string;
    phone: string;
    profile_photo: string;
    role: string;
    gender: string | null;
    created_at: string;
    rating: number;
    rating_count: number;
    vehicles: {
        model: string;
        vehicle_number: string;
        seats: number;
    }[];
    reviews: {
        rating: number;
        review: string;
        created_at: string;
        reviewer_name: string;
        reviewer_photo: string;
    }[];
    upcoming_rides: {
        ride_id: number;
        source: string;
        destination: string;
        ride_date: string;
        ride_time: string;
        passengers: {
            user_id: number;
            full_name: string;
            profile_photo: string;
            gender: string | null;
        }[];
    }[];
}

const PublicProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        const socket = io(`http://${window.location.hostname}:4000`);

        if (user?.user_id) {
            socket.emit('identify', user.user_id);
        }

        socket.on('online-users-list', (userIds: number[]) => {
            setOnlineUserIds(new Set(userIds));
        });

        socket.on('user-online', (userId: number) => {
            setOnlineUserIds(prev => new Set([...prev, userId]));
        });

        socket.on('user-offline', (userId: number) => {
            setOnlineUserIds(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.user_id]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/users/profile/${id}`);
                setProfile(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-4">
                <p className="text-xl font-black text-black mb-6">⚠️ {error || 'User not found'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-black text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5]">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 animate-fade-in">
                <div className="bg-white rounded-[48px] border border-black/5 shadow-sm overflow-hidden">
                    <div className="bg-[#f7d302] p-12 text-center relative">
                        <div className="w-32 h-32 bg-white rounded-[40px] mx-auto mb-6 flex items-center justify-center text-5xl font-black shadow-xl border-4 border-white overflow-hidden relative group">
                            {profile.profile_photo ? (
                                <img
                                    src={`http://localhost:4000/${profile.profile_photo}`}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                profile.full_name.charAt(0)
                            )}
                        </div>
                        <h1 className="text-4xl font-black text-black tracking-tight mb-2">{profile.full_name}</h1>
                        <div className="flex items-center justify-center gap-2 mb-4 bg-black/5 w-fit mx-auto px-4 py-1.5 rounded-full">
                            <span className="text-amber-500 text-lg">★</span>
                            <span className="text-lg font-black text-black">{Number(profile.rating || 0).toFixed(1)}</span>
                            <span className="text-xs font-bold text-black/40">({profile.rating_count || 0} reviews)</span>
                        </div>
                        <p className="text-black/40 font-black text-[10px] uppercase tracking-widest italic">{profile.role} Member</p>
                    </div>

                    <div className="p-12 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Member Details */}
                        <div>
                            <h2 className="text-xl font-black text-black underline decoration-yellow-400 decoration-4 underline-offset-8 mb-10">About Member</h2>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-lg font-black text-black flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        Verified Member
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Joined CarPool</p>
                                    <p className="text-lg font-black text-black">{new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                </div>
                                {profile.gender && (
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                                        <p className="text-lg font-black text-black flex items-center gap-2">
                                            <span>{profile.gender === 'MALE' ? '♂' : profile.gender === 'FEMALE' ? '♀' : profile.gender === 'OTHER' ? '⚧' : '🔒'}</span>
                                            {profile.gender === 'PREFER_NOT_TO_SAY' ? 'Prefer Not to Say' : profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase()}
                                        </p>
                                    </div>
                                )}
                                <div className="pt-6 border-t border-gray-100">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Contact Information</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">📧</span>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Email Address</p>
                                                <p className="text-sm font-bold text-black">{profile.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">📞</span>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Mobile Number</p>
                                                <p className="text-sm font-bold text-black">{profile.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Registered Vehicles */}
                        <div>
                            <h2 className="text-xl font-black text-black underline decoration-yellow-400 decoration-4 underline-offset-8 mb-10">Registered Vehicles</h2>
                            <div className="space-y-4">
                                {profile.vehicles.length === 0 ? (
                                    <p className="text-gray-400 font-bold italic">No vehicles registered yet.</p>
                                ) : (
                                    profile.vehicles.map((v, i) => (
                                        <div key={i} className="p-5 bg-gray-50 rounded-[24px] border border-gray-100 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">🏎️</div>
                                            <div>
                                                <p className="text-sm font-black text-black leading-none mb-1">{v.model}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{v.seats} Seats Registered</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active Journeys & Co-travellers */}
                    <div className="px-12 md:px-16 pb-10 border-t border-gray-100 pt-10">
                        <h2 className="text-xl font-black text-black underline decoration-yellow-400 decoration-4 underline-offset-8 mb-10">Active Journeys & Co-travellers</h2>
                        {profile.upcoming_rides.length === 0 ? (
                            <p className="text-gray-400 font-bold italic text-sm py-4">🚗 No active journeys scheduled at the moment.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {profile.upcoming_rides.map((ride, idx) => (
                                    <div key={idx} className="bg-[#fafafa] rounded-[40px] p-8 border border-gray-100 hover:border-black/10 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -mr-16 -mt-16 group-hover:bg-yellow-400/10 transition-colors"></div>

                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Upcoming Route</p>
                                                </div>
                                                <p className="text-lg font-black text-black leading-tight">{ride.source} <br /><span className="text-yellow-500">→</span> {ride.destination}</p>
                                                <div className="pt-2 flex items-center gap-3">
                                                    <p className="text-[10px] font-black text-black/60 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">{new Date(ride.ride_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                                    <p className="text-[10px] font-black text-black/60 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">{ride.ride_time}</p>
                                                </div>
                                            </div>
                                            <div className="bg-black text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10">
                                                {ride.passengers.length} Booked
                                            </div>
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Confirmed Co-travellers</p>
                                                {ride.passengers.length > 0 && <span className="text-[8px] font-black text-yellow-600 uppercase">Identity Verified</span>}
                                            </div>

                                            {ride.passengers.length === 0 ? (
                                                <div className="p-6 bg-white rounded-[24px] border border-dashed border-gray-200 text-center">
                                                    <p className="text-[10px] font-bold text-gray-400 italic uppercase tracking-widest">Be the first to join this trip!</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-4">
                                                    {ride.passengers.map((p, pIdx) => (
                                                        <div key={pIdx} className="flex items-center gap-3 bg-white pl-2 pr-4 py-2 rounded-[20px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center text-xs font-black border border-gray-50">
                                                                {p.profile_photo ? (
                                                                    <img src={`http://localhost:4000/${p.profile_photo}`} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="bg-yellow-400 w-full h-full flex items-center justify-center">{p.full_name.charAt(0)}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-black leading-none mb-1 flex items-center gap-1.5">
                                                                    {p.full_name}
                                                                    {onlineUserIds.has(p.user_id) && (
                                                                        <span className="flex items-center gap-1">
                                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                                                            <span className="text-[7px] font-black text-green-500 uppercase tracking-widest">Online</span>
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                                    <span className="text-xs">{p.gender === 'MALE' ? '♂' : p.gender === 'FEMALE' ? '♀' : '⚧'}</span>
                                                                    {p.gender?.toLowerCase() || 'Verified'}
                                                                </p>
                                                            </div>
                                                            <div className="w-2 h-2 rounded-full absolute top-2 right-2 bg-green-500 shadow-sm shadow-green-200"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reviews Section */}
                    <div className="px-12 md:px-16 pb-10 border-t border-gray-100 pt-10">
                        <h2 className="text-xl font-black text-black underline decoration-yellow-400 decoration-4 underline-offset-8 mb-6">Member Reviews</h2>
                        {profile.reviews.length === 0 ? (
                            <p className="text-gray-400 font-bold italic text-sm py-4">💬 No reviews yet for this member.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {profile.reviews.map((rev, i) => (
                                    <div key={i} className="flex items-center gap-4 py-3">
                                        {/* Avatar */}
                                        <div className="w-8 h-8 bg-[#f7d302] rounded-xl overflow-hidden flex items-center justify-center text-black font-black text-sm shrink-0">
                                            {rev.reviewer_photo
                                                ? <img src={`http://localhost:4000/${rev.reviewer_photo}`} alt="" className="w-full h-full object-cover" />
                                                : rev.reviewer_name.charAt(0)}
                                        </div>
                                        {/* Name */}
                                        <p className="text-xs font-black text-black w-28 shrink-0 truncate">{rev.reviewer_name}</p>
                                        {/* Stars */}
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <span key={s} className={`text-xs ${s <= rev.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                                            ))}
                                        </div>
                                        {/* Review text */}
                                        <p className="text-xs text-gray-500 italic truncate flex-1">
                                            {rev.review ? `"${rev.review}"` : <span className="text-gray-300">No comment</span>}
                                        </p>
                                        {/* Date */}
                                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest shrink-0">
                                            {new Date(rev.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-12 bg-gray-50/50 border-t border-gray-50 text-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-black font-black text-[10px] uppercase tracking-widest hover:text-yellow-600 transition-colors"
                        >
                            ← Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
