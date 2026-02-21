import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const genderOptions = [
    { value: 'MALE', label: '♂ Male' },
    { value: 'FEMALE', label: '♀ Female' },
    { value: 'OTHER', label: '⚧ Other' },
    { value: 'PREFER_NOT_TO_SAY', label: '🔒 Prefer Not to Say' },
];

const CompleteProfile: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [idCard, setIdCard] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIdCard(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('phone', phone);
        if (gender) formData.append('gender', gender);
        if (photo) formData.append('profile_photo', photo);
        if (idCard) formData.append('id_card_photo', idCard);

        try {
            const response = await api.put('/users/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            localStorage.setItem('user', JSON.stringify(response.data));
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f7d302] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background decorative blobs */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-black/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-lg">
                {/* Header card */}
                <div className="bg-black text-white rounded-[48px] px-10 py-10 mb-4 relative overflow-hidden">
                    <div className="absolute top-[-40%] right-[-20%] w-[80%] h-[80%] bg-[#f7d302]/20 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl">⚡</span>
                            <span className="text-[10px] font-black text-white/40 tracking-[0.35em] uppercase">blinkride</span>
                        </div>
                        <p className="text-white/40 text-[10px] font-black tracking-[0.3em] uppercase mb-2">Step 2 of 2</p>
                        <h1 className="text-4xl font-[1000] tracking-tighter leading-none mb-2">
                            Almost <span className="text-[#f7d302]">there!</span>
                        </h1>
                        <p className="text-white/50 text-xs font-bold mt-3">
                            Hi <span className="text-white font-black">{user?.full_name?.split(' ')[0] || 'there'}</span> — just a couple more details and you're in.
                        </p>
                    </div>
                </div>

                {/* Form card */}
                <div className="bg-white rounded-[48px] px-10 py-10 shadow-2xl border-4 border-black/5">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 font-black text-[10px] tracking-widest uppercase">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Phone */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                                📞 Comm-Link (Phone)
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                required
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91 00000 00000"
                                className="w-full px-7 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[24px] outline-none font-black text-xs transition-all"
                            />
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                                🪪 Gender
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {genderOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setGender(opt.value)}
                                        className={`px-4 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all border-2 ${gender === opt.value
                                            ? 'bg-black text-white border-black shadow-lg'
                                            : 'bg-gray-50 text-gray-500 border-transparent hover:border-black/20 hover:bg-gray-100'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Photo */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                                📸 Profile Photo
                            </label>
                            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-[24px] cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-black transition-all group">
                                <div className="flex flex-col items-center justify-center py-4">
                                    {photo ? (
                                        <span className="text-[10px] font-black text-black bg-[#f7d302] px-4 py-2 rounded-full truncate max-w-[220px]">
                                            {photo.name}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-2xl mb-2 opacity-30 group-hover:scale-110 transition-transform">📸</span>
                                            <p className="text-[9px] font-black text-gray-400 tracking-[0.2em]">UPLOAD AVATAR</p>
                                        </>
                                    )}
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>

                        {/* ID Card Photo */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                                🪪 ID Card Photo
                            </label>
                            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-[24px] cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-black transition-all group2">
                                <div className="flex flex-col items-center justify-center py-4">
                                    {idCard ? (
                                        <span className="text-[10px] font-black text-black bg-black/10 px-4 py-2 rounded-full truncate max-w-[220px]">
                                            {idCard.name}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-2xl mb-2 opacity-30 group-hover:scale-110 transition-transform">🪪</span>
                                            <p className="text-[9px] font-black text-gray-400 tracking-[0.2em]">UPLOAD ID CARD</p>
                                        </>
                                    )}
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleIdCardChange} />
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-6 rounded-[24px] font-[1000] text-sm uppercase tracking-[0.25em] shadow-2xl hover:bg-[#f7d302] hover:text-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                        >
                            {loading
                                ? 'Saving...'
                                : <span>Save &amp; Launch In <span className="inline-block group-hover/btn:translate-x-2 transition-transform">➔</span></span>
                            }
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
