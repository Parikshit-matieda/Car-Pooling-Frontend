import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/auth/login', formData);
            login(response.data.token, response.data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
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
        <div className="min-h-screen flex items-center justify-center bg-[#f7d302] p-6 lg:p-12 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-black/5 rounded-full blur-3xl"></div>

            <div className="max-w-md w-full animate-fade-in relative z-10">
                {/* Branding */}
                <div className="text-center mb-10">
                    <h1 className="text-5xl lg:text-6xl font-black text-black tracking-tighter mb-2 normal-case" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        ⚡ blink<span className="bg-black text-[#f7d302] px-2 rounded-lg">ride</span>
                    </h1>
                    <p className="text-[10px] font-black tracking-[0.3em] text-black/40">GENESIZED CARPOOLING</p>
                </div>

                <div className="bg-white p-10 lg:p-14 rounded-[48px] shadow-2xl border-4 border-black/5">
                    <h2 className="text-4xl font-black text-black mb-10 tracking-tighter leading-none">
                        Welcome <br />
                        <span className="bg-[#f7d302] px-3 py-1 inline-block -rotate-1 italic">Back</span>
                    </h2>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-5 rounded-2xl mb-8 font-black text-[10px] tracking-widest flex items-center gap-3 border border-red-100">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="relative group">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Email Identity</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-110 transition-all">📧</span>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="w-full pl-18 pr-6 py-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[28px] outline-none font-black transition-all text-sm shadow-inner placeholder:text-gray-300"
                                    placeholder="your@email.com"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Secret Key</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-110 transition-all">🔐</span>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="w-full pl-18 pr-6 py-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[28px] outline-none font-black transition-all text-sm shadow-inner placeholder:text-gray-300"
                                    placeholder="••••••••"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-black text-white py-6 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-[#f7d302] hover:text-black transition-all active:scale-95 flex items-center justify-center gap-4"
                        >
                            Authorize ⚡
                        </button>
                    </form>

                    <div className="mt-12">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-widest">
                                <span className="px-4 bg-white text-gray-400">Quick Connect</span>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center">
                            <div className="scale-110 group transition-all">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Google Authorization Failed')}
                                    theme="filled_black"
                                    shape="pill"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="mt-12 text-center text-[10px] font-black text-gray-400 tracking-widest">
                        NEW TO blinkride? <Link to="/register" className="text-black hover:bg-[#f7d302] px-2 py-1 rounded transition-colors inline-block -rotate-1 bg-black/5 ml-1">JOIN NOW ➔</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
