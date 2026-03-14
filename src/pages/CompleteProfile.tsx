import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CompleteProfile: React.FC = () => {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const formData = new FormData();
        formData.append('phone', phone);
        if (photo) {
            formData.append('profile_photo', photo);
        }

        try {
            const response = await api.put('/users/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Update localStorage with new user data
            localStorage.setItem('user', JSON.stringify(response.data));

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Complete Profile</h2>
                <p className="text-center text-gray-600 mb-6">Please complete your profile to continue</p>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1234567890"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            onChange={handleFileChange}
                        />
                        {photo && <p className="text-xs text-gray-500 mt-1">Selected: {photo.name}</p>}
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                        Save & Continue
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompleteProfile;
