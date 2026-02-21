import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Link } from 'react-router-dom';

const AirportShuttles: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            <section className="bg-blue-50 py-24 px-4 overflow-hidden relative">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Premium Service</span>
                    <h1 className="text-6xl md:text-8xl font-black text-black mb-8 tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        Catch your flight <br />
                        <span className="text-blue-600">On Time.</span>
                    </h1>
                    <p className="text-gray-500 font-bold text-xl md:text-2xl max-w-2xl mb-12">
                        Affordable, stress-free rides to and from airports. Never miss a flight again.
                    </p>
                    <Link to="/" className="bg-black text-white px-12 py-5 rounded-[24px] font-black text-xl uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 shadow-xl shadow-black/10 no-underline">
                        Book Airport Ride ➔
                    </Link>
                </div>
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
            </section>

            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="space-y-12">
                        <div className="flex gap-10 items-center">
                            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center text-4xl shrink-0 border border-blue-50">✈️</div>
                            <div>
                                <h3 className="text-2xl font-black mb-2">Airport Specialized</h3>
                                <p className="text-gray-500 font-medium">Drivers familiar with airport layouts and dedicated parking zones for quick pickups.</p>
                            </div>
                        </div>
                        <div className="flex gap-10 items-center">
                            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center text-4xl shrink-0 border border-blue-50">🧭</div>
                            <div>
                                <h3 className="text-2xl font-black mb-2">Live Flight Tracking</h3>
                                <p className="text-gray-500 font-medium">We track your flight status to adjust pickup times in case of delays or early arrivals.</p>
                            </div>
                        </div>
                        <div className="flex gap-10 items-center">
                            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center text-4xl shrink-0 border border-blue-50">🧳</div>
                            <div>
                                <h3 className="text-2xl font-black mb-2">Luggage Space</h3>
                                <p className="text-gray-500 font-medium">Only cars with sufficient boot space are matched for airport shuttle requests.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default AirportShuttles;
