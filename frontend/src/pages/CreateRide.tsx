import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';

const CreateRide: React.FC = () => {
    const { user, isAuthenticated, refreshUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            refreshUser();
        }
    }, [isAuthenticated, refreshUser]);

    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [seats, setSeats] = useState(1);
    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const isVerified = user?.license_status === 'VERIFIED';
    const isPending = user?.license_status === 'PENDING';

    const handleCreateRide = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/rides', {
                source,
                destination,
                ride_date: date,
                ride_time: time,
                total_seats: seats,
                base_price: price,
                vehicle_id: 1 // Temporarily hardcoded
            });
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create ride. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 uppercase">
                <Navbar />
                <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                    <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
                        <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-8 text-4xl">🔑</div>
                        <h1 className="text-3xl font-black text-gray-900 mb-4">Login Required</h1>
                        <p className="text-gray-600 mb-10 text-lg">Please log in to your account to offer a ride.</p>
                        <Link
                            to="/login"
                            className="inline-block bg-indigo-600 text-white font-bold py-4 px-12 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
                        >
                            Sign In Now
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 uppercase">
                <Navbar />
                <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                    <div className="bg-white p-12 rounded-3xl shadow-xl border border-green-50">
                        <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-8 text-4xl">🚀</div>
                        <h1 className="text-3xl font-black text-gray-900 mb-4">Ride Published!</h1>
                        <p className="text-gray-600 mb-10 text-lg">Your ride has been successfully created. Redirecting to dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 uppercase">
            <Navbar />
            <div className="max-w-4xl mx-auto py-12 px-4">
                {isPending ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 relative z-10 animate-fade-in min-h-[70vh]">
                        <div className="bg-white rounded-[48px] shadow-2xl p-12 md:p-16 border-4 border-black/5 text-center max-w-2xl w-full relative overflow-hidden">
                            <div className="absolute top-8 right-8">
                                <span className="bg-amber-100 text-amber-600 text-[10px] font-black px-4 py-2 rounded-full tracking-widest uppercase border border-amber-200 shadow-sm">
                                    Checking...
                                </span>
                            </div>

                            <div className="w-24 h-24 bg-amber-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-5xl shadow-sm border-2 border-white">⏳</div>

                            <h1 className="text-5xl font-[1000] text-black mb-6 tracking-tighter uppercase leading-none">
                                Review <br />
                                <span className="text-amber-500">In Progress</span>
                            </h1>

                            <p className="text-gray-500 font-bold mb-10 leading-relaxed text-lg max-w-lg mx-auto">
                                Our team is currently reviewing your driving license. This usually takes less than 24 hours. You'll be notified immediately once verified!
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-12 py-6 bg-black text-white font-[1000] rounded-[28px] shadow-2xl shadow-black/10 hover:bg-gray-900 active:scale-95 transition-all uppercase tracking-widest text-sm"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                        <div className="mt-8 bg-black text-white/20 text-[8px] font-black py-3 px-10 rounded-full uppercase tracking-[0.5em] shadow-2xl">BLINKRIDE SECURE SYSTEM</div>
                    </div>
                ) : !isVerified ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 relative z-10 animate-fade-in min-h-[70vh]">
                        <div className="bg-white rounded-[48px] shadow-2xl p-12 md:p-16 border-4 border-black/5 text-center max-w-2xl w-full relative overflow-hidden">
                            <div className="absolute top-8 right-8">
                                <span className="bg-red-50 text-red-500 text-[10px] font-black px-4 py-2 rounded-full tracking-widest uppercase border border-red-100 shadow-sm">
                                    Required
                                </span>
                            </div>

                            <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-5xl shadow-sm border-2 border-white">🪪</div>

                            <h1 className="text-5xl font-[1000] text-black mb-6 tracking-tighter uppercase leading-none">
                                Verify <br />
                                <span className="text-red-500">To Drive</span>
                            </h1>

                            <p className="text-gray-500 font-bold mb-10 leading-relaxed text-lg max-w-lg mx-auto">
                                Safety is our top priority. Please verify your identity and driving license before you can start offering rides to co-travelers.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/upload-license')}
                                    className="px-12 py-6 bg-black text-white font-[1000] rounded-[28px] shadow-2xl shadow-black/10 hover:bg-gray-900 active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center gap-3"
                                >
                                    Verify Now <span className="text-white/40">➔</span>
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-12 py-6 bg-gray-50 text-gray-400 font-black rounded-[28px] hover:bg-gray-100 hover:text-black transition-all text-xs uppercase tracking-widest"
                                >
                                    Later
                                </button>
                            </div>
                        </div>
                        <div className="mt-8 bg-black text-white/20 text-[8px] font-black py-3 px-10 rounded-full uppercase tracking-[0.5em] shadow-2xl">BLINKRIDE SECURE SYSTEM</div>
                    </div>
                ) : (
                    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-indigo-50">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">✨</div>
                                <h1 className="text-3xl font-black text-gray-900 leading-tight">
                                    Publish a Ride
                                </h1>
                            </div>
                            <span className="bg-green-100 text-green-600 text-[10px] font-black px-3 py-1.5 rounded-full tracking-wider uppercase">
                                Verified Driver
                            </span>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 flex items-center gap-3">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateRide} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">From</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">📍</span>
                                        <input
                                            type="text"
                                            required
                                            value={source}
                                            className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all"
                                            onChange={(e) => setSource(e.target.value)}
                                            placeholder="Leaving from..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">To</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">🎯</span>
                                        <input
                                            type="text"
                                            required
                                            value={destination}
                                            className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all"
                                            onChange={(e) => setDestination(e.target.value)}
                                            placeholder="Going to..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={date}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all"
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={time}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all"
                                        onChange={(e) => setTime(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">Available Seats</label>
                                    <div className="flex items-center bg-gray-50 rounded-2xl p-1 border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white transition-all">
                                        <button
                                            type="button"
                                            onClick={() => setSeats(Math.max(1, seats - 1))}
                                            className="w-12 h-12 flex items-center justify-center text-xl font-bold hover:bg-white rounded-xl transition-all"
                                        >-</button>
                                        <input
                                            type="number"
                                            readOnly
                                            className="flex-1 text-center bg-transparent font-bold text-gray-900 outline-none"
                                            value={seats}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setSeats(Math.min(6, seats + 1))}
                                            className="w-12 h-12 flex items-center justify-center text-xl font-bold hover:bg-white rounded-xl transition-all"
                                        >+</button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 ml-1">Price per Seat (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={price}
                                        className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all placeholder:font-normal"
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full bg-indigo-600 text-white font-black py-5 px-8 rounded-2xl transition-all shadow-xl hover:shadow-indigo-200 uppercase tracking-widest ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-[0.98]'}`}
                            >
                                {loading ? 'Publishing...' : 'Publish Ride Now'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateRide;
