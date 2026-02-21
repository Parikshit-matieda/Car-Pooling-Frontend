import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const SafetyGuides: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            <section className="bg-red-50 py-24 px-4 border-b border-red-100">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-black mb-6 tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        Safety <br />
                        <span className="bg-black text-white px-4 py-1 inline-block -rotate-1">Guides</span>
                    </h1>
                    <p className="text-red-900/60 font-bold text-lg md:text-xl">
                        Your safety is our absolute priority. Here's how we keep the community secure.
                    </p>
                </div>
            </section>

            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto space-y-20">
                    <div>
                        <h2 className="text-4xl font-black text-black tracking-tighter mb-8 flex items-center gap-4">
                            <span className="w-12 h-12 bg-[#f7d302] rounded-2xl flex items-center justify-center text-2xl">🛡️</span>
                            For Passengers
                        </h2>
                        <ul className="space-y-6 text-gray-600 list-none p-0">
                            {[
                                "Always check the driver's profile and ratings before booking.",
                                "Verify the car's plate number and model before getting in.",
                                "Share your live trip status with friends or family.",
                                "Trust your instincts. If something feels off, you can cancel the trip."
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-4 font-bold items-start">
                                    <span className="text-black shrink-0">0{idx + 1}.</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-4xl font-black text-black tracking-tighter mb-8 flex items-center gap-4">
                            <span className="w-12 h-12 bg-black text-[#f7d302] rounded-2xl flex items-center justify-center text-2xl">🚗</span>
                            For Drivers
                        </h2>
                        <ul className="space-y-6 text-gray-600 list-none p-0">
                            {[
                                "Ensure your vehicle is in good condition for long travels.",
                                "Respect traffic rules and maintain a safe speed.",
                                "Communicate clearly with passengers about pickup points.",
                                "Keep your profile updated with a clear photo and car details."
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-4 font-bold items-start">
                                    <span className="text-black shrink-0">0{idx + 1}.</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default SafetyGuides;
