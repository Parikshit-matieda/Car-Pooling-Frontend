import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white pt-24 pb-12 px-4 border-t-4 border-[#f7d302]">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                    <div>
                        <Link to="/" className="text-3xl font-black text-black tracking-tighter mb-8 flex items-center normal-case no-underline" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            <span className="mr-1">⚡</span> blink<span className="text-black">ride</span>
                        </Link>
                        <p className="text-gray-400 font-bold text-sm leading-relaxed">Redefining intercity travel for the next billion users in India.</p>
                    </div>
                    <div>
                        <h4 className="font-black text-black text-sm uppercase tracking-widest mb-8">Popular Services</h4>
                        <ul className="space-y-4 font-bold text-gray-500 text-sm list-none p-0">
                            <li><Link to="/services/daily-commute" className="hover:text-black transition-colors no-underline">Daily Office Commute</Link></li>
                            <li><Link to="/services/intercity" className="hover:text-black transition-colors no-underline">Intercity Travels</Link></li>
                            <li><Link to="/services/airport-shuttles" className="hover:text-black transition-colors no-underline">Airport Shuttles</Link></li>
                            <li><Link to="/services/verified-drivers" className="hover:text-black transition-colors no-underline">Verified Drivers</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-black text-black text-sm uppercase tracking-widest mb-8">Company</h4>
                        <ul className="space-y-4 font-bold text-gray-500 text-sm list-none p-0">
                            <li><Link to="/about" className="hover:text-black transition-colors no-underline">About Us</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-black transition-colors no-underline">Privacy Policy</Link></li>
                            <li><Link to="/terms-of-use" className="hover:text-black transition-colors no-underline">Terms of Use</Link></li>
                            <li><Link to="/careers" className="hover:text-black transition-colors no-underline">Careers</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-black text-black text-sm uppercase tracking-widest mb-8">Support</h4>
                        <ul className="space-y-4 font-bold text-gray-500 text-sm list-none p-0">
                            <li><Link to="/help-centre" className="hover:text-black transition-colors no-underline">Help Centre</Link></li>
                            <li><Link to="/safety-guides" className="hover:text-black transition-colors no-underline">Safety Guides</Link></li>
                            <li><Link to="/contact-us" className="hover:text-black transition-colors no-underline">Contact Us</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-200 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">© {new Date().getFullYear()} blinkride - ALL RIGHTS RESERVED</p>
                    <div className="flex gap-8">
                        <span className="text-xl grayscale hover:grayscale-0 cursor-pointer transition-all">📸</span>
                        <span className="text-xl grayscale hover:grayscale-0 cursor-pointer transition-all">🐦</span>
                        <span className="text-xl grayscale hover:grayscale-0 cursor-pointer transition-all">🏢</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
