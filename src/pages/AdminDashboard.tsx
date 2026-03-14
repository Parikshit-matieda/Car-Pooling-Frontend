import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';

interface User {
    user_id: number;
    full_name: string;
    email: string;
    phone?: string;
    role: string;
    profile_photo?: string;
    email_verified: boolean;
    license_no?: string;
    license_pdf?: string;
    license_status?: string;
    license_expiry_date?: string;
    created_at: string;
}

const AdminDashboard: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [pendingLicenses, setPendingLicenses] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'licenses'>('users');
    const [error, setError] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, pendingRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/pending-licenses')
            ]);
            setUsers(usersRes.data);
            setPendingLicenses(pendingRes.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyStatus = async (userId: number, status: 'VERIFIED' | 'REJECTED') => {
        try {
            await api.post(`/admin/verify/${userId}`, { status });
            setPendingLicenses(pendingLicenses.filter(u => u.user_id !== userId));
            // Also update the users list if needed
            setUsers(users.map(u => u.user_id === userId ? { ...u, license_status: status } : u));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update license status');
        }
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update role');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u.user_id !== userId));
            setPendingLicenses(pendingLicenses.filter(u => u.user_id !== userId));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete user');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 uppercase">
            <Navbar />
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
                        <p className="text-gray-500 font-bold mt-1">Manage users and verification requests</p>
                    </div>

                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-indigo-600'}`}
                        >
                            Users ({users.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('licenses')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'licenses' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-indigo-600'}`}
                        >
                            License Requests ({pendingLicenses.length})
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-shake">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Synchronizing Data...</p>
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Profile</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {users.map((user) => (
                                        <tr key={user.user_id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-indigo-50 flex-shrink-0">
                                                        {user.profile_photo ? (
                                                            <img className="w-full h-full object-cover" src={`http://localhost:4000/${user.profile_photo}`} alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-indigo-300 font-bold text-xl">
                                                                {user.full_name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-900">{user.full_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{user.email}</div>
                                                <div className="text-xs text-gray-400 mt-1">{user.phone || 'NO PHONE'}</div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                                                    disabled={user.user_id === currentUser?.user_id}
                                                    className="text-xs font-black bg-gray-100 text-gray-700 px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                                >
                                                    <option value="USER">USER</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                </select>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex flex-col gap-2">
                                                    {user.email_verified ? (
                                                        <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full tracking-wider uppercase">Email Verified</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-400 text-[10px] font-black rounded-full tracking-wider uppercase">Email Pending</span>
                                                    )}
                                                    {user.license_status === 'VERIFIED' && (
                                                        <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full tracking-wider uppercase">License Verified</span>
                                                    )}
                                                    {user.license_status === 'PENDING' && (
                                                        <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full tracking-wider uppercase">License Pending</span>
                                                    )}
                                                    {user.license_status === 'REJECTED' && (
                                                        <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full tracking-wider uppercase">License Rejected</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-right">
                                                {user.user_id !== currentUser?.user_id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user.user_id)}
                                                        className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase tracking-widest p-2 hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pendingLicenses.length === 0 ? (
                            <div className="bg-white p-20 rounded-3xl shadow-xl border border-gray-100 text-center">
                                <div className="text-6xl mb-6">🎉</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Queue Clear!</h3>
                                <p className="text-gray-400 font-bold">No pending license verification requests at the moment.</p>
                            </div>
                        ) : (
                            pendingLicenses.map((req) => (
                                <div key={req.user_id} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 flex flex-col lg:flex-row gap-10 items-start">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl">🪪</div>
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900">{req.full_name}</h3>
                                                <p className="text-sm font-bold text-gray-400">{req.email}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 rounded-2xl">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">License Number</p>
                                                <p className="font-bold text-gray-800">{req.license_no}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expiry Date</p>
                                                <p className="font-bold text-gray-800">{req.license_expiry_date}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleVerifyStatus(req.user_id, 'VERIFIED')}
                                                className="flex-1 bg-green-500 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-green-100 hover:bg-green-600 active:scale-95 transition-all uppercase tracking-widest text-sm"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleVerifyStatus(req.user_id, 'REJECTED')}
                                                className="flex-1 bg-white text-red-500 border-2 border-red-50 font-black py-4 px-6 rounded-2xl hover:bg-red-50 active:scale-95 transition-all uppercase tracking-widest text-sm"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full lg:w-96 flex-shrink-0">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Submitted Document</p>
                                        <div
                                            className="relative aspect-[4/3] rounded-3xl overflow-hidden border-2 border-gray-100 group cursor-zoom-in"
                                            onClick={() => setSelectedDoc(req.license_pdf || null)}
                                        >
                                            {req.license_pdf?.endsWith('.pdf') ? (
                                                <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-10 text-center">
                                                    <span className="text-5xl mb-4">📄</span>
                                                    <span className="text-xs font-black text-gray-500 uppercase">PDF Document</span>
                                                    <span className="text-[10px] text-gray-400 mt-2">Click to view in new tab</span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={`http://localhost:4000/${req.license_pdf}`}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 blur-sm group-hover:blur-none"
                                                    alt="License"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                <span className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-bold text-xs uppercase tracking-widest border border-white/30">
                                                    Full Preview
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Document Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in">
                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md" onClick={() => setSelectedDoc(null)}></div>
                    <div className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-zoom-in">
                        <div className="absolute top-6 right-6 z-10">
                            <button
                                onClick={() => setSelectedDoc(null)}
                                className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 md:p-8 h-full flex items-center justify-center overflow-auto max-h-[85vh]">
                            {selectedDoc.endsWith('.pdf') ? (
                                <iframe
                                    src={`http://localhost:4000/${selectedDoc}`}
                                    className="w-full h-full min-h-[70vh] rounded-2xl"
                                    title="License PDF"
                                />
                            ) : (
                                <img
                                    src={`http://localhost:4000/${selectedDoc}`}
                                    className="max-w-full max-h-full object-contain rounded-2xl"
                                    alt="License Full"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
