import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const ContactUs: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            <section className="bg-[#f7d302] py-24 px-4 overflow-hidden relative">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-16 relative z-10">
                    <div>
                        <h1 className="text-6xl md:text-8xl font-black text-black mb-8 tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            Get in <br />
                            <span className="bg-black text-white px-6 py-2 inline-block -rotate-1">touch</span>
                        </h1>
                        <p className="text-black/70 font-bold text-xl md:text-2xl max-w-md">
                            Have questions or feedback? We'd love to hear from you.
                        </p>
                    </div>

                    <div className="bg-white p-10 rounded-[48px] shadow-2xl border border-black/5">
                        <form className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Name</label>
                                    <input type="text" placeholder="Your Name" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#f7d302] rounded-3xl px-6 py-4 font-bold outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Email</label>
                                    <input type="email" placeholder="Email Address" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#f7d302] rounded-3xl px-6 py-4 font-bold outline-none transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Subject</label>
                                <select className="w-full bg-gray-50 border-2 border-transparent focus:border-[#f7d302] rounded-3xl px-6 py-4 font-bold outline-none transition-all appearance-none cursor-pointer">
                                    <option>General Inquiry</option>
                                    <option>Support Request</option>
                                    <option>Safety Issue</option>
                                    <option>Partnership</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Message</label>
                                <textarea rows={4} placeholder="How can we help?" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#f7d302] rounded-3xl px-6 py-4 font-bold outline-none transition-all resize-none"></textarea>
                            </div>
                            <button className="w-full bg-black text-white py-6 rounded-[32px] font-black text-lg uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 shadow-xl shadow-black/10">
                                Send Message ➔
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <section className="py-24 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="text-center">
                        <div className="text-4xl mb-6">📍</div>
                        <h3 className="text-xl font-black mb-2">Our Office</h3>
                        <p className="text-gray-500 font-bold">Changa, Gujarat, India</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-6">📧</div>
                        <h3 className="text-xl font-black mb-2">Support Email</h3>
                        <p className="text-gray-500 font-bold">poolingcar1@gmail.com</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-6">📱</div>
                        <h3 className="text-xl font-black mb-2">Emergency Hub</h3>
                        <p className="text-gray-500 font-bold">+91 8200818728 <br />+91 8799244585</p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ContactUs;
