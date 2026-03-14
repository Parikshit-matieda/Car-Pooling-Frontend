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

            // Update user in context/localStorage
            if (user && response.data.user) {
                const token = localStorage.getItem('token') || '';
                login(token, response.data.user);
            }

            navigate('/create-ride');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload license. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 uppercase">
            <Navbar />
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">🪪</div>
                        <h1 className="text-3xl font-black text-gray-900">Upload License</h1>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-shake">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Driving License Number</label>
                            <input
                                type="text"
                                required
                                value={licenseNo}
                                className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300"
                                onChange={(e) => setLicenseNo(e.target.value)}
                                placeholder="ABC-123456789"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date</label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={expiryDate}
                                className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                                onChange={(e) => setExpiryDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">License Document (Photo/PDF)</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    required
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleFileChange}
                                />
                                <div className={`w-full border-2 border-dashed ${file ? 'border-green-300 bg-green-50' : 'border-gray-200 group-hover:border-indigo-300'} rounded-2xl py-10 px-6 flex flex-col items-center justify-center transition-all`}>
                                    <div className="text-4xl mb-2">{file ? '✅' : '📤'}</div>
                                    <span className="text-sm font-bold text-gray-600">
                                        {file ? file.name : 'Click or drag to upload'}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">PNG, JPG or PDF up to 10MB</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 bg-indigo-600 text-white font-bold py-5 px-8 rounded-2xl transition-all shadow-xl hover:shadow-indigo-200 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}
                            >
                                {loading ? 'Uploading...' : 'Submit to Admin'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/create-ride')}
                                className="bg-white text-gray-500 font-bold py-5 px-8 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 transition-all text-center"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>

                    <div className="mt-10 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 items-start">
                        <span className="text-xl">ℹ️</span>
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                            Our administration team typically reviews license submissions within 24 hours. You'll be notified via email once your account is verified for driving.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadLicense;
