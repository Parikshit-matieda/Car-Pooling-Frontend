import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';


const Navbar: React.FC = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
        navigate('/login');
    };

    // Fetch notifications
    useEffect(() => {
        if (isAuthenticated) {
            const fetchNotifications = async () => {
                try {
                    const res = await api.get('/users/notifications');
                    setNotifications(res.data);
                } catch (err) {
                    console.error('Failed to fetch notifications', err);
                }
            };
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const markAsRead = async (id: number) => {
        try {
            await api.patch(`/users/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
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
                    <Link to="/" className="text-3xl font-black text-black tracking-tighter flex items-center shrink-0 normal-case" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        <span className="mr-1">⚡</span> blink<span className="text-black/60">ride</span>
                    </Link>

                    <Link to="/" className="hidden md:block text-xs font-black uppercase tracking-widest text-black/60 hover:text-black transition-colors ml-4">
                        Home
                    </Link>

                    {isAuthenticated && (
                        <>
                            <Link to="/my-rides" className="hidden md:block text-xs font-black uppercase tracking-widest text-black/60 hover:text-black transition-colors ml-4">
                                My Rides
                            </Link>
                            <Link
                                to="/my-rides"
                                state={{ tab: 'TAKEN', activeTab: 'ACTIVE', autoTrack: true }}
                                className="hidden md:block text-xs font-black uppercase tracking-widest text-black/60 hover:text-black transition-colors ml-4"
                            >
                                Track My Ride
                            </Link>
                            <Link
                                to="/my-rides"
                                state={{ tab: 'TAKEN', activeTab: 'HISTORY' }}
                                className="hidden md:flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-black/60 hover:text-black transition-colors ml-4"
                            >
                                <span>⭐</span> Reviews &amp; Ratings
                            </Link>
                        </>
                    )}
                </div>



                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            {/* Notification Bell */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                                    className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center text-xl hover:bg-black/10 transition-colors relative"
                                >
                                    🔔
                                    {unreadCount > 0 && (
                                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#f7d302]"></span>
                                    )}
                                </button>

                                {isNotifOpen && (
                                    <div className="absolute right-[-50px] md:right-0 mt-4 w-[calc(100vw-32px)] sm:w-80 bg-white rounded-[32px] shadow-2xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in duration-200 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                                            <h3 className="font-black text-sm text-black uppercase tracking-widest">Notifications</h3>
                                            {unreadCount > 0 && <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-gray-400">
                                                    <p className="text-[10px] font-black uppercase tracking-widest">No notifications</p>
                                                </div>
                                            ) : (
                                                notifications.map((n) => (
                                                    <div
                                                        key={n.notification_id}
                                                        onClick={() => markAsRead(n.notification_id)}
                                                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${n.is_read ? 'opacity-50' : 'bg-yellow-50/50'}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="text-lg mt-0.5">📢</div>
                                                            <div>
                                                                <p className={`text-xs ${n.is_read ? 'font-bold text-gray-600' : 'font-black text-black'}`}>{n.message}</p>
                                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Profile Dropdown */}
                            <div className="relative hidden md:block" ref={dropdownRef}>
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
                        </>
                    ) : (
                        <div className="hidden md:flex items-center gap-2">
                            <Link to="/login" className="px-5 py-2.5 text-black font-black text-sm hover:underline">Login</Link>
                            <Link to="/register" className="bg-black text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black/80 transition-all shadow-lg shadow-black/10">Sign Up</Link>
                        </div>
                    )}

                    {/* Publish Ride button (desktop only) */}
                    <Link to="/create-ride" className="hidden md:flex flex-col items-center justify-center bg-[#0c831f] text-white px-6 py-2.5 rounded-xl hover:bg-[#0c831f]/90 transition-all shadow-lg shadow-green-900/10">
                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none opacity-80">Make money</span>
                        <span className="text-xs font-black uppercase tracking-widest leading-none mt-1">Publish Ride</span>
                    </Link>

                    {/* Hamburger Menu Button (mobile only) */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden w-10 h-10 bg-black/5 rounded-full flex flex-col items-center justify-center gap-1.5 hover:bg-black/10 transition-colors"
                        aria-label="Toggle menu"
                    >
                        <span className={`block w-5 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                        <span className={`block w-5 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                        <span className={`block w-5 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {isMobileMenuOpen && (
                <div ref={mobileMenuRef} className="md:hidden bg-[#f7d302] border-t border-black/10 px-4 pb-6 pt-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    <Link
                        to="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest text-black hover:bg-black/10 transition-colors"
                    >
                        🏠 Home
                    </Link>

                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/my-rides"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest text-black hover:bg-black/10 transition-colors"
                            >
                                🚗 My Rides
                            </Link>
                            <Link
                                to="/my-rides"
                                state={{ tab: 'TAKEN', activeTab: 'ACTIVE', autoTrack: true }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest text-black hover:bg-black/10 transition-colors"
                            >
                                📍 Track My Ride
                            </Link>
                            <Link
                                to="/my-rides"
                                state={{ tab: 'TAKEN', activeTab: 'HISTORY' }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest text-black hover:bg-black/10 transition-colors"
                            >
                                ⭐ Reviews &amp; Ratings
                            </Link>

                            <div className="h-px bg-black/10 my-2"></div>

                            <Link
                                to="/profile"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest text-black hover:bg-black/10 transition-colors"
                            >
                                👤 My Profile
                            </Link>
                            <Link
                                to="/dashboard"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest text-black hover:bg-black/10 transition-colors"
                            >
                                📊 Dashboard
                            </Link>
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    navigate('/profile', { state: { openVehicles: true } });
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest text-black hover:bg-black/10 transition-colors"
                            >
                                🚗 Add a Vehicle
                            </button>

                            <div className="h-px bg-black/10 my-2"></div>

                            <Link
                                to="/create-ride"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest bg-[#0c831f] text-white hover:bg-[#0c831f]/90 transition-colors"
                            >
                                💰 Publish Ride
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest text-red-700 hover:bg-red-50/30 transition-colors"
                            >
                                🚪 Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="h-px bg-black/10 my-2"></div>
                            <Link
                                to="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest text-black hover:bg-black/10 transition-colors"
                            >
                                🔑 Login
                            </Link>
                            <Link
                                to="/register"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest bg-black text-white hover:bg-black/80 transition-colors"
                            >
                                Sign Up
                            </Link>
                            <Link
                                to="/create-ride"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest bg-[#0c831f] text-white hover:bg-[#0c831f]/90 transition-colors"
                            >
                                💰 Publish Ride
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
