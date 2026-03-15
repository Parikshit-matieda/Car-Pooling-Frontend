import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Link } from 'react-router-dom';

const IntercityTravels: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            <section className="bg-black text-white py-24 px-4 overflow-hidden relative">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="md:w-1/2">
                        <span className="bg-[#f7d302] text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">Service</span>
                        <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            City to City <br />
                            <span className="text-[#f7d302]">Simplified.</span>
                        </h1>
                        <p className="text-white/60 font-bold text-xl md:text-2xl max-w-md mb-12">
                            Comfortable long-distance journeys at the price of a bus ticket.
                        </p>
                        <Link to="/" className="bg-[#f7d302] text-black px-12 py-5 rounded-[24px] font-black text-xl uppercase tracking-widest hover:bg-yellow-300 transition-all active:scale-95 shadow-xl shadow-yellow-400/10 no-underline">
                            Search Intercity ➔
                        </Link>
                    </div>
                    <div className="md:w-1/2 p-4 grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-sm">
                            <h3 className="text-4xl font-black mb-2">500+</h3>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cities Covered</p>
                        </div>
                        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-sm mt-8">
                            <h3 className="text-4xl font-black mb-2">24/7</h3>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Availability</p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[#f7d302]/5 rounded-full blur-[150px]"></div>
            </section>

            <section className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-black text-black mb-16 tracking-tighter text-center">Why travel intercity with us?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50 p-12 rounded-[48px] border border-gray-100 flex gap-8 items-start">
                            <div className="text-5xl">🛋️</div>
                            <div>
                                <h3 className="text-2xl font-black mb-4">Ultimate Comfort</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">Avoid the crowds of buses and trains. Enjoy a comfortable seat in a private car with like-minded travelers.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-12 rounded-[48px] border border-gray-100 flex gap-8 items-start">
                            <div className="text-5xl">🛡️</div>
                            <div>
                                <h3 className="text-2xl font-black mb-4">Secure & Sorted</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">Door-to-door or hub-to-hub, you choose. Every driver is verified and every trip is tracked.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default IntercityTravels;
