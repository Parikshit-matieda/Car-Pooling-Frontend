import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api';

const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userId, email } = location.state || {};
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (!userId) {
            setError("Identity marker missing. Please attempt registration again.");
            setLoading(false);
            return;
        }

        try {
            await api.post('/auth/verify-email', { user_id: userId, otp, email });
            setMessage('Identity verified. Redirecting to access terminal...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed. Please check your security key.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7d302] p-6 lg:p-12 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-black/5 rounded-full blur-3xl shadow-inner"></div>

            <div className="max-w-md w-full animate-fade-in relative z-10 bg-white rounded-[48px] overflow-hidden shadow-2xl border-4 border-black/5 p-10 lg:p-14">
                <div className="flex justify-between items-center mb-10">
                    <div className="w-12 h-1 bg-black rounded-full"></div>
                    <span className="text-[10px] font-black text-black tracking-widest italic bg-[#f7d302] px-3 py-1 rounded">PHASE 02</span>
                </div>

                <h2 className="text-3xl lg:text-4xl font-[1000] text-black mb-4 tracking-tighter leading-none">
                    Verify <span className="bg-[#f7d302] px-2 italic">Email</span>
                </h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10 leading-loose">
                    Security key transmitted to <br />
                    <span className="text-black italic">{email || 'your registered address'}</span>
                </p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-5 rounded-2xl mb-8 font-black text-[10px] tracking-widest border border-red-100 uppercase animate-shake">
                        ⚠️ {error}
                    </div>
                )}
                {message && (
                    <div className="bg-green-50 text-green-600 p-5 rounded-2xl mb-8 font-black text-[10px] tracking-widest border border-green-100 uppercase animate-fade-in">
                        ✅ {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="group">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Security Key (OTP)</label>
                        <input
                            type="text"
                            value={otp}
                            required
                            placeholder="000 000"
                            className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[24px] outline-none font-black transition-all text-2xl tracking-[0.5em] text-center"
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-black text-white py-6 rounded-[28px] font-[1000] text-sm uppercase tracking-[0.25em] shadow-2xl hover:bg-[#f7d302] hover:text-black transition-all group/btn mt-4 flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span className="relative z-10">Verify Identity <span className="inline-block group-hover/btn:translate-x-2 transition-transform">➔</span></span>
                        )}
                    </button>
                </form>

                <p className="mt-12 text-center text-[10px] font-black text-gray-400 tracking-widest">
                    HAVEN'T RECEIVED IT? <Link to="/register" className="text-black hover:bg-[#f7d302] px-2 py-1 rounded transition-colors inline-block -rotate-1 bg-black/5 ml-1 uppercase">Try Again ➔</Link>
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
