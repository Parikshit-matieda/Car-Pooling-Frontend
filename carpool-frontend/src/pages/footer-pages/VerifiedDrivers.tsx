import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Link } from 'react-router-dom';

const VerifiedDrivers: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            <section className="bg-gray-50 py-24 px-4 border-b border-gray-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="md:w-1/2">
                        <span className="bg-[#f7d302] text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">Security</span>
                        <h1 className="text-6xl md:text-8xl font-black text-black mb-8 tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            Trust is <br />
                            <span className="bg-black text-white px-4 py-1 inline-block -rotate-1">Verified.</span>
                        </h1>
                        <p className="text-gray-500 font-bold text-xl md:text-2xl max-w-md mb-12">
                            Every single driver on our platform goes through a 4-step verification process.
                        </p>
                    </div>
                    <div className="md:w-1/2 relative">
                        <div className="bg-white p-12 rounded-[64px] shadow-2xl border border-gray-100 relative z-10">
                            <div className="space-y-10">
                                {[
                                    { title: "ID Verification", desc: "Government-issued ID and address proof check." },
                                    { title: "License Audit", desc: "Valid and clean driving license verification." },
                                    { title: "Vehicle Check", desc: "Registration and insurance document validation." },
                                    { title: "Profile Quality", desc: "Phone and email verification with a mandatory profile photo." }
                                ].map((step, idx) => (
                                    <div key={idx} className="flex gap-6 items-center">
                                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center font-black">✓</div>
                                        <div>
                                            <h4 className="font-black text-black">{step.title}</h4>
                                            <p className="text-xs font-bold text-gray-400">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-full h-full bg-[#f7d302] rounded-[64px] -z-10"></div>
                    </div>
                </div>
            </section>

            <section className="py-24 px-4 bg-black text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-black mb-8 tracking-tighter">Ready to join the elite group?</h2>
                    <p className="text-white/60 font-bold text-lg mb-10">Become a verified driver today and start earning on your travels.</p>
                    <Link to="/upload-license" className="bg-[#f7d302] text-black px-12 py-5 rounded-[24px] font-black text-xl uppercase tracking-widest hover:bg-yellow-300 transition-all active:scale-95 no-underline inline-block">
                        Get Verified ➔
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default VerifiedDrivers;
