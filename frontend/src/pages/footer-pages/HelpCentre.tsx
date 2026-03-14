import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const HelpCentre: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            <section className="bg-gray-50 py-24 px-4 border-b border-gray-100">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-black mb-8 tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        How can we <br />
                        <span className="bg-[#f7d302] px-4 py-1 inline-block rotate-1">help?</span>
                    </h1>
                    <div className="relative max-w-2xl mx-auto">
                        <input
                            type="text"
                            placeholder="Search for articles, guides..."
                            className="w-full bg-white border-2 border-black rounded-[32px] px-10 py-6 font-bold text-lg shadow-xl focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all"
                        />
                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
                    </div>
                </div>
            </section>

            <section className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-black text-black mb-12 tracking-tighter">Frequently Asked Questions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { q: "How do I book a ride?", a: "Find your destination using the search bar on the landing page, select a preferred ride, and click 'Confirm Ride'." },
                            { q: "How do I pay?", a: "We support various digital payment methods including UPI and Cards. Payments are secured and handled instantly." },
                            { q: "Is it safe?", a: "Yes, all our drivers and passengers are ID-verified. We also have a community rating system and 24/7 support." },
                            { q: "Can I cancel a booking?", a: "Yes, you can cancel your booking from your dashboard. Refund policies may apply based on the timing of cancellation." }
                        ].map((faq, idx) => (
                            <div key={idx} className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-black text-black mb-4">{faq.q}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default HelpCentre;
