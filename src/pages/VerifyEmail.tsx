import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const { userId, email } = (location.state as { userId: number; email: string }) || {};

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!userId || !email) navigate('/register');
    }, [userId, email, navigate]);

    useEffect(() => {
        if (countdown <= 0) { setCanResend(true); return; }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0)
            inputRefs.current[index - 1]?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = [...otp];
        pasted.split('').forEach((ch, i) => { if (i < 6) next[i] = ch; });
        setOtp(next);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter all 6 digits.'); return; }

        try {
            setLoading(true);
            const response = await api.post('/auth/verify-email', { user_id: userId, otp: code });
            setSuccess('Email verified! Logging you in...');

            // Auto-login — backend returns token + user after verification
            if (response.data.token && response.data.user) {
                login(response.data.token, response.data.user);
                setTimeout(() => navigate('/'), 1200);   // ← goes to HOME
            } else {
                setTimeout(() => navigate('/login'), 1200);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setResending(true);
        try {
            await api.post('/auth/resend-otp', { email });
            setCountdown(30);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            setSuccess('New OTP sent! Check inbox and spam.');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7d302] p-6 relative overflow-hidden font-sans">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-black/5 rounded-full blur-3xl" />

            <div className="max-w-md w-full relative z-10">
                {/* Branding */}
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-black text-black tracking-tighter mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        ⚡ blink<span className="bg-black text-[#f7d302] px-2 rounded-lg">ride</span>
                    </h1>
                    <p className="text-[10px] font-black tracking-[0.3em] text-black/40">GENESIZED CARPOOLING</p>
                </div>

                <div className="bg-white p-8 sm:p-12 rounded-[48px] shadow-2xl border-4 border-black/5">
                    <div className="text-center mb-10">
                        <div className="text-5xl mb-4">📬</div>
                        <h2 className="text-3xl font-black text-black tracking-tighter">
                            Verify <span className="bg-[#f7d302] px-2 inline-block -rotate-1">Email</span>
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mt-4">OTP sent to</p>
                        <p className="text-xs font-black text-black mt-1 break-all">{email}</p>
                        <p className="text-[9px] font-black text-gray-300 tracking-widest uppercase mt-2 italic">
                            Check inbox and spam folder
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-black text-[10px] tracking-widest border border-red-100 uppercase">
                            ⚠️ {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-600 p-4 rounded-2xl mb-6 font-black text-[10px] tracking-widest border border-green-100 uppercase">
                            ✅ {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* 6 OTP boxes */}
                        <div className="flex gap-2 sm:gap-3 justify-center mb-8" onPaste={handlePaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-black bg-gray-50 border-2 rounded-2xl outline-none transition-all
                                        ${digit ? 'border-black bg-white' : 'border-transparent'}
                                        focus:border-black focus:bg-white`}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-[#f7d302] hover:text-black transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verifying...' : 'Verify & Enter ⚡'}
                        </button>
                    </form>

                    {/* Resend OTP */}
                    <div className="mt-8 text-center">
                        {canResend ? (
                            <button
                                onClick={handleResend}
                                disabled={resending}
                                className="text-[10px] font-black text-black uppercase tracking-widest bg-[#f7d302] px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all disabled:opacity-60"
                            >
                                {resending ? 'Sending...' : 'Resend OTP →'}
                            </button>
                        ) : (
                            <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                                Resend in <span className="text-black">{countdown}s</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
