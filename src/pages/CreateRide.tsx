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
                    <div className="bg-white p-10 md:p-16 rounded-3xl shadow-2xl border border-amber-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 mt-8 mr-8">
                            <span className="bg-amber-100 text-amber-600 text-xs font-black px-4 py-2 rounded-full tracking-widest uppercase">
                                Verification Pending
                            </span>
                        </div>

                        <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mb-10 text-5xl">⏳</div>

                        <h1 className="text-4xl font-black text-gray-900 mb-6 leading-tight">
                            Hang tight! <br />
                            <span className="text-amber-500">Checking your license</span>
                        </h1>

                        <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-2xl">
                            Thanks for uploading your driving license! Our team is currently reviewing your submission. This usually takes less than 24 hours. You'll be able to publish rides as soon as you're verified.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <Link
                                to="/dashboard"
                                className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-5 px-12 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-200 text-center"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                ) : !isVerified ? (
                    <div className="bg-white p-10 md:p-16 rounded-3xl shadow-2xl border border-red-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 mt-8 mr-8">
                            <span className="bg-red-100 text-red-600 text-xs font-black px-4 py-2 rounded-full tracking-widest uppercase">
                                Action Required
                            </span>
                        </div>

                        <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mb-10 text-5xl">🪪</div>

                        <h1 className="text-4xl font-black text-gray-900 mb-6 leading-tight">
                            Verify your license <br />
                            <span className="text-red-500">to start driving</span>
                        </h1>

                        <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-2xl">
                            Safety is our top priority. To ensure a secure experience for all members, we require all drivers to verify their identity and driving license before they can offer rides.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <Link
                                to="/upload-license"
                                className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-5 px-12 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-200 text-center"
                            >
                                Upload License Now
                            </Link>
                            <Link
                                to="/dashboard"
                                className="w-full sm:w-auto bg-white text-gray-600 font-bold py-5 px-12 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 transition-all text-center"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
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
