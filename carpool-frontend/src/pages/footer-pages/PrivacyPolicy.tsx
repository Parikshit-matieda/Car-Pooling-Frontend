import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            <section className="bg-black text-white py-24 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        Privacy <br />
                        <span className="bg-[#f7d302] text-black px-4 py-1 inline-block rotate-1">Policy</span>
                    </h1>
                    <p className="text-white/60 font-bold text-lg md:text-xl">
                        Your data security is our top priority.
                    </p>
                </div>
            </section>

            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <h2 className="text-3xl font-black text-black mb-6 uppercase tracking-tight">1. Information We Collect</h2>
                        <p className="mb-8">
                            We collect information you provide directly to us when you create an account, such as your name, email address, phone number, and government-issued ID for verification purposes.
                        </p>

                        <h2 className="text-3xl font-black text-black mb-6 uppercase tracking-tight">2. How We Use Your Data</h2>
                        <p className="mb-8">
                            We use the information to facilitate ride connections, process payments, verify identities, and improve our services. We never sell your personal information to third parties.
                        </p>

                        <h2 className="text-3xl font-black text-black mb-6 uppercase tracking-tight">3. Data Security</h2>
                        <p className="mb-12">
                            We use industry-standard encryption and security measures to protect your data from unauthorized access, alteration, or destruction.
                        </p>

                        <div className="bg-[#f7d302]/10 p-10 rounded-[40px] border border-[#f7d302]/20">
                            <h3 className="text-xl font-black text-black mb-4">Questions?</h3>
                            <p className="text-black/80">If you have any questions about this Privacy Policy, please contact us at privacy@blinkride.com</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
