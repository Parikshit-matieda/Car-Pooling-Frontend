import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const [searchData, setSearchData] = useState({
        from: '',
        to: '',
        date: new Date().toISOString().split('T')[0],
        seats: 1
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchData.from) params.append('from', searchData.from);
        if (searchData.to) params.append('to', searchData.to);
        params.append('date', searchData.date);
        params.append('seats', searchData.seats.toString());
        navigate(`/search?${params.toString()}`);
    };

    const categories = [
        { title: 'Daily Commute', icon: '🏢', desc: 'Home to Office', color: 'bg-green-100' },
        { title: 'City to City', icon: '🏙️', desc: 'Intercity travel', color: 'bg-blue-100' },
        { title: 'Weekend Trips', icon: '🏕️', desc: 'Getaways & Tours', color: 'bg-orange-100' },
        { title: 'Airport Drops', icon: '✈️', desc: 'Instant transfers', color: 'bg-purple-100' },
        { title: 'Events & Fun', icon: '🎸', desc: 'Ride to concerts', color: 'bg-pink-100' },
        { title: 'Last Minute', icon: '⚡', desc: 'Instant bookings', color: 'bg-yellow-100' },
    ];

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            {/* Hero & Search Section (Blinkit Style) */}
            <section className="bg-[#f7d302] pb-24 pt-12 px-4">
                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <div className="text-center mb-10 animate-fade-in">
                        <h1 className="text-5xl md:text-7xl font-black text-black mb-4 tracking-tighter leading-none">
                            Ride sharing in <br />
                            <span className="bg-black text-white px-4 py-1 inline-block -rotate-1">minutes</span>
                        </h1>
                        <p className="text-black/60 font-bold text-lg md:text-xl">Fast, safe, and pocket-friendly carpooling.</p>
                    </div>

                    {/* High-Visibility Search Card */}
                    <div className="w-full max-w-5xl bg-white rounded-[32px] shadow-2xl p-2 sm:p-3 animate-slide-in">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch gap-2">
                            <div className="flex-1 flex items-center bg-gray-50 rounded-2xl px-6 py-5 group focus-within:ring-2 focus-within:ring-black/5 transition-all">
                                <span className="text-2xl mr-4 group-focus-within:scale-110 transition-transform">📍</span>
                                <input
                                    type="text"
                                    placeholder="Leaving from..."
                                    value={searchData.from}
                                    className="bg-transparent w-full outline-none font-black text-gray-800 placeholder:text-gray-300 text-lg"
                                    onChange={(e) => setSearchData({ ...searchData, from: e.target.value })}
                                />
                            </div>
                            <div className="flex-1 flex items-center bg-gray-50 rounded-2xl px-6 py-5 group focus-within:ring-2 focus-within:ring-black/5 transition-all">
                                <span className="text-2xl mr-4 group-focus-within:scale-110 transition-transform">🎯</span>
                                <input
                                    type="text"
                                    placeholder="Going to..."
                                    value={searchData.to}
                                    className="bg-transparent w-full outline-none font-black text-gray-800 placeholder:text-gray-300 text-lg"
                                    onChange={(e) => setSearchData({ ...searchData, to: e.target.value })}
                                />
                            </div>
                            <div className="md:w-48 flex items-center bg-gray-50 rounded-2xl px-6 py-5 cursor-pointer hover:bg-gray-100 transition-all">
                                <span className="text-xl mr-3">📅</span>
                                <input
                                    type="date"
                                    value={searchData.date}
                                    className="bg-transparent w-full outline-none font-black text-gray-800 cursor-pointer text-sm"
                                    onChange={(e) => setSearchData({ ...searchData, date: e.target.value })}
                                />
                            </div>
                            <button className="bg-black text-white px-10 py-5 rounded-[24px] font-black text-xl uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 shadow-xl shadow-black/10">
                                Find Ride
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Category Grid (Blinkit Core Style) */}
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-black tracking-tight mb-2">Explore Ride Categories</h2>
                        <p className="text-gray-400 font-bold">Find the perfect ride for every occasion.</p>
                    </div>
                    <button className="text-black font-black text-sm uppercase tracking-widest border-b-2 border-yellow-400 pb-1 hover:text-yellow-600 transition-colors">View all ➔</button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
                    {categories.map((cat, i) => (
                        <div key={i} className="group cursor-pointer">
                            <div className={`${cat.color} rounded-[32px] aspect-square flex items-center justify-center text-5xl mb-4 group-hover:scale-105 transition-all duration-300 shadow-sm border border-black/5`}>
                                {cat.icon}
                            </div>
                            <h4 className="text-center font-black text-gray-900 leading-tight">{cat.title}</h4>
                            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{cat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Instant Benefit Cards */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group">
                        <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:rotate-12 transition-transform">💰</div>
                        <h3 className="text-2xl font-black mb-4">Lowest Prices, Period.</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">Save up to 70% compared to private cabs. We prioritize your pocket above all.</p>
                    </div>
                    <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group">
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:rotate-12 transition-transform">🛡️</div>
                        <h3 className="text-2xl font-black mb-4">Verified Members Only</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">Safety is our priority. Every member is verified with ID and phone checks.</p>
                    </div>
                    <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:rotate-12 transition-transform">⚡</div>
                        <h3 className="text-2xl font-black mb-4">Instant Booking</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">No more waiting for back-and-forth messages. Book your seat in just two taps.</p>
                    </div>
                </div>
            </section>

            {/* Promo Banner Style Offer section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto rounded-[48px] overflow-hidden bg-black text-white relative group">
                    <div className="p-12 md:p-20 relative z-10 md:w-2/3">
                        <div className="bg-yellow-400 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">Driver Benefits</div>
                        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-none">Starting a journey? <br /> Share the cost.</h2>
                        <p className="text-white/60 text-lg md:text-xl font-bold mb-10 leading-relaxed">Publish your ride details and we'll find verified co-travelers for you. It's safe, fast, and pays for your fuel.</p>
                        <Link to="/create-ride" className="bg-[#f7d302] text-black px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-yellow-300 transition-all inline-block shadow-2xl shadow-yellow-400/20">
                            Offer a ride 🚗
                        </Link>
                    </div>
                    <div className="absolute top-0 right-0 w-full h-full md:w-1/2 opacity-30 md:opacity-100 group-hover:scale-105 transition-transform duration-700">
                        <img src="https://images.unsplash.com/photo-1549194388-2469d59ec39e?auto=format&fit=crop&q=80&w=1200" alt="Travel" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
                    </div>
                </div>
            </section>

            {/* Blinkit Inspired Footer */}
            <footer className="bg-gray-50 pt-24 pb-12 px-4 border-t border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                        <div>
                            <div className="text-3xl font-black text-black tracking-tighter mb-8 flex items-center">
                                <span className="mr-1">⚡</span> blink<span className="text-gray-400">ride</span>
                            </div>
                            <p className="text-gray-400 font-bold text-sm leading-relaxed">Redefining intercity travel for the next billion users in India.</p>
                        </div>
                        <div>
                            <h4 className="font-black text-black text-sm uppercase tracking-widest mb-8">Popular Services</h4>
                            <ul className="space-y-4 font-bold text-gray-500 text-sm">
                                <li><a href="#" className="hover:text-black transition-colors">Daily Office Commute</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Intercity Travels</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Airport Shuttles</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Verified Drivers</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-black text-sm uppercase tracking-widest mb-8">Company</h4>
                            <ul className="space-y-4 font-bold text-gray-500 text-sm">
                                <li><a href="#" className="hover:text-black transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Terms of Use</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Careers</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-black text-sm uppercase tracking-widest mb-8">Support</h4>
                            <ul className="space-y-4 font-bold text-gray-500 text-sm">
                                <li><a href="#" className="hover:text-black transition-colors">Help Centre</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Safety Guides</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Contact Us</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">© {new Date().getFullYear()} BLINKRIDE - ALL RIGHTS RESERVED</p>
                        <div className="flex gap-8">
                            <span className="text-xl grayscale hover:grayscale-0 cursor-pointer transition-all">📸</span>
                            <span className="text-xl grayscale hover:grayscale-0 cursor-pointer transition-all">🐦</span>
                            <span className="text-xl grayscale hover:grayscale-0 cursor-pointer transition-all">🏢</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
