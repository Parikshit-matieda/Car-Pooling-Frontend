import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle } from 'lucide-react';
import api from '../api';

interface Passenger {
    user_id: number;
    full_name: string;
    profile_photo: string;
    has_rated: boolean;
}

interface RatePassengersModalProps {
    ride: any;
    onClose: () => void;
    onSuccess: (message: string) => void;
}

const RatePassengersModal: React.FC<RatePassengersModalProps> = ({ ride, onClose, onSuccess }) => {
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState<number | null>(null);
    const [ratings, setRatings] = useState<Record<number, { rating: number; review: string }>>({});
    const [hoverRatings, setHoverRatings] = useState<Record<number, number>>({});

    useEffect(() => {
        const fetchPassengers = async () => {
            try {
                const res = await api.get(`/ratings/ride-passengers/${ride.ride_id}`);
                setPassengers(res.data);
                // Initialize ratings if not rated
                const initialRatings: Record<number, { rating: number; review: string }> = {};
                res.data.forEach((p: Passenger) => {
                    if (!p.has_rated) {
                        initialRatings[p.user_id] = { rating: 0, review: '' };
                    }
                });
                setRatings(initialRatings);
            } catch (err) {
                console.error('Failed to fetch passengers', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPassengers();
    }, [ride.ride_id]);

    const handleRatingChange = (passengerId: number, rating: number) => {
        setRatings(prev => ({
            ...prev,
            [passengerId]: { ...prev[passengerId], rating }
        }));
    };

    const handleReviewChange = (passengerId: number, review: string) => {
        setRatings(prev => ({
            ...prev,
            [passengerId]: { ...prev[passengerId], review }
        }));
    };

    const handleSubmit = async (passengerId: number) => {
        const ratingData = ratings[passengerId];
        if (!ratingData || ratingData.rating === 0) return;

        setSubmittingId(passengerId);
        try {
            await api.post('/ratings/passenger', {
                ride_id: ride.ride_id,
                passenger_id: passengerId,
                rating: ratingData.rating,
                review: ratingData.review.trim() || undefined
            });

            setPassengers(prev => prev.map(p =>
                p.user_id === passengerId ? { ...p, has_rated: true } : p
            ));

            // If all passengers are rated, we could auto-close, but let's just show success for this one
            const remaining = passengers.filter(p => !p.has_rated && p.user_id !== passengerId).length;
            if (remaining === 0) {
                onSuccess('⭐ All passengers have been rated! Thank you.');
                onClose();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to submit rating.');
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in uppercase">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-black/5 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-black text-white">
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter">Rate Your Passengers</h3>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                            Ride: {ride.source?.split(',')[0]} → {ride.destination?.split(',')[0]}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#f7d302] border-t-black rounded-full animate-spin mb-4"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Passengers...</p>
                        </div>
                    ) : passengers.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-400 font-bold italic">No passengers to rate for this ride.</p>
                        </div>
                    ) : (
                        passengers.map(passenger => (
                            <div key={passenger.user_id} className="bg-gray-50 rounded-[32px] p-6 border border-black/5 flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-black flex-shrink-0">
                                        {passenger.profile_photo ? (
                                            <img src={`http://localhost:5000/${passenger.profile_photo}`} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white font-black text-xl">
                                                {passenger.full_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-black leading-tight text-lg">{passenger.full_name}</h4>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Passenger</p>
                                    </div>
                                </div>

                                <div className="flex-1 w-full">
                                    {passenger.has_rated ? (
                                        <div className="flex items-center gap-3 text-green-600 font-black text-[10px] uppercase tracking-widest py-4 justify-center bg-green-50 rounded-2xl border border-green-100 italic">
                                            <CheckCircle size={14} /> Rated Successfully
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            onMouseEnter={() => setHoverRatings(prev => ({ ...prev, [passenger.user_id]: star }))}
                                                            onMouseLeave={() => setHoverRatings(prev => ({ ...prev, [passenger.user_id]: 0 }))}
                                                            onClick={() => handleRatingChange(passenger.user_id, star)}
                                                            className="transition-transform hover:scale-110 active:scale-90"
                                                        >
                                                            <Star
                                                                size={24}
                                                                className={`transition-colors ${star <= (hoverRatings[passenger.user_id] || ratings[passenger.user_id]?.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}
                                                                fill={star <= (hoverRatings[passenger.user_id] || ratings[passenger.user_id]?.rating || 0) ? 'currentColor' : 'currentColor'}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest h-3">
                                                    {ratings[passenger.user_id]?.rating > 0 ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][ratings[passenger.user_id]?.rating] : ''}
                                                </p>
                                            </div>
                                            <textarea
                                                value={ratings[passenger.user_id]?.review || ''}
                                                onChange={(e) => handleReviewChange(passenger.user_id, e.target.value)}
                                                placeholder="Experience with this passenger..."
                                                rows={2}
                                                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-xs font-medium text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:border-yellow-400"
                                            />
                                            <button
                                                onClick={() => handleSubmit(passenger.user_id)}
                                                disabled={!ratings[passenger.user_id]?.rating || submittingId === passenger.user_id}
                                                className="w-full py-3 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                                            >
                                                {submittingId === passenger.user_id ? 'Submitting...' : 'Submit Review ✓'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-8 border-t border-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-10 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">
                        Skip / Finish
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatePassengersModal;
