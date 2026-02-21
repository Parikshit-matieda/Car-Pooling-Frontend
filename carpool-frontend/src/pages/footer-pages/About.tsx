import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const About: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            <section className="bg-[#f7d302] py-24 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-black mb-6 tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        About <br />
                        <span className="bg-black text-white px-4 py-1 inline-block -rotate-1">blinkride</span>
                    </h1>
                    <p className="text-black/60 font-bold text-lg md:text-xl max-w-2xl mx-auto">
                        We're on a mission to redefine intercity travel in India through safe, sustainable, and affordable carpooling.
                    </p>
                </div>
            </section>

            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto prose prose-xl">
                    <h2 className="text-4xl font-black text-black tracking-tighter mb-8">Our Vision</h2>
                    <p className="text-gray-600 text-lg leading-relaxed mb-12">
                        Blinkride was born out of a simple observation: millions of cars travel between Indian cities every day with empty seats, while millions of travelers struggle with expensive cabs or crowded public transport. We decided to bridge this gap.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                        <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-100">
                            <h3 className="text-2xl font-black text-black mb-4">Sustainability</h3>
                            <p className="text-gray-500">By filling empty seats, we reduce the number of vehicles on the road, lowering CO2 emissions and congestion.</p>
                        </div>
                        <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-100">
                            <h3 className="text-2xl font-black text-black mb-4">Affordability</h3>
                            <p className="text-gray-500">Sharing costs makes premium travel accessible to everyone. Drivers save on fuel, and riders save on fares.</p>
                        </div>
                    </div>

                    <h2 className="text-4xl font-black text-black tracking-tighter mb-8">Safety First</h2>
                    <p className="text-gray-600 text-lg leading-relaxed mb-12">
                        Trust is the cornerstone of our community. Every member on Blinkride undergoes a rigorous verification process, including ID checks and phone verification. Our rating system ensures that the community remains high-quality and reliable.
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
