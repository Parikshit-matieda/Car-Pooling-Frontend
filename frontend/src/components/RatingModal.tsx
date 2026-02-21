import React, { useState } from 'react';
import api from '../api';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    rideId: number;
    ratedUserId: number;
    ratedUserName: string;
    onSuccess: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, rideId, ratedUserId, ratedUserName, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a star rating');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/users/rate', {
                ride_id: rideId,
                rated_user: ratedUserId,
                rating,
                review
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit rating');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-black/5 animate-scale-in">
                <div className="bg-[#f7d302] p-10 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-black font-black hover:bg-black/20 transition-all"
                    >
                        ✕
                    </button>
                    <div className="w-20 h-20 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-xl border-4 border-white">
                        ⭐
                    </div>
                    <h2 className="text-3xl font-black text-black tracking-tight leading-none mb-2">Rate Your Trip</h2>
                    <p className="text-black/40 font-black text-[10px] uppercase tracking-widest italic">Reviewing {ratedUserName}</p>
                </div>

                <div className="p-10">
                    <div className="flex justify-center gap-3 mb-10">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={`text-4xl transition-all hover:scale-125 ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>

                    <div className="mb-8">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Your Feedback</label>
                        <textarea
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 rounded-3xl p-6 font-bold text-black outline-none transition-all resize-none h-32"
                            placeholder="How was your ride? (Optional)"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 font-bold text-center mb-6 text-sm">{error}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`w-full py-5 bg-black text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Submit Review ➔'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
