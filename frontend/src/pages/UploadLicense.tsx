import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const UploadLicense: React.FC = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [licenseNo, setLicenseNo] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!file) {
            setError('Please select a license photo or PDF');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('license_no', licenseNo);
        formData.append('license_expiry_date', expiryDate);
        formData.append('license_pdf', file);

        try {
            const response = await api.post('/users/me/license', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Update user in context/sessionStorage
            if (user && response.data.user) {
                const token = sessionStorage.getItem('token') || '';
                login(token, response.data.user);
            }

            navigate('/', { state: { licenseUploaded: true } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload license. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (user?.license_status === 'PENDING') {
        return (
            <div className="min-h-screen bg-[#f7d302] p-6 lg:p-12 relative overflow-hidden font-sans flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 min-h-[80vh]">
                    <div className="bg-white p-12 lg:p-16 rounded-[48px] shadow-2xl text-center border-4 border-black/5 max-w-xl w-full animate-fade-in">
                        <div className="w-24 h-24 bg-amber-50 rounded-[32px] flex items-center justify-center text-5xl mx-auto mb-10 shadow-sm border-2 border-white">⏳</div>
                        <h2 className="text-4xl font-[1000] text-black mb-6 uppercase tracking-tighter leading-none">Review <br />In Progress</h2>
                        <p className="text-gray-500 font-bold mb-10 leading-relaxed text-lg">We're currently checking your driving license. You'll be able to publish rides as soon as the admin approves your documents.</p>
                        <div className="space-y-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-6 bg-black text-white font-[1000] rounded-[28px] shadow-2xl shadow-black/10 hover:bg-gray-900 active:scale-95 transition-all uppercase tracking-widest text-sm"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7d302] p-6 lg:p-12 relative overflow-hidden font-sans flex flex-col">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-black/5 rounded-full blur-3xl"></div>

            <div className="max-w-2xl mx-auto py-12 relative z-10 animate-fade-in">
                <div className="bg-white rounded-[48px] shadow-2xl p-10 lg:p-14 border-4 border-black/5">
                    <div className="flex items-center gap-5 mb-10">
                        <div className="w-16 h-16 bg-blue-50 rounded-[24px] flex items-center justify-center text-3xl shadow-sm border-2 border-white">🪪</div>
                        <h1 className="text-4xl font-[1000] text-black tracking-tighter uppercase leading-none">Upload License</h1>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-5 rounded-2xl mb-8 font-black text-[10px] tracking-widest border border-red-100 uppercase animate-shake flex items-center gap-3">
                            <span className="text-lg">⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="group">
                            <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-4 ml-2">Driving License Number</label>
                            <input
                                type="text"
                                required
                                value={licenseNo}
                                className="w-full px-8 py-5 bg-gray-50 border-2 border-blue-100 rounded-[24px] focus:border-blue-600 focus:bg-white outline-none font-black transition-all text-sm placeholder:text-gray-200"
                                onChange={(e) => setLicenseNo(e.target.value)}
                                placeholder="ABC-123456789"
                            />
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-4 ml-2">Expiry Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={expiryDate}
                                    className="w-full px-8 py-5 bg-gray-50 border-2 border-gray-50 rounded-[24px] focus:border-blue-600 focus:bg-white outline-none font-black transition-all text-sm appearance-none"
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                />
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-xl opacity-40">📅</div>
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-4 ml-2">License Document (Photo/PDF)</label>
                            <div className="relative group/upload">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    required
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleFileChange}
                                />
                                <div className={`w-full border-2 border-dashed ${file ? 'border-green-300 bg-green-50 shadow-inner' : 'border-gray-100 group-hover/upload:border-blue-300 bg-gray-50 hover:bg-white'} rounded-[32px] py-14 px-8 flex flex-col items-center justify-center transition-all min-h-[240px]`}>
                                    {file ? (
                                        <div className="flex flex-col items-center animate-scale-in">
                                            <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center text-4xl mb-4 text-green-600 shadow-sm border-2 border-white">✅</div>
                                            <span className="text-xs font-black text-black bg-white px-4 py-2 rounded-full border border-green-100 shadow-sm max-w-[280px] truncate">
                                                {file.name}
                                            </span>
                                            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mt-4">Document Staged</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-blue-50/50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover/upload:scale-110 group-hover/upload:bg-blue-50 transition-all">📤</div>
                                            <p className="text-xs font-black text-black uppercase tracking-widest text-center mb-2">Click or drag to upload</p>
                                            <p className="text-[10px] font-black text-gray-300 tracking-[0.2em] uppercase">PNG, JPG or PDF up to 10MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex flex-col sm:flex-row gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-[2] bg-black text-white font-[1000] py-6 px-10 rounded-[28px] transition-all shadow-2xl shadow-black/10 uppercase tracking-widest text-sm ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-900 active:scale-95 group/btn'}`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Processing...
                                    </span>
                                ) : (
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        Submit to Admin <span className="text-white/40 group-hover/btn:translate-x-1 transition-transform">➔</span>
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/create-ride')}
                                className="flex-1 bg-white text-gray-400 font-black py-6 px-8 rounded-[28px] border-2 border-gray-50 hover:bg-gray-50 hover:text-black transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-black/5"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 p-8 bg-amber-50 rounded-[32px] border-2 border-amber-100 flex gap-5 items-start">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl shadow-sm">ℹ️</div>
                        <div>
                            <p className="text-[10px] font-black text-amber-900 leading-none mb-2 uppercase tracking-widest">Verification Protocol</p>
                            <p className="text-[10px] text-amber-800/60 leading-relaxed font-black uppercase tracking-tighter">
                                Our administration team typically reviews license submissions within 24 hours. You'll be notified via system alerts once your account is verified for driving.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadLicense;
