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
    const [photo, setPhoto] = useState<File | null>(null);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const data = new FormData();
        data.append('full_name', formData.full_name);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('password', formData.password);
        if (photo) {
            data.append('profile_photo', photo);
        }

        try {
            const response = await api.post('/auth/register', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            navigate('/verify-email', { state: { userId: response.data.user_id, email: formData.email } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7d302] p-6 lg:p-12 relative overflow-hidden font-sans uppercase">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-black/5 rounded-full blur-3xl shadow-inner"></div>

            <div className="max-w-2xl w-full animate-fade-in relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-0 bg-white rounded-[64px] overflow-hidden shadow-2xl border-4 border-black/5">
                {/* Visual Side */}
                <div className="bg-black p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-[#f7d302] rounded-full blur-[120px]"></div>
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-5xl lg:text-7xl font-[1000] text-white tracking-tighter leading-[0.85] mb-8">
                            Join <br />
                            <span className="text-[#f7d302] italic underline decoration-white/20">The Tribe</span>
                        </h1>
                        <p className="text-white/40 text-[10px] font-black tracking-[0.4em] mb-12 uppercase">Become a blinkrider today</p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl group-hover:bg-[#f7d302] group-hover:text-black transition-all">💸</div>
                                <p className="text-white/60 text-[10px] font-black tracking-widest uppercase">Split Costs Instantly</p>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl group-hover:bg-[#f7d302] group-hover:text-black transition-all">🌍</div>
                                <p className="text-white/60 text-[10px] font-black tracking-widest uppercase">Zero Emission Target</p>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl group-hover:bg-[#f7d302] group-hover:text-black transition-all">⚡</div>
                                <p className="text-white/60 text-[10px] font-black tracking-widest uppercase">Lightning Fast Rides</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 bg-white/5 p-6 rounded-[32px] border border-white/10 backdrop-blur-md">
                        <div className="text-center">
                            <div className="scale-100 group transition-all mb-4">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Google Authorization Failed')}
                                    theme="filled_black"
                                    shape="pill"
                                />
                            </div>
                            <p className="text-[8px] font-black text-white/30 tracking-[0.3em]">ONE-TAP AUTHORIZATION</p>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="p-10 lg:p-14 overflow-y-auto max-h-[90vh] custom-scrollbar">
                    <div className="flex justify-between items-center mb-10">
                        <div className="w-12 h-1 black bg-black rounded-full"></div>
                        <span className="text-[10px] font-black text-black tracking-widest italic bg-[#f7d302] px-3 py-1 rounded">PHASE 01</span>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-5 rounded-2xl mb-8 font-black text-[10px] tracking-widest border border-red-100 uppercase">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 gap-8">
                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Full Identity</label>
                                <input type="text" name="full_name" required className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[24px] outline-none font-black transition-all text-xs" placeholder="JOHN DOE" onChange={handleChange} />
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Digital Address</label>
                                <input type="email" name="email" required className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[24px] outline-none font-black transition-all text-xs" placeholder="YOU@BLINKRIDE.COM" onChange={handleChange} />
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Comm-Link</label>
                                <input type="tel" name="phone" required className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[24px] outline-none font-black transition-all text-xs" placeholder="+91 00000 00000" onChange={handleChange} />
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Security Key</label>
                                <input type="password" name="password" required className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[24px] outline-none font-black transition-all text-xs" placeholder="••••••••" onChange={handleChange} />
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Visual Scan (Avatar)</label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-[24px] cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all hover:border-black group/file">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {photo ? (
                                            <span className="text-[10px] font-black text-black bg-[#f7d302] px-4 py-2 rounded-full truncate max-w-[200px]">{photo.name}</span>
                                        ) : (
                                            <>
                                                <span className="text-3xl mb-2 opacity-30 group-hover/file:scale-110 transition-transform">📸</span>
                                                <p className="text-[9px] font-black text-gray-400 tracking-[0.2em]">UPLOAD AVATAR</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-black text-white py-6 rounded-[24px] font-[1000] text-sm uppercase tracking-[0.25em] shadow-2xl hover:bg-[#f7d302] hover:text-black transition-all active:scale-95 group/btn"
                        >
                            <span className="relative z-10">GENERATE PROFILE <span className="inline-block group-hover/btn:translate-x-2 transition-transform">➔</span></span>
                        </button>
                    </form>

                    <p className="mt-12 text-center text-[10px] font-black text-gray-400 tracking-widest">
                        EXISTING OPERATOR? <Link to="/login" className="text-black hover:bg-[#f7d302] px-2 py-1 rounded transition-colors inline-block -rotate-1 bg-black/5 ml-1">SIGN IN ➔</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
