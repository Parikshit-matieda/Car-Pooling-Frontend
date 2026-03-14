import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="bg-[#f7d302] sticky top-0 z-50 border-b border-black/5 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">

                {/* Logo Section */}
                <div className="flex items-center gap-8">
                    <Link to="/" className="text-3xl font-black text-black tracking-tighter flex items-center shrink-0">
                        <span className="mr-1">⚡</span> blink<span className="text-black/60">ride</span>
                    </Link>

                    {/* Quick Location / Context (Blinkit Style) */}
                    <div className="hidden lg:flex flex-col border-l border-black/10 pl-6 h-10 justify-center">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-black/40 leading-none">Riding to</span>
                        <div className="flex items-center text-sm font-black text-black group cursor-pointer leading-tight">
                            Select Location <span className="ml-1 text-[10px] group-hover:translate-y-0.5 transition-transform">▼</span>
                        </div>
                    </div>
                </div>

                {/* Search Bar Placeholder (Blinkit Style) */}
                <div className="flex-1 max-w-2xl relative group hidden sm:block">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 text-lg">🔍</div>
                    <input
                        type="text"
                        placeholder='Search "Mumbai to Pune" or "Daily Commute"'
                        className="w-full bg-white/40 border border-black/5 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-black/5 font-bold text-sm transition-all placeholder:text-black/30"
                    />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black/80 transition-all shadow-lg shadow-black/10"
                            >
                                {user?.full_name?.split(' ')[0]}
                                <span className="text-[8px] opacity-40">▼</span>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-[60] animate-in fade-in zoom-in duration-200">
                                    <div className="px-5 py-3 border-b border-gray-50 mb-2">
                                        <p className="text-sm font-black text-black">{user?.full_name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user?.role}</p>
                                    </div>
                                    <div className="px-2">
                                        <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-[#f7d302]/20 rounded-xl transition-all">
                                            <span>👤</span> My Profile
                                        </Link>
                                        <Link to="/dashboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-[#f7d302]/20 rounded-xl transition-all">
                                            <span>📊</span> Dashboard
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                navigate('/profile', { state: { openVehicles: true } });
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-[#f7d302]/20 rounded-xl transition-all"
                                        >
                                            <span>🚗</span> Add a Vehicle
                                        </button>
                                        <div className="h-px bg-gray-50 my-2 mx-2"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <span>🚪</span> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login" className="px-5 py-2.5 text-black font-black text-sm hover:underline">Login</Link>
                            <Link to="/register" className="bg-black text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black/80 transition-all shadow-lg shadow-black/10">Sign Up</Link>
                        </div>
                    )}

                    {/* Cart-style "Publish" button for Blinkit energy */}
                    <Link to="/create-ride" className="hidden md:flex flex-col items-center justify-center bg-[#0c831f] text-white px-6 py-2.5 rounded-xl hover:bg-[#0c831f]/90 transition-all shadow-lg shadow-green-900/10">
                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none opacity-80">Make money</span>
                        <span className="text-xs font-black uppercase tracking-widest leading-none mt-1">Publish Ride</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
