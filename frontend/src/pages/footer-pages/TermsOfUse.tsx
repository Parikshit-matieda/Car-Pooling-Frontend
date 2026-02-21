import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const TermsOfUse: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            <section className="bg-gray-100 py-24 px-4 border-b border-gray-200">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-black mb-6 tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        Terms of <br />
                        <span className="bg-black text-white px-4 py-1 inline-block -rotate-1">Use</span>
                    </h1>
                    <p className="text-gray-500 font-bold text-lg md:text-xl">
                        Please read these terms carefully before using our platform.
                    </p>
                </div>
            </section>

            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto prose prose-lg">
                    <h2 className="text-3xl font-black text-black mb-6">1. Acceptance of Terms</h2>
                    <p className="mb-8">
                        By accessing or using Blinkride, you agree to be bound by these Terms of Use and all applicable laws and regulations.
                    </p>

                    <h2 className="text-3xl font-black text-black mb-6">2. User Eligibility</h2>
                    <p className="mb-8">
                        You must be at least 18 years old and have a valid government-issued ID to use our services. Drivers must also possess a valid driving license.
                    </p>

                    <h2 className="text-3xl font-black text-black mb-6">3. Community Guidelines</h2>
                    <p className="mb-12">
                        Respect, punctuality, and safety are mandatory. We reserve the right to suspend accounts that violate our community standards.
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default TermsOfUse;
