import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import api from '../api';
const Register: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [gender, setGender] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [idCard, setIdCard] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // Password strength checker
    const passwordChecks = {
        length: formData.password.length >= 8,
        upper: /[A-Z]/.test(formData.password),
        lower: /[a-z]/.test(formData.password),
        digit: /\d/.test(formData.password),
        special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password),
    };
    const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setPhoto(e.target.files[0]);
    };
    const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setIdCard(e.target.files[0]);
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // Frontend email validation
        const email = formData.email.toLowerCase();
        if (!email.endsWith('@charusat.edu.in') && !email.endsWith('@charusat.ac.in')) {
            setError('Registration is restricted to Charusat university emails (@charusat.edu.in or @charusat.ac.in)');
            return;
        }
        // Frontend password validation (catches it before hitting backend)
        if (!isPasswordStrong) {
            setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character (e.g. Pass@123)');
            return;
        }
        const data = new FormData();
        data.append('full_name', formData.full_name);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('password', formData.password);
        if (gender) data.append('gender', gender);
        if (photo) data.append('profile_photo', photo);
        if (idCard) data.append('id_card_photo', idCard);
        try {
            setLoading(true);
            const response = await api.post('/auth/register', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            navigate('/verify-email', { state: { userId: response.data.user_id, email: formData.email } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const response = await api.post('/auth/google', {
                idToken: credentialResponse.credential,
            });
            login(response.data.token, response.data.user);
            if (!response.data.user.phone) {
                navigate('/complete-profile');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Google Login failed');
        }
    };
    const genderOptions = [
        { value: 'MALE', label: '♂ Male' },
        { value: 'FEMALE', label: '♀ Female' },
        { value: 'OTHER', label: '⚧ Other' },
        { value: 'PREFER_NOT_TO_SAY', label: '🔒 Prefer Not to Say' },
    ];
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7d302] p-6 lg:p-12 relative overflow-hidden font-sans">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-black/5 rounded-full blur-3xl shadow-inner"></div>
            <div className="max-w-5xl w-full animate-fade-in relative z-10 grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-0 bg-white rounded-[32px] sm:rounded-[64px] overflow-hidden shadow-2xl border-4 border-black/5 h-auto lg:h-[90vh]">
                {/* Visual Side */}
                <div className="bg-black p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden hidden lg:flex">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-[#f7d302] rounded-full blur-[120px]"></div>
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-5xl lg:text-7xl font-[1000] text-white tracking-tighter leading-[0.85] mb-8">
                            Join <br />
                            <span className="text-[#f7d302] italic underline decoration-white/20">the tribe</span>
                        </h1>
                        <p className="text-white/40 text-[10px] font-black tracking-[0.4em] mb-12 uppercase">Become a blinkrider today</p>
                        <div className="space-y-6">
                            {[
                                { icon: '💸', text: 'Split Costs Instantly' },
                                { icon: '🌍', text: 'Zero Emission Target' },
                                { icon: '⚡', text: 'Lightning Fast Rides' },
                            ].map(item => (
                                <div key={item.text} className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl group-hover:bg-[#f7d302] group-hover:text-black transition-all">{item.icon}</div>
                                    <p className="text-white/60 text-[10px] font-black tracking-widest uppercase">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative z-10 mt-12 bg-white/5 p-6 rounded-[32px] border border-white/10 backdrop-blur-md">
                        <div className="text-center">
                            <div className="scale-100 group transition-all mb-4 flex justify-center">
                                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Authorization Failed')} theme="filled_black" shape="pill" />
                            </div>
                            <p className="text-[8px] font-black text-white/30 tracking-[0.3em] uppercase">One-Tap Authorization</p>
                        </div>
                    </div>
                </div>
                {/* Form Side */}
                <div className="p-8 lg:p-14 overflow-y-auto custom-scrollbar bg-white">
                    <div className="flex justify-between items-center mb-10">
                        <div className="w-12 h-1 bg-black rounded-full"></div>
                        <span className="text-[10px] font-black text-black tracking-widest italic bg-[#f7d302] px-3 py-1 rounded">PHASE 01</span>
                    </div>
                    <h2 className="text-3xl font-black text-black mb-8 tracking-tighter leading-none lg:hidden">
                        Join <span className="bg-[#f7d302] px-2">the tribe</span>
                    </h2>
                    {error && (
                        <div className="bg-red-50 text-red-600 p-5 rounded-2xl mb-8 font-black text-[10px] tracking-widest border border-red-100 uppercase animate-shake">
                            ⚠️ {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="group md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Full Identity</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    required
                                    value={formData.full_name}
                                    className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[24px] outline-none font-black transition-all text-xs"
                                    placeholder="JOHN DOE"
                                    onChange={handleChange}
                                />
                            </div>
                            {/* Email */}
                            <div className="group md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Digital Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[24px] outline-none font-black transition-all text-xs"
                                    placeholder="ID@charusat.edu.in"
                                    onChange={handleChange}
                                />
                                <p className="text-[8px] font-black text-gray-300 tracking-[0.2em] mt-3 ml-2 uppercase italic leading-loose">
                                    Must be @charusat.edu.in or @charusat.ac.in
                                </p>
                            </div>
                            {/* Phone */}
                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Comm-Link</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[24px] outline-none font-black transition-all text-xs"
                                    placeholder="+91 00000 00000"
                                    onChange={handleChange}
                                />
                            </div>
                            {/* Password */}
                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Security Key</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[24px] outline-none font-black transition-all text-xs"
                                    placeholder="••••••••"
                                    onChange={handleChange}
                                />
                                {/* Password strength indicators */}
                                {formData.password.length > 0 && (
                                    <div className="mt-3 ml-2 space-y-1">
                                        {[
                                            { ok: passwordChecks.length, text: '8+ characters' },
                                            { ok: passwordChecks.upper, text: 'Uppercase letter (A-Z)' },
                                            { ok: passwordChecks.lower, text: 'Lowercase letter (a-z)' },
                                            { ok: passwordChecks.digit, text: 'Number (0-9)' },
                                            { ok: passwordChecks.special, text: 'Special char (!@#$%^&*)' },
                                        ].map(check => (
                                            <p key={check.text} className={`text-[8px] font-black tracking-widest uppercase flex items-center gap-1 ${check.ok ? 'text-green-500' : 'text-red-400'}`}>
                                                {check.ok ? '✓' : '✗'} {check.text}
                                            </p>
                                        ))}
                                    </div>
                                )}
                                {formData.password.length === 0 && (
                                    <p className="text-[8px] font-black text-gray-300 tracking-[0.2em] mt-3 ml-2 uppercase italic">
                                        e.g. Pass@123 (needs upper, lower, number, special)
                                    </p>
                                )}
                            </div>
                            {/* Gender */}
                            <div className="group md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Gender</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                    {genderOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setGender(opt.value)}
                                            className={`px-3 py-4 rounded-[20px] text-[9px] font-black uppercase tracking-widest transition-all border-2 flex flex-col items-center justify-center gap-2 ${gender === opt.value
                                                ? 'bg-black text-white border-black shadow-lg'
                                                : 'bg-gray-50 text-gray-500 border-transparent hover:border-black/20'
                                            }`}
                                        >
                                            <span className="text-base">{opt.label.split(' ')[0]}</span>
                                            <span>{opt.label.split(' ').slice(1).join(' ')}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Profile Photo */}
                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Visual Scan (Avatar)</label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-[24px] cursor-pointer bg-gray-50 hover:bg-white transition-all hover:border-black group/file overflow-hidden">
                                    <div className="flex flex-col items-center justify-center py-4 px-6 text-center">
                                        {photo ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-2xl">🖼️</span>
                                                <span className="text-[9px] font-black text-black bg-[#f7d302] px-3 py-1 rounded-full truncate max-w-full">{photo.name}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-3xl mb-2 opacity-30 group-hover/file:scale-110 transition-transform">📸</span>
                                                <p className="text-[9px] font-black text-gray-400 tracking-[0.2em] uppercase">Upload Avatar</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </label>
                            </div>
                            {/* ID Card Photo */}
                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">🪪 ID Card <span className="text-gray-300 normal-case font-bold">(Optional)</span></label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-[24px] cursor-pointer bg-gray-50 hover:bg-white transition-all hover:border-black group/file2 overflow-hidden">
                                    <div className="flex flex-col items-center justify-center py-4 px-6 text-center">
                                        {idCard ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-2xl">✅</span>
                                                <span className="text-[9px] font-black text-black bg-black/10 px-3 py-1 rounded-full truncate max-w-full">{idCard.name}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-3xl mb-2 opacity-30 group-hover/file2:scale-110 transition-transform">🪪</span>
                                                <p className="text-[9px] font-black text-gray-400 tracking-[0.2em] uppercase">Upload ID Card</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleIdCardChange} />
                                </label>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-6 rounded-[28px] font-[1000] text-sm uppercase tracking-[0.25em] shadow-2xl hover:bg-[#f7d302] hover:text-black transition-all active:scale-95 group/btn mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <span className="relative z-10">
                                {loading
                                    ? 'Registering...'
                                    : <>Generate Profile <span className="inline-block group-hover/btn:translate-x-2 transition-transform">➔</span></>
                                }
                            </span>
                        </button>
                    </form>
                    <div className="lg:hidden mt-8 flex flex-col items-center gap-4">
                        <div className="scale-100">
                            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Authorization Failed')} theme="filled_black" shape="pill" />
                        </div>
                    </div>
                    <p className="mt-12 text-center text-[10px] font-black text-gray-400 tracking-widest">
                        ALREADY A MEMBER?{' '}
                        <Link to="/login" className="text-black hover:bg-[#f7d302] px-2 py-1 rounded transition-colors inline-block -rotate-1 bg-black/5 ml-1 uppercase">
                            Sign In ➔
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
export default Register;
