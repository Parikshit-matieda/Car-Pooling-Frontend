import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import { useNavigate } from 'react-router-dom';

interface Location {
    lat: number;
    lng: number;
    address: string;
}

interface Stop {
    latitude: number;
    longitude: number;
    city_name: string;
}

interface Ride {
    ride_id: number;
    source: string;
    destination: string;
    source_lat: number;
    source_lng: number;
    dest_lat: number;
    dest_lng: number;
    ride_date: string;
    ride_time: string;
    base_price: string;
    available_seats: number;
    driver_id: number;
    driver_name: string;
    profile_image: string;
    driver_phone: string;
    driver_join_date: string;
    driver_rating: number;
    driver_rating_count: number;
    vehicle_make: string;
    vehicle_model: string;
    route_polyline: string;
    booking_type: 'INSTANT' | 'APPROVAL';
    stops: Stop[];
}

const SearchRides: React.FC = () => {
    const navigate = useNavigate();
    // Search inputs
    const [pickup, setPickup] = useState<Location | null>(null);
    const [dropoff, setDropoff] = useState<Location | null>(null);
    const [date, setDate] = useState('');
    const [seats, setSeats] = useState(1);

    // UI state
    const [searchPickup, setSearchPickup] = useState('');
    const [searchDropoff, setSearchDropoff] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchingFor, setSearchingFor] = useState<'pickup' | 'dropoff' | null>(null);

    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState<{ text: string, type: 'SUCCESS' | 'PENDING' } | null>(null);
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [confirmingRide, setConfirmingRide] = useState<Ride | null>(null);


    // Initial search from URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const fromParam = params.get('from');
        const toParam = params.get('to');
        const dateParam = params.get('date');
        const seatsParam = params.get('seats');

        if (dateParam) setDate(dateParam);
        if (seatsParam) setSeats(parseInt(seatsParam));

        if (fromParam) {
            setSearchPickup(fromParam);
            performSearch(fromParam, 'pickup');
        }
        if (toParam) {
            setSearchDropoff(toParam);
            performSearch(toParam, 'dropoff');
        }
    }, []);

    // Debounced search for Pickup
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchPickup.length >= 3) {
                performSearch(searchPickup, 'pickup');
            } else {
                if (searchingFor === 'pickup') setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchPickup]);

    // Debounced search for Dropoff
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchDropoff.length >= 3) {
                performSearch(searchDropoff, 'dropoff');
            } else {
                if (searchingFor === 'dropoff') setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchDropoff]);

    const performSearch = async (query: string, type: 'pickup' | 'dropoff') => {
        setSearchingFor(type);
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
            const data = await res.json();
            setSearchResults(data.map((item: any) => ({
                id: item.place_id,
                name: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon)
            })));
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setIsSearching(false);
        }
    };

    const fetchRides = async () => {
        if (!pickup || !dropoff) return;
        setLoading(true);
        setError('');
        setSuccessMessage(null);
        try {
            const res = await api.get('/rides/search', {
                params: {
                    source_lat: pickup.lat,
                    source_lng: pickup.lng,
                    dest_lat: dropoff.lat,
                    dest_lng: dropoff.lng,
                    ride_date: date || undefined,
                    seats_needed: seats
                }
            });
            setRides(res.data);
            console.log('Rides Data:', res.data);
            if (res.data.length === 0) {
                setError('No rides found matching your route. Try adjusting your search area.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleBookRide = (ride: Ride) => {
        setConfirmingRide(ride);
    };

    const executeBooking = async (ride: Ride) => {
        setConfirmingRide(null);
        setLoading(true);
        setError('');
        try {
            await api.post('/bookings', {
                ride_id: ride.ride_id,
                seats_booked: seats,
                amount: parseFloat(ride.base_price) * seats,
                payment_method: 'CARD' // Default for now
            });

            const isApproval = ride.booking_type === 'APPROVAL';
            if (isApproval) {
                setSuccessMessage({
                    text: `Your request has been sent. Waiting for approval of publishers.`,
                    type: 'PENDING'
                });
            } else {
                setSuccessMessage({
                    text: `Success! You've booked ${seats} seat(s) for your trip.`,
                    type: 'SUCCESS'
                });
            }
            // Refresh results
            fetchRides();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setLoading(false);
        }
    };

    const formatJoinDate = (dateString: string) => {
        const joinDate = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - joinDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) return `Joined ${diffDays} days ago`;
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `Joined ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
        const diffYears = Math.floor(diffMonths / 12);
        return `Joined ${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans">
            <Navbar />

            {/* Search Header (Blinkit High Contrast) Centered */}
            <div className="bg-[#f7d302] border-b border-black/5 p-6 md:p-8 sticky top-20 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Pickup From</label>
                            <input
                                type="text"
                                value={searchPickup}
                                onChange={(e) => setSearchPickup(e.target.value)}
                                placeholder="Starting City..."
                                className="w-full px-5 py-4 bg-white/40 border border-black/5 focus:bg-white rounded-2xl outline-none font-black transition-all text-sm placeholder:text-black/20"
                            />
                            {isSearching && searchingFor === 'pickup' && (
                                <div className="absolute right-4 top-[38px]">
                                    <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
                                </div>
                            )}
                            {searchingFor === 'pickup' && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    {searchResults.map(r => (
                                        <button key={r.id} onClick={() => { setPickup({ lat: r.lat, lng: r.lon, address: r.name }); setSearchPickup(r.name); setSearchResults([]); }} className="w-full text-left px-5 py-3.5 hover:bg-[#f7d302]/20 font-black transition-all border-b border-gray-50 last:border-none flex items-center gap-3 text-xs text-gray-700">
                                            <span className="truncate">{r.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Going To</label>
                            <input
                                type="text"
                                value={searchDropoff}
                                onChange={(e) => setSearchDropoff(e.target.value)}
                                placeholder="Destination..."
                                className="w-full px-5 py-4 bg-white/40 border border-black/5 focus:bg-white rounded-2xl outline-none font-black transition-all text-sm placeholder:text-black/20"
                            />
                            {isSearching && searchingFor === 'dropoff' && (
                                <div className="absolute right-4 top-[38px]">
                                    <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
                                </div>
                            )}
                            {searchingFor === 'dropoff' && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    {searchResults.map(r => (
                                        <button key={r.id} onClick={() => { setDropoff({ lat: r.lat, lng: r.lon, address: r.name }); setSearchDropoff(r.name); setSearchResults([]); }} className="w-full text-left px-5 py-3.5 hover:bg-[#f7d302]/20 font-black transition-all border-b border-gray-50 last:border-none flex items-center gap-3 text-xs text-gray-700">
                                            <span className="truncate">{r.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Journey Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-5 py-4 bg-white/40 border border-black/5 focus:bg-white rounded-2xl outline-none font-black transition-all text-sm cursor-pointer" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Passengers</label>
                            <div className="flex items-center bg-white/40 border border-black/5 rounded-2xl px-2 h-[52px]">
                                <button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-10 h-10 flex items-center justify-center font-black hover:bg-black/10 rounded-xl transition-colors">－</button>
                                <span className="flex-1 text-center font-black text-sm">{seats}</span>
                                <button onClick={() => setSeats(Math.min(6, seats + 1))} className="w-10 h-10 flex items-center justify-center font-black hover:bg-black/10 rounded-xl transition-colors">＋</button>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={fetchRides}
                        disabled={!pickup || !dropoff || loading}
                        className={`px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all h-[52px] mt-auto shadow-xl ${(!pickup || !dropoff || loading) ? 'bg-black/20 text-black/30 cursor-not-allowed shadow-none' : 'bg-black text-white hover:bg-gray-900 shadow-black/10 active:scale-95'}`}
                    >
                        {loading ? 'Finding...' : 'Find Rides'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-12 px-4">
                {/* Search Results Centered Layout */}
                <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                    {error && <div className="bg-red-50 text-red-600 p-8 rounded-[32px] font-black text-xs uppercase tracking-widest border border-red-100 text-center animate-shake">🚫 {error}</div>}


                    {successMessage && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                            <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden border border-black/5 animate-zoom-in">
                                <div className={`p-16 text-center ${successMessage.type === 'PENDING' ? 'bg-amber-50' : 'bg-green-50'}`}>
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-10 shadow-2xl ${successMessage.type === 'PENDING' ? 'bg-amber-400' : 'bg-green-500 text-white'}`}>
                                        {successMessage.type === 'PENDING' ? '⏳' : '✅'}
                                    </div>
                                    <h3 className="text-4xl font-[1000] text-black mb-6 uppercase tracking-tighter leading-none">
                                        {successMessage.type === 'PENDING' ? 'Request <br/>Received' : 'Ride <br/>Confirmed'}
                                    </h3>
                                    <p className="text-xl font-black text-gray-600 mb-10 leading-relaxed max-w-xs mx-auto">
                                        {successMessage.type === 'PENDING'
                                            ? 'Please wait for the publisher to approve your ride.'
                                            : successMessage.text}
                                    </p>
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className="w-full py-6 bg-black text-white rounded-[32px] font-black text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-black/20"
                                        >
                                            View Dashboard ➔
                                        </button>
                                        <button
                                            onClick={() => setSuccessMessage(null)}
                                            className="w-full py-6 bg-gray-100 text-gray-400 rounded-[32px] font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-black text-[8px] font-black text-center py-4 text-white/20 uppercase tracking-[0.5em]">BLINKRIDE SECURE BOOKING SYSTEM</div>
                            </div>
                        </div>
                    )}

                    {!loading && rides.length === 0 && !error && (
                        <div className="text-center py-32 opacity-20">
                            <span className="text-9xl mb-8 block">🔍</span>
                            <p className="text-lg font-black uppercase tracking-widest leading-relaxed">Enter pickup & destination<br />to see available rides</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {rides.map(ride => (
                            <div
                                key={ride.ride_id}
                                onMouseEnter={() => setActiveRide(ride)}
                                className={`p-8 md:p-10 rounded-[48px] border-2 transition-all cursor-pointer group ${activeRide?.ride_id === ride.ride_id ? 'border-black bg-white shadow-2xl scale-[1.02]' : 'border-black/5 hover:border-black/10 bg-white shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start mb-10">
                                    <div className="flex items-center gap-6">
                                        <div
                                            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${ride.driver_id}`); }}
                                            className="w-20 h-20 bg-[#f7d302] rounded-[28px] overflow-hidden border-2 border-white shadow-lg shadow-yellow-100 flex items-center justify-center text-black font-black text-2xl cursor-pointer hover:scale-105 transition-transform"
                                        >
                                            {ride.profile_image ? (
                                                <img
                                                    src={ride.profile_image.startsWith('http') ? ride.profile_image : `http://${window.location.hostname}:4000/${ride.profile_image}`}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.driver_name)}&background=f7d302&color=000&bold=true`; }}
                                                />
                                            ) : ride.driver_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Verified Driver</p>
                                            <p
                                                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${ride.driver_id}`); }}
                                                className="font-black text-black text-2xl leading-none mb-1.5 hover:text-yellow-500 cursor-pointer transition-colors flex items-center gap-2 uppercase tracking-tighter"
                                            >
                                                {ride.driver_name}
                                                <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest transition-opacity">View Profile ➔</span>
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-[10px] font-black text-black/60">{formatJoinDate(ride.driver_join_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Fare</p>
                                        <p className="text-4xl font-black text-black tracking-tight">₹{Math.floor(parseFloat(ride.base_price))}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-6 relative pl-10 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 before:rounded-full">
                                        <div className="relative">
                                            <div className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-4 border-[#f7d302] bg-white shadow-sm"></div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Boarding Point</p>
                                            <p className="text-base font-black text-gray-700">{ride.source}</p>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-black shadow-sm"></div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dropping Point</p>
                                            <p className="text-base font-black text-gray-700">{ride.destination}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-[32px] p-6 flex flex-col justify-center gap-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Departure</span>
                                            <span className="text-sm font-black text-black">{ride.ride_time}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Availability</span>
                                            <span className="text-sm font-black text-black">{ride.available_seats} Seats Left</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</span>
                                            <span className="text-sm font-black text-black">{ride.vehicle_make} {ride.vehicle_model}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-100 flex items-center justify-between gap-4">
                                    {confirmingRide?.ride_id === ride.ride_id ? (
                                        <>
                                            <div className="flex items-center">
                                                <span className="text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border text-amber-600 bg-amber-50 border-amber-100 flex items-center gap-1">
                                                    ⚡ APPROVAL BOOKING
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-12">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setConfirmingRide(null); }}
                                                    className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] hover:text-black transition-colors"
                                                >
                                                    Go Back
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); executeBooking(ride); }}
                                                    disabled={loading}
                                                    className={`px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl bg-black text-white hover:scale-105 shadow-black/20 whitespace-nowrap ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    CONFIRM RIDE ✨
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex flex-wrap gap-2">
                                                {ride.stops.length > 0 && (
                                                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-100">
                                                        +{ride.stops.length} Major Stops
                                                    </span>
                                                )}
                                                <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${ride.booking_type === 'APPROVAL' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-green-600 bg-green-50 border-green-100'}`}>
                                                    {ride.booking_type === 'APPROVAL' ? '👤 Approval Required' : '⚡ Instant Booking'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleBookRide(ride); }}
                                                disabled={loading || ride.available_seats < seats}
                                                className={`px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl whitespace-nowrap ${loading || ride.available_seats < seats ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-black text-white hover:scale-105 shadow-black/20'}`}
                                            >
                                                {ride.available_seats < seats ? 'FULLY BOOKED' : (ride.booking_type === 'APPROVAL' ? 'REQUEST SEAT ➔' : 'CONFIRM RIDE ✨')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchRides;
