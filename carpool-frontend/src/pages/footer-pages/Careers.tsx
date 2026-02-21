import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Careers: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            <section className="bg-[#f7d302] py-24 px-4 overflow-hidden relative">
                <div className="max-w-7xl mx-auto relative z-10">
                    <h1 className="text-6xl md:text-8xl font-black text-black mb-8 tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        Build the <br />
                        <span className="bg-black text-white px-6 py-2 inline-block -rotate-1">Future</span>
                    </h1>
                    <p className="text-black/70 font-bold text-xl md:text-2xl max-w-2xl">
                        Join us in solving India's mobility challenges. We're looking for passionate individuals to join our rocket ship.
                    </p>
                </div>
                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/20 rounded-full blur-[100px]"></div>
            </section>

            <section className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-black text-black mb-16 tracking-tighter">Open Positions</h2>
                    <div className="grid gap-6">
                        {[
                            { title: 'Frontend Engineer', team: 'Engineering', location: 'Remote / Bangalore' },
                            { title: 'Product Manager', team: 'Product', location: 'Remote' },
                            { title: 'Operations Lead', team: 'Operations', location: 'Mumbai' },
                            { title: 'Safety Analyst', team: 'Trust & Safety', location: 'Delhi / NCR' }
                        ].map((job, idx) => (
                            <div key={idx} className="group bg-gray-50 p-8 rounded-[32px] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between hover:bg-black hover:text-white transition-all cursor-pointer">
                                <div>
                                    <h3 className="text-2xl font-black mb-2">{job.title}</h3>
                                    <div className="flex gap-4 text-sm font-bold opacity-60">
                                        <span>{job.team}</span>
                                        <span>•</span>
                                        <span>{job.location}</span>
                                    </div>
                                </div>
                                <button className="mt-6 md:mt-0 px-8 py-3 bg-[#f7d302] text-black rounded-2xl font-black text-xs uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-colors">
                                    Apply Now ➔
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Careers;
