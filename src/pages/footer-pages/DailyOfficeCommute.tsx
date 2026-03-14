import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Link } from 'react-router-dom';

const DailyOfficeCommute: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            <section className="bg-[#f7d302] py-24 px-4">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <span className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Service</span>
                    <h1 className="text-5xl md:text-7xl font-black text-black mb-8 tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        Daily Office <br />
                        <span className="bg-white text-black px-4 py-1 inline-block -rotate-1">Commute</span>
                    </h1>
                    <p className="text-black/60 font-bold text-lg md:text-xl max-w-2xl mb-12">
                        Turn your boring daily commute into a social, cost-saving journey. Find colleagues and neighbors heading your way.
                    </p>
                    <Link to="/" className="bg-black text-white px-12 py-5 rounded-[24px] font-black text-xl uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 shadow-xl shadow-black/10 no-underline">
                        Find a commute ➔
                    </Link>
                </div>
            </section>

            <section className="py-24 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-8">🗓️</div>
                            <h3 className="text-2xl font-black mb-4">Recurring Rides</h3>
                            <p className="text-gray-500 font-medium leading-relaxed">Set up your schedule once and we'll match you with the same group every day.</p>
                        </div>
                        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mb-8">🏢</div>
                            <h3 className="text-2xl font-black mb-4">Verified Workplaces</h3>
                            <p className="text-gray-500 font-medium leading-relaxed">Filter matches by company or tech park to travel with verified professionals.</p>
                        </div>
                        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl">
                            <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-3xl mb-8">💰</div>
                            <h3 className="text-2xl font-black mb-4">Cost Sharing</h3>
                            <p className="text-gray-500 font-medium leading-relaxed">Drivers cover fuel costs, and riders save massive amounts on monthly cab bills.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default DailyOfficeCommute;
