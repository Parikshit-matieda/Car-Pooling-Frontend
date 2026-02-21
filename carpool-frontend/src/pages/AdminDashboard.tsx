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
    id_card_photo?: string;
    id_card_status?: string;
    gender?: string;
    created_at: string;
}

interface Vehicle {
    vehicle_id: number;
    vehicle_number: string;
    model: string;
    seats: number;
    created_at: string;
}

interface Rating {
    rating_id: number;
    rating: number;
    review: string;
    created_at: string;
    rated_by_name: string;
    rated_by_photo?: string;
}

const AdminDashboard: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [pendingLicenses, setPendingLicenses] = useState<User[]>([]);
    const [pendingIdCards, setPendingIdCards] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'licenses' | 'idcards'>('users');
    const [error, setError] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userDetails, setUserDetails] = useState<{ vehicles: Vehicle[], ratings: Rating[] }>({ vehicles: [], ratings: [] });
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchUserDetails(selectedUser.user_id);
        } else {
            setUserDetails({ vehicles: [], ratings: [] });
        }
    }, [selectedUser]);

    const fetchUserDetails = async (userId: number) => {
        setDetailsLoading(true);
        try {
            const res = await api.get(`/admin/users/${userId}/details`);
            setUserDetails(res.data);
        } catch (err) {
            console.error('Failed to fetch user details:', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, pendingRes, pendingIdRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/pending-licenses'),
                api.get('/admin/pending-id-cards'),
            ]);
            setUsers(usersRes.data);
            setPendingLicenses(pendingRes.data);
            setPendingIdCards(pendingIdRes.data);
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
            const updatedUsers = users.map(u => u.user_id === userId ? { ...u, license_status: status } : u);
            setUsers(updatedUsers);
            if (selectedUser?.user_id === userId) {
                setSelectedUser({ ...selectedUser, license_status: status });
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update license status');
        }
    };

    const handleVerifyIdCard = async (userId: number, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
        try {
            await api.post(`/admin/verify-id-card/${userId}`, { status, reason });
            setPendingIdCards(pendingIdCards.filter(u => u.user_id !== userId));
            const updatedUsers = users.map(u => u.user_id === userId ? { ...u, id_card_status: status } : u);
            setUsers(updatedUsers);
            if (selectedUser?.user_id === userId) {
                setSelectedUser({ ...selectedUser, id_card_status: status });
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update ID card status');
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
            if (selectedUser?.user_id === userId) setSelectedUser(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#fafafa] uppercase">
            <Navbar />
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">Admin Panel</h1>
                        <p className="text-gray-400 font-bold mt-3 tracking-widest text-xs uppercase">System Governance & Verification</p>
                    </div>

                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex-wrap gap-1">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-black text-white shadow-xl scale-105' : 'text-gray-400 hover:text-black'}`}
                        >
                            Users ({users.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('licenses')}
                            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'licenses' ? 'bg-black text-white shadow-xl scale-105' : 'text-gray-400 hover:text-black'}`}
                        >
                            Licenses ({pendingLicenses.length})
                            {pendingLicenses.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-black animate-pulse shadow-lg shadow-red-200">{pendingLicenses.length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('idcards')}
                            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'idcards' ? 'bg-black text-white shadow-xl scale-105' : 'text-gray-400 hover:text-black'}`}
                        >
                            ID Cards ({pendingIdCards.length})
                            {pendingIdCards.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-black animate-pulse shadow-lg shadow-red-200">{pendingIdCards.length}</span>}
                        </button>
                    </div>
                </div>

                {activeTab === 'users' && (
                    <div className="mb-8 relative group">
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border-2 border-transparent focus:border-black rounded-[24px] px-8 py-5 text-sm font-bold shadow-sm transition-all outline-none"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-6 rounded-[24px] mb-8 flex items-center gap-4 animate-shake border border-red-100 italic font-bold">
                        <span className="text-xl">⚠️</span> {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-16 h-16 border-[6px] border-indigo-50 border-t-black rounded-full animate-spin mb-6"></div>
                        <p className="text-gray-300 font-black tracking-[0.2em] uppercase text-xs">Accessing Mainframe...</p>
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-[#fafafa]">
                                    <tr>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Identity</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Docs</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Governance</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {filteredUsers.map((user) => (
                                        <tr
                                            key={user.user_id}
                                            onClick={() => setSelectedUser(user)}
                                            className="hover:bg-gray-50/80 transition-all cursor-pointer group"
                                        >
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover:scale-105 transition-transform">
                                                        {user.profile_photo ? (
                                                            <img className="w-full h-full object-cover" src={`http://localhost:4000/${user.profile_photo}`} alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300 font-black text-xl">
                                                                {user.full_name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-gray-900 leading-tight">{user.full_name}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">ID: {user.user_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-800">{user.email}</div>
                                                <div className="text-[10px] font-black text-gray-400 mt-1 tracking-wider">{user.phone || 'NO PHONE PROVIDED'}</div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {/* Profile Thumb */}
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${user.profile_photo ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-300'}`}>
                                                        👤
                                                    </div>
                                                    {/* ID Card Thumb */}
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${user.id_card_status === 'VERIFIED' ? 'bg-green-50 text-green-600' : user.id_card_status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-300'}`}>
                                                        🪪
                                                    </div>
                                                    {/* License Thumb */}
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${user.license_status === 'VERIFIED' ? 'bg-green-50 text-green-600' : user.license_status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-300'}`}>
                                                        🚗
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                                                    disabled={user.user_id === currentUser?.user_id}
                                                    className="text-[10px] font-black bg-gray-100 text-gray-700 px-4 py-2 rounded-xl border-none focus:ring-0 cursor-pointer hover:bg-black hover:text-white transition-all appearance-none"
                                                >
                                                    <option value="USER">USER</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                </select>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                                {user.user_id !== currentUser?.user_id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user.user_id)}
                                                        className="text-red-300 hover:text-red-500 font-black text-[10px] uppercase tracking-widest p-2 hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        Terminate
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'licenses' ? (
                    <div className="space-y-6">
                        {pendingLicenses.length === 0 ? (
                            <div className="bg-white p-24 rounded-[32px] shadow-xl border border-gray-100 text-center">
                                <div className="text-7xl mb-8 grayscale">📫</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Workspace Empty</h3>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No pending license applications to process.</p>
                            </div>
                        ) : (
                            pendingLicenses.map((req) => (
                                <div key={req.user_id} className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-10 flex flex-col lg:flex-row gap-12 items-stretch">
                                    <div className="flex-1 space-y-8 flex flex-col justify-between">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-gray-200">🚗</div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-900">{req.full_name}</h3>
                                                    <p className="text-sm font-bold text-gray-400">{req.email}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 bg-[#fafafa] rounded-2xl border border-gray-50">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">License Serial</p>
                                                    <p className="font-black text-gray-800 text-lg">{req.license_no}</p>
                                                </div>
                                                <div className="p-5 bg-[#fafafa] rounded-2xl border border-gray-50">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Expiration</p>
                                                    <p className="font-black text-gray-800 text-lg">{req.license_expiry_date}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => handleVerifyStatus(req.user_id, 'VERIFIED')} className="flex-1 bg-green-500 text-white font-black py-5 px-8 rounded-2xl shadow-xl shadow-green-100 hover:bg-green-600 active:scale-95 transition-all uppercase tracking-widest text-xs">Approve Access</button>
                                            <button onClick={() => handleVerifyStatus(req.user_id, 'REJECTED')} className="flex-1 bg-white text-red-500 border-2 border-red-50 font-black py-5 px-8 rounded-2xl hover:bg-red-50 active:scale-95 transition-all uppercase tracking-widest text-xs">Deny Requst</button>
                                        </div>
                                    </div>
                                    <div className="w-full lg:w-[450px] flex-shrink-0">
                                        <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden border-2 border-gray-50 shadow-inner group cursor-zoom-in group" onClick={() => setSelectedDoc(req.license_pdf || null)}>
                                            {req.license_pdf?.endsWith('.pdf') ? (
                                                <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center p-10 text-center">
                                                    <span className="text-6xl mb-4 grayscale group-hover:grayscale-0 transition-all">📄</span>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Document (PDF)</span>
                                                    <span className="text-[8px] text-gray-300 mt-2 uppercase font-bold tracking-tighter">Click to enlarge</span>
                                                </div>
                                            ) : (
                                                <img src={`http://localhost:4000/${req.license_pdf}`} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 blur-[2px] group-hover:blur-0" alt="License" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                <span className="bg-white px-8 py-4 rounded-2xl text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl">Enlarge Preview</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* ID Cards Tab */
                    <div className="space-y-6">
                        {pendingIdCards.length === 0 ? (
                            <div className="bg-white p-24 rounded-[32px] shadow-xl border border-gray-100 text-center">
                                <div className="text-7xl mb-8 grayscale">🛰️</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Safe & Secure</h3>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No pending student identities awaiting manual review.</p>
                            </div>
                        ) : (
                            pendingIdCards.map((req) => (
                                <div key={req.user_id} className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-10 flex flex-col lg:flex-row gap-12 items-stretch">
                                    <div className="flex-1 space-y-8 flex flex-col justify-between">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-gray-200">🪪</div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-900">{req.full_name}</h3>
                                                    <p className="text-sm font-bold text-gray-400">{req.email}</p>
                                                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Manual Audit Required</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-indigo-50/30 rounded-2xl border border-indigo-50 italic">
                                                <p className="text-xs font-bold text-indigo-900/60 leading-relaxed">
                                                    "System flagged this user for manual review. Usually because of an email domain variance or OCR threshold mismatch. Please verify the student identity below."
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => handleVerifyIdCard(req.user_id, 'VERIFIED')} className="flex-1 bg-green-500 text-white font-black py-5 px-8 rounded-2xl shadow-xl shadow-green-100 hover:bg-green-600 active:scale-95 transition-all uppercase tracking-widest text-xs">Validate User</button>
                                            <button onClick={() => handleVerifyIdCard(req.user_id, 'REJECTED')} className="flex-1 bg-white text-red-500 border-2 border-red-50 font-black py-5 px-8 rounded-2xl hover:bg-red-50 active:scale-95 transition-all uppercase tracking-widest text-xs">Flag as Invalid</button>
                                        </div>
                                    </div>
                                    <div className="w-full lg:w-[450px] flex-shrink-0">
                                        <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden border-2 border-gray-50 shadow-inner group cursor-zoom-in" onClick={() => setSelectedDoc(req.id_card_photo || null)}>
                                            {req.id_card_photo ? (
                                                <img src={`http://localhost:4000/${req.id_card_photo}`} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 blur-[2px] group-hover:blur-0" alt="ID Card" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300 font-bold uppercase tracking-tighter text-xs">Payload Missing</div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                <span className="bg-white px-8 py-4 rounded-2xl text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl">Enlarge Preview</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Document Overlay (Modal) */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 animate-fade-in">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedDoc(null)}></div>
                    <div className="relative w-full max-w-6xl bg-[#111] rounded-[48px] shadow-2xl overflow-hidden animate-zoom-in border border-white/10">
                        <div className="absolute top-8 right-8 z-10">
                            <button
                                onClick={() => setSelectedDoc(null)}
                                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center text-3xl hover:scale-110 active:scale-90 transition-all shadow-2xl font-black"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 md:p-12 h-full flex items-center justify-center overflow-auto max-h-[90vh]">
                            {selectedDoc.endsWith('.pdf') ? (
                                <iframe
                                    src={`http://localhost:4000/${selectedDoc}`}
                                    className="w-full h-full min-h-[75vh] rounded-3xl"
                                    title="License PDF"
                                />
                            ) : (
                                <img
                                    src={`http://localhost:4000/${selectedDoc}`}
                                    className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl ring-1 ring-white/20"
                                    alt="Full Document"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Modal (THE "FULL" DASHBOARD VIEW) */}
            {selectedUser && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-8 animate-fade-in uppercase">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)}></div>
                    <div className="relative w-full max-w-6xl bg-white rounded-[40px] shadow-2xl h-[90vh] overflow-y-auto animate-slide-up flex flex-col md:flex-row border-4 border-black">

                        {/* LEFT: INFO SIDEBAR */}
                        <div className="w-full md:w-80 bg-[#111] text-white p-10 flex flex-col items-center flex-shrink-0">
                            <div className="w-40 h-40 rounded-[40px] overflow-hidden border-4 border-white/10 mb-8 flex-shrink-0 shadow-2xl group relative">
                                {selectedUser.profile_photo ? (
                                    <img src={`http://localhost:4000/${selectedUser.profile_photo}`} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-5xl font-black text-white/10">
                                        {selectedUser.full_name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="text-center w-full">
                                <h2 className="text-2xl font-black mb-2 leading-tight">{selectedUser.full_name}</h2>
                                <p className="text-white/40 font-bold text-xs tracking-widest mb-8">{selectedUser.email}</p>

                                <div className="space-y-4 text-left">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Phone</p>
                                        <p className="text-sm font-bold">{selectedUser.phone || 'NOT SET'}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Role</p>
                                        <p className="text-sm font-bold">{selectedUser.role}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Gender</p>
                                        <p className="text-sm font-bold">{selectedUser.gender || 'NOT SPECIFIED'}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Joined</p>
                                        <p className="text-sm font-bold">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {selectedUser.license_expiry_date && (
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">License Expiry</p>
                                            <p className="text-sm font-bold text-amber-400">{new Date(selectedUser.license_expiry_date).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="mt-12 w-full bg-white text-black font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                >
                                    Close Portal ➔
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: DOCUMENTS SECTION */}
                        <div className="flex-1 p-10 md:p-14 bg-white overflow-y-auto">
                            <h3 className="text-3xl font-black mb-10 tracking-tighter">Identity Audit Documents</h3>

                            <div className="grid md:grid-cols-2 gap-10">

                                {/* ID CARD PREVIEW */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-black/40">🪪 College ID Card</p>
                                        <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${selectedUser.id_card_status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                            {selectedUser.id_card_status || 'NOT UPLOADED'}
                                        </span>
                                    </div>
                                    <div className="aspect-[16/10] bg-gray-50 rounded-3xl border-2 border-gray-100 overflow-hidden group cursor-zoom-in relative" onClick={() => setSelectedDoc(selectedUser.id_card_photo!)}>
                                        {selectedUser.id_card_photo ? (
                                            <img src={`http://localhost:4000/${selectedUser.id_card_photo}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="ID" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 p-10 text-center">
                                                <span className="text-4xl mb-4">🪪</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest italic">No image submitted</span>
                                            </div>
                                        )}
                                    </div>
                                    {selectedUser.id_card_status === 'PENDING' && (
                                        <div className="mt-4 flex gap-3">
                                            <button onClick={() => handleVerifyIdCard(selectedUser.user_id, 'VERIFIED')} className="flex-1 bg-green-500 text-white font-black py-3 rounded-xl text-[10px] uppercase">Verify ✅</button>
                                            <button onClick={() => handleVerifyIdCard(selectedUser.user_id, 'REJECTED')} className="flex-1 bg-red-50 text-red-600 font-black py-3 rounded-xl text-[10px] uppercase">Reject ❌</button>
                                        </div>
                                    )}
                                </div>

                                {/* LICENSE PREVIEW */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-black/40">🚗 Driving License</p>
                                        <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${selectedUser.license_status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                            {selectedUser.license_status || 'NOT UPLOADED'}
                                        </span>
                                    </div>
                                    <div className="aspect-[16/10] bg-gray-50 rounded-3xl border-2 border-gray-100 overflow-hidden group cursor-zoom-in relative" onClick={() => setSelectedDoc(selectedUser.license_pdf!)}>
                                        {selectedUser.license_pdf ? (
                                            selectedUser.license_pdf.endsWith('.pdf') ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                    <span className="text-4xl mb-2">📄</span>
                                                    <span className="text-[10px] font-bold uppercase">PDF DOCUMENT</span>
                                                </div>
                                            ) : (
                                                <img src={`http://localhost:4000/${selectedUser.license_pdf}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="License" />
                                            )
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 p-10 text-center">
                                                <span className="text-4xl mb-4">🚗</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest italic">No license on file</span>
                                            </div>
                                        )}
                                    </div>
                                    {selectedUser.license_status === 'PENDING' && (
                                        <div className="mt-4 flex gap-3">
                                            <button onClick={() => handleVerifyStatus(selectedUser.user_id, 'VERIFIED')} className="flex-1 bg-green-500 text-white font-black py-3 rounded-xl text-[10px] uppercase">Verify ✅</button>
                                            <button onClick={() => handleVerifyStatus(selectedUser.user_id, 'REJECTED')} className="flex-1 bg-red-50 text-red-600 font-black py-3 rounded-xl text-[10px] uppercase">Reject ❌</button>
                                        </div>
                                    )}
                                    {selectedUser.license_no && (
                                        <div className="mt-4 p-4 bg-black text-white rounded-2xl">
                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">License No</p>
                                            <p className="text-sm font-black">{selectedUser.license_no}</p>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* ASSETS & REPUTATION */}
                            <div className="mt-16 pt-16 border-t-4 border-gray-50 grid md:grid-cols-2 gap-10">
                                {/* VEHICLES */}
                                <div>
                                    <h4 className="text-xl font-black mb-6 flex items-center gap-3">
                                        <span className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg">🏎️</span>
                                        Registered Vehicles
                                    </h4>
                                    {detailsLoading ? (
                                        <div className="animate-pulse space-y-4">
                                            <div className="h-20 bg-gray-50 rounded-2xl"></div>
                                            <div className="h-20 bg-gray-50 rounded-2xl"></div>
                                        </div>
                                    ) : userDetails.vehicles.length > 0 ? (
                                        <div className="space-y-4">
                                            {userDetails.vehicles.map(v => (
                                                <div key={v.vehicle_id} className="p-5 bg-[#fafafa] rounded-[24px] border border-gray-100 flex items-center justify-between group hover:bg-black hover:text-white transition-all duration-500">
                                                    <div>
                                                        <p className="text-sm font-black">{v.model}</p>
                                                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">{v.vehicle_number}</p>
                                                    </div>
                                                    <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black group-hover:bg-white/20">
                                                        {v.seats} SEATS
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-10 bg-gray-50 rounded-[32px] text-center italic text-gray-400 text-xs font-bold uppercase tracking-widest">
                                            No vehicles on record
                                        </div>
                                    )}
                                </div>

                                {/* RATINGS & REVIEWS */}
                                <div>
                                    <h4 className="text-xl font-black mb-6 flex items-center gap-3">
                                        <span className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-lg">⭐</span>
                                        Reputation & Feedback
                                    </h4>
                                    {detailsLoading ? (
                                        <div className="animate-pulse space-y-4">
                                            <div className="h-24 bg-gray-50 rounded-2xl"></div>
                                        </div>
                                    ) : userDetails.ratings.length > 0 ? (
                                        <div className="space-y-6">
                                            {userDetails.ratings.map(r => (
                                                <div key={r.rating_id} className="relative pl-8 border-l-2 border-gray-100">
                                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-black"></div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-amber-500 font-black text-sm">{"★".repeat(r.rating)}</span>
                                                        <span className="text-gray-200 text-sm">{"★".repeat(5 - r.rating)}</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl italic">"{r.review}"</p>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100">
                                                            {r.rated_by_photo && <img src={`http://localhost:4000/${r.rated_by_photo}`} className="w-full h-full object-cover" />}
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">— {r.rated_by_name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-10 bg-gray-50 rounded-[32px] text-center italic text-gray-400 text-xs font-bold uppercase tracking-widest">
                                            No identity feedback yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
