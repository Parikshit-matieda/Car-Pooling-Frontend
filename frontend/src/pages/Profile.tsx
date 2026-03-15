import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';

interface Vehicle {
    vehicle_id: number;
    vehicle_number: string;
    model: string;
    seats: number;
}

const Profile: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState<'about' | 'vehicles'>('about');

    const [newVehicle, setNewVehicle] = useState({
        model: '',
        vehicle_number: '',
        seats: 4
    });

    useEffect(() => {
        fetchVehicles();

        // Handle redirect from Navbar to open vehicle form
        if (location.state?.openVehicles) {
            setActiveTab('vehicles');
            setIsAdding(true);
        }
    }, [location.state]);

    const fetchVehicles = async () => {
        try {
            const res = await api.get('/vehicles/my');
            setVehicles(res.data);
        } catch (err) {
            console.error('Failed to fetch vehicles', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const res = await api.post('/vehicles', newVehicle);
            setVehicles([res.data, ...vehicles]);
            setSuccess('Vehicle added successfully!');

            // Redirect back if we came from ride creation flow
            if (location.state?.from === '/create-ride') {
                setSuccess('Vehicle added! Redirecting you back to your ride draft...');
                setTimeout(() => {
                    navigate('/create-ride');
                }, 1500);
                return;
            }

            setTimeout(() => setSuccess(''), 3000);
            setIsAdding(false);
            setNewVehicle({ model: '', vehicle_number: '', seats: 4 });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add vehicle');
        }
    };

    const handleDeleteVehicle = async (id: number) => {
        try {
            await api.delete(`/vehicles/${id}`);
            setVehicles(vehicles.filter(v => v.vehicle_id !== id));
        } catch (err) {
            console.error('Failed to delete vehicle', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5]">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Navigation (Blinkit High Contrast) */}
                    <div className="md:w-72 flex-none">
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm mb-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-24 h-24 bg-[#f7d302] rounded-[32px] mb-4 flex items-center justify-center text-black text-4xl font-black shadow-inner overflow-hidden">
                                    {(user as any)?.profile_photo ? (
                                        <img
                                            src={`http://localhost:5000/${(user as any).profile_photo}`}
                                            alt={user?.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        user?.full_name?.charAt(0)
                                    )}
                                </div>
                                <h1 className="text-2xl font-black text-black text-center">{user?.full_name}</h1>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{user?.role} Member</span>
                            </div>

                            <nav className="space-y-1">
                                <button
                                    onClick={() => setActiveTab('about')}
                                    className={`w-full text-left px-5 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center gap-3 ${activeTab === 'about' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'} `}
                                >
                                    <span className="text-xl">👤</span>
                                    Account Info
                                </button>
                                <button
                                    onClick={() => setActiveTab('vehicles')}
                                    className={`w-full text-left px-5 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center gap-3 ${activeTab === 'vehicles' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'} `}
                                >
                                    <span className="text-xl">🚗</span>
                                    My Vehicles
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 bg-white rounded-[40px] border border-gray-100 p-8 md:p-12 shadow-sm animate-fade-in">
                        {activeTab === 'about' && (
                            <div>
                                <h2 className="text-4xl font-black text-black mb-10 tracking-tight">Account Basics</h2>
                                <div className="space-y-10">
                                    <div className="pb-8 border-b border-gray-50">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Display Name</p>
                                        <p className="text-xl font-black text-gray-800">{user?.full_name}</p>
                                    </div>
                                    <div className="pb-8 border-b border-gray-50">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</p>
                                        <div className="flex items-center gap-3">
                                            <p className="text-xl font-black text-gray-800">{user?.email}</p>
                                            {user?.email_verified && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold uppercase">Verified</span>}
                                        </div>
                                    </div>
                                    <div className="pb-8 border-b border-gray-50">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</p>
                                        <p className="text-xl font-black text-gray-800">{user?.phone || 'Not provided'}</p>
                                    </div>

                                    {(user as any)?.gender && (
                                        <div className="pb-8 border-b border-gray-50">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Gender</p>
                                            <p className="text-xl font-black text-gray-800 flex items-center gap-2">
                                                <span>{(user as any).gender === 'MALE' ? '♂' : (user as any).gender === 'FEMALE' ? '♀' : (user as any).gender === 'OTHER' ? '⚧' : '🔒'}</span>
                                                {(user as any).gender === 'PREFER_NOT_TO_SAY' ? 'Prefer Not to Say' : (user as any).gender.charAt(0) + (user as any).gender.slice(1).toLowerCase()}
                                            </p>
                                        </div>
                                    )}

                                    {/* ID Card Status */}
                                    <div className="pb-8 border-b border-gray-50">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">🪪 ID Card Status</p>
                                        {(() => {
                                            const status = (user as any)?.id_card_status;
                                            if (status === 'VERIFIED') return <span className="inline-flex items-center gap-1.5 text-sm font-black text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">✅ Verified</span>;
                                            if (status === 'PENDING') return <span className="inline-flex items-center gap-1.5 text-sm font-black text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">⏳ Pending Review</span>;
                                            if (status === 'REJECTED') return <span className="inline-flex items-center gap-1.5 text-sm font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">❌ Rejected — Re-upload required</span>;
                                            return <span className="text-sm font-bold text-gray-400 italic">Not uploaded</span>;
                                        })()}
                                    </div>

                                    {!loading && vehicles.length === 0 && (
                                        <div className="bg-[#f7d302]/10 p-8 rounded-[32px] border border-[#f7d302]/20 flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div>
                                                <h4 className="text-lg font-black text-black mb-1 leading-none">Ready to start driving?</h4>
                                                <p className="text-xs font-bold text-black/50 tracking-tight mt-1">Add your vehicle details now to start offering rides.</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('vehicles');
                                                    setIsAdding(true);
                                                }}
                                                className="bg-[#f7d302] text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-yellow-400/10 whitespace-nowrap"
                                            >
                                                Add Vehicle ➔
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'vehicles' && (
                            <div>
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-4xl font-black text-black tracking-tight">Vehicles</h2>
                                    {!isAdding && (
                                        <button
                                            onClick={() => setIsAdding(true)}
                                            className="bg-black text-white font-black text-[10px] uppercase tracking-widest py-3 px-6 rounded-2xl transition-all shadow-lg hover:bg-black/80"
                                        >
                                            + Add New
                                        </button>
                                    )}
                                </div>

                                {isAdding ? (
                                    <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 animate-slide-in">
                                        <h3 className="text-xl font-black text-gray-800 mb-8">Vehicle Details</h3>
                                        <form onSubmit={handleAddVehicle} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">Manufacturer & Model</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Maruti Swift"
                                                        value={newVehicle.model}
                                                        onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                                        className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-yellow-100 outline-none font-black transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">License Plate No.</label>
                                                    <input
                                                        type="text"
                                                        placeholder="GJ 01 XX 0000"
                                                        value={newVehicle.vehicle_number}
                                                        onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })}
                                                        className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-yellow-100 outline-none font-black transition-all"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">Maximum Passengers</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={newVehicle.seats}
                                                    onChange={(e) => setNewVehicle({ ...newVehicle, seats: parseInt(e.target.value) })}
                                                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-yellow-100 outline-none font-black transition-all"
                                                    required
                                                />
                                            </div>

                                            {error && <p className="text-red-500 text-xs font-bold bg-white p-4 rounded-2xl border border-red-50">⚠️ {error}</p>}
                                            {success && <p className="text-green-500 text-xs font-bold bg-white p-4 rounded-2xl border border-green-50">✓ {success}</p>}

                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAdding(false)}
                                                    className="flex-1 py-4 bg-white text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="flex-[2] py-4 bg-[#f7d302] text-black font-black rounded-2xl shadow-xl shadow-yellow-100 hover:scale-[1.02] transition-all uppercase tracking-widest text-xs"
                                                >
                                                    Save Vehicle
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {loading ? (
                                            <div className="text-center py-20">
                                                <div className="w-10 h-10 border-4 border-yellow-100 border-t-black rounded-full animate-spin mx-auto"></div>
                                            </div>
                                        ) : vehicles.length === 0 ? (
                                            <div className="bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100 p-20 text-center opacity-70">
                                                <p className="text-6xl mb-6">🚘</p>
                                                <p className="font-black text-gray-400">Add a vehicle to offer your first ride</p>
                                            </div>
                                        ) : (
                                            vehicles.map((v) => (
                                                <div key={v.vehicle_id} className="group bg-gray-50 p-6 rounded-[24px] border border-gray-100 flex items-center justify-between hover:border-[#f7d302] transition-all animate-fade-in">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl group-hover:rotate-6 transition-transform shadow-sm">
                                                            🏎️
                                                        </div>
                                                        <div>
                                                            <h5 className="text-xl font-black text-gray-800 leading-none mb-2">{v.model}</h5>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-black text-black bg-[#f7d302] px-2 py-1 rounded-md uppercase tracking-widest">
                                                                    {v.vehicle_number}
                                                                </span>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-gray-50">
                                                                    👥 {v.seats} Seats
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteVehicle(v.vehicle_id)}
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        title="Delete vehicle"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
