import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import api from '../api';

interface Location {
    lat: number;
    lng: number;
    address: string;
    city?: string;
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
    driver_name: string;
    profile_image: string;
    driver_id: number;
    driver_phone: string;
    driver_join_date: string;
    driver_rating: number;
    driver_rating_count: number;
    vehicle_make: string;
    vehicle_model: string;
    booking_type: 'INSTANT' | 'APPROVAL';
    stops: Stop[];
}

interface Template {
    template_id: number;
    source: string;
    destination: string;
    source_lat: number;
    source_lng: number;
    dest_lat: number;
    dest_lng: number;
    ride_time: string;
    base_price: string;
    total_seats: number;
    vehicle_id: number;
    vehicle_model: string;
    vehicle_number: string;
    booking_type: 'INSTANT' | 'APPROVAL';
    route_polyline: string;
    stops: any[];
}






const CITY_COORDS: Record<string, { lat: number, lng: number }> = {
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Vadodara': { lat: 22.3072, lng: 73.1812 },
    'Nadiad': { lat: 22.6916, lng: 72.8634 },
    'Anand': { lat: 22.5645, lng: 72.9289 },
    'Kheda': { lat: 22.7520, lng: 72.6856 },
    'CHARUSAT': { lat: 22.5996, lng: 72.8205 }
};

interface Vehicle {
    vehicle_id: number;
    model: string;
    vehicle_number: string;
    seats: number;
}

const Landing: React.FC = () => {

    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [pickup, setPickup] = useState<Location | null>(null);
    const [dropoff, setDropoff] = useState<Location | null>(null);
    const [searchPickup, setSearchPickup] = useState('');
    const [searchDropoff, setSearchDropoff] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [seats, setSeats] = useState(1);

    // UI & Data state
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchingFor, setSearchingFor] = useState<'pickup' | 'dropoff' | null>(null);
    const [locationResults, setLocationResults] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState<{ text: string, type: 'SUCCESS' | 'PENDING' | 'WAITING' } | null>(null);
    const [activeRideId, setActiveRideId] = useState<number | null>(null);
    const [confirmingRide, setConfirmingRide] = useState<Ride | null>(null);

    // Activity Center state
    const [myRides, setMyRides] = useState<any[]>([]);
    const [myBookings, setMyBookings] = useState<any[]>([]);

    const [todayRides, setTodayRides] = useState<Ride[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
    const [templateVehicles, setTemplateVehicles] = useState<Record<number, number>>({});
    const [templateDates, setTemplateDates] = useState<Record<number, string>>({});
    const [templateTimes, setTemplateTimes] = useState<Record<number, string>>({});
    const [activityLoading, setActivityLoading] = useState(false);


    const [todayLoading, setTodayLoading] = useState(false);



    // Handle redirection state for license upload
    useEffect(() => {
        if (location.state?.licenseUploaded) {
            setSuccessMessage({
                text: 'Waiting for approval of admin. You will be notified once verified.',
                type: 'WAITING'
            });
            // Clear state to prevent showing it again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Fetch user activity if logged in
    useEffect(() => {
        if (isAuthenticated) {
            fetchActivity();
            fetchTemplates();
            fetchVehicles();
        }

        fetchTodayRides();
    }, [isAuthenticated]);


    const fetchTodayRides = async () => {
        setTodayLoading(true);
        try {
            // Fetch live rides
            const res = await api.get('/rides/today');
            const allRides = res.data;

            setTodayRides(allRides);

        } catch (err) {
            console.error('Failed to fetch today rides', err);
        } finally {
            setTodayLoading(false);
        }
    };

    const fetchActivity = async () => {
        setActivityLoading(true);
        try {
            const [ridesRes, bookingsRes] = await Promise.allSettled([
                api.get('/rides/my-rides'),
                api.get('/bookings/my-bookings')
            ]);

            if (ridesRes.status === 'fulfilled') {
                setMyRides(ridesRes.value.data.slice(0, 3));
            }
            if (bookingsRes.status === 'fulfilled') {
                setMyBookings(bookingsRes.value.data.slice(0, 3));
            }
        } catch (err) {
            console.error('Failed to fetch activity', err);
        } finally {
            setActivityLoading(false);
        }
    };

    const fetchTemplates = async () => {
        if (!isAuthenticated) return;
        try {
            const res = await api.get('/templates/my');
            setTemplates(res.data);
        } catch (err) {
            console.error('Failed to fetch templates', err);
        }
    };

    const fetchVehicles = async () => {
        try {
            const res = await api.get('/vehicles/my');
            setMyVehicles(res.data);
        } catch (err) {
            console.error('Failed to fetch vehicles', err);
        }
    };



    const handleQuickPublish = async (template: Template) => {
        const selectedVehicleId = templateVehicles[template.template_id] || template.vehicle_id;
        const selectedVehicle = myVehicles.find(v => v.vehicle_id === selectedVehicleId);

        const selectedDate = templateDates[template.template_id] || new Date().toISOString().split('T')[0];
        const selectedTime = templateTimes[template.template_id] || template.ride_time;

        const confirmPublish = window.confirm(`Do you want to publish this ride for ${selectedDate} at ${selectedTime} using ${selectedVehicle?.model || 'selected vehicle'}?`);
        if (!confirmPublish) return;

        setLoading(true);
        try {
            await api.post('/rides', {
                source: template.source,
                destination: template.destination,
                source_lat: template.source_lat,
                source_lng: template.source_lng,
                dest_lat: template.dest_lat,
                dest_lng: template.dest_lng,
                ride_date: selectedDate,
                ride_time: selectedTime,
                total_seats: selectedVehicle?.seats || template.total_seats,
                vehicle_id: selectedVehicleId,
                base_price: parseFloat(template.base_price),
                route_polyline: template.route_polyline,
                stops: template.stops.map(s => ({
                    city_name: s.city_name,
                    latitude: s.latitude,
                    longitude: s.longitude,
                    stop_order: s.stop_order,
                    stop_price: parseFloat(s.stop_price)
                })),
                booking_type: template.booking_type
            });



            setSuccessMessage({
                text: 'Ride published successfully for today!',
                type: 'SUCCESS'
            });
            fetchTodayRides();
            fetchActivity();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Quick publish failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (templateId: number) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await api.delete(`/templates/${templateId}`);
            fetchTemplates();
        } catch (err) {
            console.error('Failed to delete template', err);
        }
    };




    // Debounced search for Pickup
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchPickup.length >= 3 && (!pickup || searchPickup !== pickup.address)) {
                performLocationSearch(searchPickup, 'pickup');
            } else {
                if (searchingFor === 'pickup') setLocationResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchPickup, pickup]);

    // Debounced search for Dropoff
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchDropoff.length >= 3 && (!dropoff || searchDropoff !== dropoff.address)) {
                performLocationSearch(searchDropoff, 'dropoff');
            } else {
                if (searchingFor === 'dropoff') setLocationResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchDropoff, dropoff]);

    const performLocationSearch = async (query: string, type: 'pickup' | 'dropoff') => {
        setSearchingFor(type);
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`);
            const data = await res.json();
            setLocationResults(data.map((item: any) => ({
                id: item.place_id,
                name: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                city: item.address?.city || item.address?.town || item.address?.village || item.address?.state_district || item.address?.county
            })));
        } catch (err) {
            console.error('Location search failed', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent, overridePickup?: Location, overrideDropoff?: Location) => {
        if (e) e.preventDefault();

        const searchPickupLoc = overridePickup || pickup;
        const searchDropoffLoc = overrideDropoff || dropoff;

        if (!searchPickupLoc || !searchDropoffLoc) {
            setError('Please select both pickup and destination cities from the suggestions.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage(null);
        try {
            const res = await api.get('/rides/search', {
                params: {
                    source_lat: searchPickupLoc.lat,
                    source_lng: searchPickupLoc.lng,
                    dest_lat: searchDropoffLoc.lat,
                    dest_lng: searchDropoffLoc.lng,
                    ride_date: date || undefined,
                    seats_needed: seats,
                    // Send extracted city names for smarter text-based matching
                    source_city: searchPickupLoc.city || searchPickupLoc.address.split(',')[0].trim(),
                    dest_city: searchDropoffLoc.city || searchDropoffLoc.address.split(',')[0].trim()
                }
            });
            setRides(res.data);
            if (res.data.length === 0) {
                setError('No rides found matching your route. Try adjusting your search area.');
            }
            // Scroll to results
            window.scrollTo({ top: 600, behavior: 'smooth' });
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
                payment_method: 'CARD'
            });

            const isApproval = ride.booking_type === 'APPROVAL';
            if (isApproval) {
                setSuccessMessage({
                    text: 'Your request has been sent. Waiting for approval of publishers.',
                    type: 'PENDING'
                });
            } else {
                setSuccessMessage({
                    text: `Success! You've booked ${seats} seat(s) for your trip. Check your Activity Center below.`,
                    type: 'SUCCESS'
                });
            }

            // Refresh search results to update seats count
            handleSearch();
            // Refresh activity center to show the new booking
            fetchActivity();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setLoading(false);
        }
    };

    const formatJoinDate = (dateString: string) => {
        if (!dateString) return 'Member';
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
        <div className="min-h-screen bg-white font-sans selection:bg-yellow-200">
            <Navbar />

            {/* Hero & Search Section (Blinkit Style) */}
            <section className="bg-[#f7d302] pb-32 pt-12 px-4">
                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <div className="text-center mb-10 animate-fade-in">
                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-black mb-6 tracking-tighter leading-[0.9]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            Share Together <br />
                            <span className="bg-black text-white px-4 sm:px-6 py-2 inline-block -rotate-2 rounded-xl sm:rounded-2xl transform origin-center mt-2 shadow-xl border-4 border-black">Ride Together</span>
                        </h1>
                        <p className="text-black/60 font-bold text-lg md:text-2xl max-w-2xl mx-auto px-4">Fast, safe, and pocket-friendly carpooling for Gujarat.</p>
                    </div>

                    {/* High-Visibility Search Card */}
                    <div className="w-full max-w-5xl bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl p-2 sm:p-3 animate-slide-in relative mx-auto">
                        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-stretch gap-2">
                            <div className="flex-1 relative">
                                <div className="flex items-center bg-gray-50 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 group focus-within:ring-2 focus-within:ring-black/5 transition-all">
                                    <span className="text-xl sm:text-2xl mr-3 sm:mr-4 group-focus-within:scale-110 transition-transform">📍</span>
                                    <input
                                        type="text"
                                        placeholder="From"
                                        value={searchPickup}
                                        className="bg-transparent w-full outline-none font-black text-gray-800 placeholder:text-gray-300 text-base sm:text-lg"
                                        onChange={(e) => setSearchPickup(e.target.value)}
                                        onFocus={() => setSearchingFor('pickup')}
                                    />
                                </div>
                                {searchingFor === 'pickup' && locationResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {locationResults.map(r => (
                                            <button key={r.id} type="button" onClick={() => { setPickup({ lat: r.lat, lng: r.lon, address: r.name }); setSearchPickup(r.name); setLocationResults([]); }} className="w-full text-left px-5 py-3.5 hover:bg-[#f7d302]/20 font-black transition-all border-b border-gray-50 last:border-none flex items-center gap-3 text-xs text-gray-700">
                                                <span className="truncate">{r.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {isSearching && <div className="absolute top-1/2 right-4 -translate-y-1/2 w-4 h-4 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>}
                            </div>

                            <div className="flex-1 relative">
                                <div className="flex items-center bg-gray-50 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 group focus-within:ring-2 focus-within:ring-black/5 transition-all">
                                    <span className="text-xl sm:text-2xl mr-3 sm:mr-4 group-focus-within:scale-110 transition-transform">🎯</span>
                                    <input
                                        type="text"
                                        placeholder="To"
                                        value={searchDropoff}
                                        className="bg-transparent w-full outline-none font-black text-gray-800 placeholder:text-gray-300 text-base sm:text-lg"
                                        onChange={(e) => setSearchDropoff(e.target.value)}
                                        onFocus={() => setSearchingFor('dropoff')}
                                    />
                                </div>
                                {searchingFor === 'dropoff' && locationResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {locationResults.map(r => (
                                            <button key={r.id} type="button" onClick={() => { setDropoff({ lat: r.lat, lng: r.lon, address: r.name }); setSearchDropoff(r.name); setLocationResults([]); }} className="w-full text-left px-5 py-3.5 hover:bg-[#f7d302]/20 font-black transition-all border-b border-gray-50 last:border-none flex items-center gap-3 text-xs text-gray-700">
                                                <span className="truncate">{r.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="lg:w-48 flex items-center bg-gray-50 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 cursor-pointer hover:bg-gray-100 transition-all">
                                <span className="text-lg sm:text-xl mr-2 sm:mr-3">📅</span>
                                <input
                                    type="date"
                                    value={date}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="bg-transparent w-full outline-none font-black text-gray-800 cursor-pointer text-xs sm:text-sm"
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>

                            <div className="lg:w-32 flex items-center bg-gray-50 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 cursor-pointer hover:bg-gray-100 transition-all">
                                <span className="text-lg sm:text-xl mr-2 sm:mr-3">👥</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="8"
                                    value={seats}
                                    className="bg-transparent w-full outline-none font-black text-gray-800 cursor-pointer text-xs sm:text-sm"
                                    onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
                                />
                            </div>

                            <button type="submit" className="bg-black text-white px-8 sm:px-10 py-5 rounded-xl sm:rounded-[24px] font-black text-lg sm:text-xl uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 shadow-xl shadow-black/10">
                                {loading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Find Ride'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>





            {/* City Commute Templates (Compact & Yellow) */}
            <section className="pt-2 pb-12 px-4 bg-[#f7d302] relative z-20">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-end gap-4 mb-8">
                        <h2 className="text-3xl font-[1000] text-black tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            Quick <span className="text-white">Commute</span>
                        </h2>
                        <p className="text-black/60 font-bold uppercase tracking-widest text-[10px] mb-1.5">Tap a route to see rides instantly</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { name: 'Ahmedabad' },
                            { name: 'Vadodara' },
                            { name: 'Nadiad' },
                            { name: 'Anand' },
                            { name: 'Kheda' }
                        ].map((city) => (
                            <div key={city.name} className="bg-white rounded-[24px] p-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all group">
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-sm font-black text-black">{city.name}</h3>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            const charusatLoc = { ...CITY_COORDS['CHARUSAT'], address: 'CHARUSAT Campus, Changa' };
                                            const cityLoc = { ...CITY_COORDS[city.name], address: city.name };

                                            setPickup(charusatLoc);
                                            setDropoff(cityLoc);
                                            setSearchPickup('CHARUSAT Campus, Changa');
                                            setSearchDropoff(city.name);

                                            handleSearch(undefined, charusatLoc, cityLoc);
                                        }}
                                        className="w-full py-2 bg-gray-50 hover:bg-[#f7d302] rounded-xl font-black text-[9px] text-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                                    >
                                        From Campus ➔
                                    </button>
                                    <button
                                        onClick={() => {
                                            const charusatLoc = { ...CITY_COORDS['CHARUSAT'], address: 'CHARUSAT Campus, Changa' };
                                            const cityLoc = { ...CITY_COORDS[city.name], address: city.name };

                                            setPickup(cityLoc);
                                            setDropoff(charusatLoc);
                                            setSearchPickup(city.name);
                                            setSearchDropoff('CHARUSAT Campus, Changa');

                                            handleSearch(undefined, cityLoc, charusatLoc);
                                        }}
                                        className="w-full py-2 bg-gray-50 hover:bg-[#f7d302] rounded-xl font-black text-[9px] text-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                                    >
                                        To Campus ➔
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Ride Templates Section for Publishers */}

            {isAuthenticated && templates.length > 0 && (
                <section className="py-12 px-4 bg-gray-50 border-b border-gray-100 animate-slide-in">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row items-end gap-3 mb-8">
                            <h2 className="text-3xl font-[1000] text-black tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                Your Ride <span className="text-[#f7d302] stroke-black" style={{ WebkitTextStroke: '1px black' }}>Templates</span>
                            </h2>
                            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-1.5">Quick publish your daily routes</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.map((template) => (
                                <div key={template.template_id} className="bg-white p-6 rounded-[32px] border border-black/5 hover:border-[#f7d302] hover:shadow-xl transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#f7d302]/10 rounded-xl flex items-center justify-center text-xl group-hover:bg-[#f7d302] transition-colors">
                                                ⭐️
                                            </div>
                                            <div>
                                                <p className="font-black text-black text-sm">{template.source.split(',')[0]} ➔ {template.destination.split(',')[0]}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{template.ride_time}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTemplate(template.template_id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                            title="Delete Template"
                                        >
                                            <span className="text-xl">×</span>
                                        </button>
                                    </div>

                                    {/* Vehicle Selection */}
                                    <div className="mb-6 grid grid-cols-1 gap-4">
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Vehicle</p>
                                            <select
                                                value={templateVehicles[template.template_id] || template.vehicle_id}
                                                onChange={(e) => setTemplateVehicles({ ...templateVehicles, [template.template_id]: parseInt(e.target.value) })}
                                                className="w-full bg-gray-50 border border-black/5 rounded-xl px-4 py-2 text-[10px] font-black outline-none focus:border-[#f7d302] transition-colors"
                                            >
                                                {myVehicles.map(v => (
                                                    <option key={v.vehicle_id} value={v.vehicle_id}>
                                                        {v.model} ({v.vehicle_number})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Date</p>
                                                <input
                                                    type="date"
                                                    value={templateDates[template.template_id] || new Date().toISOString().split('T')[0]}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => setTemplateDates({ ...templateDates, [template.template_id]: e.target.value })}
                                                    className="w-full bg-gray-50 border border-black/5 rounded-xl px-3 py-2 text-[9px] font-black outline-none focus:border-[#f7d302] transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Time</p>
                                                <input
                                                    type="time"
                                                    value={templateTimes[template.template_id] || template.ride_time}
                                                    onChange={(e) => setTemplateTimes({ ...templateTimes, [template.template_id]: e.target.value })}
                                                    className="w-full bg-gray-50 border border-black/5 rounded-xl px-3 py-2 text-[9px] font-black outline-none focus:border-[#f7d302] transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>



                                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Price</span>
                                            <span className="text-lg font-black text-black">₹{template.base_price}</span>
                                        </div>
                                        <button
                                            onClick={() => handleQuickPublish(template)}
                                            disabled={loading}
                                            className="px-6 py-3 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#f7d302] hover:text-black transition-all shadow-lg active:scale-95"
                                        >
                                            {loading ? '...' : 'Publish for Today ➔'}
                                        </button>
                                    </div>

                                    {/* Decorative background element */}
                                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#f7d302]/5 rounded-full blur-2xl group-hover:bg-[#f7d302]/10 transition-all"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Results Section */}
            {(rides.length > 0 || error || successMessage) && (

                <section className="py-20 bg-gray-50 border-y border-gray-100" id="results">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h2 className="text-4xl font-black text-black tracking-tighter">Available Rides</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-2">Found {rides.length} options for your trip</p>
                            </div>
                        </div>

                        {error && <div className="bg-red-50 text-red-600 p-8 rounded-[32px] font-black text-xs uppercase tracking-widest border border-red-100 text-center mb-8">🚫 {error}</div>}


                        <div className="space-y-6">
                            {rides.map(ride => (
                                <div
                                    key={ride.ride_id}
                                    onClick={() => setActiveRideId(ride.ride_id)}
                                    className={`p-8 md:p-10 rounded-[48px] border-2 transition-all cursor-pointer group ${activeRideId === ride.ride_id ? 'border-black bg-white shadow-2xl scale-[1.02]' : 'border-black/5 hover:border-black/10 bg-white shadow-sm'}`}
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
                                                    className="font-black text-black text-2xl leading-none mb-1.5 hover:text-yellow-500 cursor-pointer transition-colors flex items-center gap-2"
                                                >
                                                    {ride.driver_name}
                                                    <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">View Profile ➔</span>
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[10px] font-bold text-gray-400">{formatJoinDate(ride.driver_join_date)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Fare</p>
                                            <p className="text-4xl font-black text-black tracking-tight">₹{ride.base_price}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                        <div className="space-y-6 relative pl-10 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 before:rounded-full">
                                            <div className="relative">
                                                <div className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-[#f7d302] shadow-sm"></div>
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
                                        <div className="flex flex-wrap gap-2">
                                            {ride.stops.length > 0 && (
                                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-100">
                                                    +{ride.stops.length} Major Stops
                                                </span>
                                            )}
                                            {confirmingRide?.ride_id === ride.ride_id ? (
                                                <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border text-amber-600 bg-amber-50 border-amber-100 italic`}>
                                                    ⚡ Approval Booking
                                                </span>
                                            ) : (
                                                <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${ride.booking_type === 'APPROVAL' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-green-600 bg-green-50 border-green-100'}`}>
                                                    {ride.booking_type === 'APPROVAL' ? '👤 Approval Required' : '⚡ Instant Booking'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {confirmingRide?.ride_id === ride.ride_id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setConfirmingRide(null); }}
                                                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
                                                >
                                                    Go Back
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); confirmingRide?.ride_id === ride.ride_id ? executeBooking(ride) : handleBookRide(ride); }}
                                                disabled={loading || ride.available_seats < seats}
                                                className={`px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl whitespace-nowrap ${loading || ride.available_seats < seats ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-black text-white hover:scale-105 shadow-black/20'}`}
                                            >
                                                {ride.available_seats < seats ? 'Fully Booked' : (confirmingRide?.ride_id === ride.ride_id ? 'Confirm Ride ✨' : (ride.booking_type === 'APPROVAL' ? 'Request Seat ➔' : 'Confirm Ride ✨'))}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}


            {/* Rides Happening Today Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                        <div>
                            <h2 className="text-4xl font-[1000] text-black tracking-tighter leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                Happening <span className="text-[#f7d302] stroke-black" style={{ WebkitTextStroke: '1px black' }}>Today</span>
                            </h2>
                            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Active journeys starting in the next few hours</p>
                        </div>
                    </div>

                    {todayLoading ? (
                        <div className="py-20 flex justify-center">
                            <div className="w-12 h-12 border-4 border-gray-100 border-t-[#f7d302] rounded-full animate-spin"></div>
                        </div>
                    ) : todayRides.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {todayRides.map((ride) => (
                                <div
                                    key={ride.ride_id}
                                    onClick={() => {
                                        setPickup({ lat: ride.source_lat, lng: ride.source_lng, address: ride.source });
                                        setDropoff({ lat: ride.dest_lat, lng: ride.dest_lng, address: ride.destination });
                                        setSearchPickup(ride.source);
                                        setSearchDropoff(ride.destination);
                                        handleSearch();
                                    }}
                                    className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 hover:border-[#f7d302] hover:bg-white hover:shadow-2xl transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div
                                                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${ride.driver_id}`); }}
                                                className="w-12 h-12 bg-[#f7d302] rounded-2xl flex items-center justify-center text-xl shadow-sm cursor-pointer hover:scale-110 transition-all"
                                            >
                                                🚗
                                            </div>
                                            <div>
                                                <p
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/profile/${ride.driver_id}`); }}
                                                    className="font-black text-black hover:text-yellow-600 cursor-pointer transition-colors"
                                                >
                                                    {ride.driver_name}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ride.ride_time}</p>
                                            </div>
                                        </div>
                                        <p className="text-xl font-black text-black">₹{ride.base_price}</p>
                                    </div>
                                    <div className="space-y-3 mb-6">
                                        <p className="font-black text-xs text-gray-800 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#f7d302]"></span>
                                            {ride.source}
                                        </p>
                                        <p className="font-black text-xs text-gray-800 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                                            {ride.destination}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ride.available_seats} SEATS LEFT</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleBookRide(ride); }}
                                            className="text-[10px] font-black text-[#f7d302] uppercase tracking-widest hover:scale-110 transition-transform active:scale-95"
                                        >
                                            Book Now ➔
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-gray-50 rounded-[48px] border-2 border-dashed border-gray-100">
                            <p className="text-gray-300 font-black text-sm uppercase tracking-widest">No rides scheduled for today yet</p>
                            <Link to="/create-ride" className="mt-4 text-[10px] font-black underline uppercase tracking-widest inline-block hover:text-[#f7d302] transition-colors">Be the first to publish</Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Inline Booking Confirmation Section Removed */}

            {/* Inline Success Message Section */}
            {successMessage && (
                <section id="inline-success-message" className="py-20 bg-white border-y border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden border border-black/5 animate-zoom-in">
                            <div className={`p-16 text-center ${successMessage.type === 'PENDING' ? 'bg-amber-50' : 'bg-green-50'}`}>
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-10 shadow-2xl ${successMessage.type === 'PENDING' ? 'bg-amber-400' : 'bg-green-500 text-white'}`}>
                                    {successMessage.type === 'PENDING' ? '⏳' : '✅'}
                                </div>
                                <h3 className="text-4xl font-[1000] text-black mb-6 uppercase tracking-tighter leading-none">
                                    {successMessage.type === 'PENDING' ? 'Request <br/>Received' : 'Ride <br/>Confirmed'}
                                </h3>
                                <p className="text-xl font-black text-gray-600 mb-10 leading-relaxed max-w-xs mx-auto">
                                    {successMessage.text}
                                </p>
                                <div className="space-y-4 max-w-sm mx-auto">
                                    <button
                                        onClick={() => {
                                            setSuccessMessage(null);
                                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                        }}
                                        className="w-full py-6 bg-black text-white rounded-[32px] font-black text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-black/20"
                                    >
                                        Check Activity Center ➔
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
                </section>
            )}

            {/* Dynamic Activity Center / How It Works */}
            <section className="py-24 px-4 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    {isAuthenticated ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                                <div>
                                    <h2 className="text-4xl font-[1000] text-black tracking-tighter leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        Activity Center
                                    </h2>
                                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Real-time snapshots of your journeys</p>
                                </div>
                                <Link to="/my-rides" className="bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all">
                                    Manage Everything ➔
                                </Link>
                            </div>



                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Section 1: Booked Rides */}
                                <div className="bg-gray-50 rounded-[48px] p-10 border border-gray-100 relative group overflow-hidden h-full">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-8">
                                            <span className="text-4xl">🎫</span>
                                            <div>
                                                <h3 className="text-xl font-black text-black">Your Booked Rides</h3>
                                                <p className="text-gray-400 text-xs font-bold">Trips you've joined</p>
                                            </div>
                                        </div>

                                        {activityLoading ? (
                                            <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-black/5 border-t-black rounded-full animate-spin"></div></div>
                                        ) : (
                                            <div className="space-y-4">
                                                {myBookings.length > 0 ? (
                                                    myBookings.map((item, idx) => (
                                                        <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-all group/item">
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.ride_details?.ride_date}</p>
                                                                <p className="font-black text-black">{item.ride_details?.source} ➔ {item.ride_details?.destination}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black text-black bg-[#f7d302] px-3 py-1 rounded-full uppercase">
                                                                    {item.status}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-12 text-center">
                                                        <p className="text-gray-300 font-black text-sm uppercase tracking-widest">No active bookings</p>
                                                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mt-4 text-[10px] font-black underline uppercase tracking-widest">Find a Ride</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl"></div>
                                </div>

                                {/* Section 2: Published Rides */}
                                <div className="bg-black rounded-[48px] p-10 border border-gray-800 relative group overflow-hidden h-full text-white">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-8">
                                            <span className="text-4xl">🚗</span>
                                            <div>
                                                <h3 className="text-xl font-black">Your Published Rides</h3>
                                                <p className="text-gray-500 text-xs font-bold">Journeys you're hosting</p>
                                            </div>
                                        </div>

                                        {activityLoading ? (
                                            <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-white/5 border-t-white rounded-full animate-spin"></div></div>
                                        ) : (
                                            <div className="space-y-4">
                                                {myRides.length > 0 ? (
                                                    myRides.map((item, idx) => (
                                                        <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/10 flex justify-between items-center hover:bg-white/10 transition-all group/item">
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{item.ride_date}</p>
                                                                <p className="font-black text-white">{item.source} ➔ {item.destination}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black text-black bg-[#f7d302] px-3 py-1 rounded-full uppercase">
                                                                    {item.available_seats} SEATS
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-12 text-center">
                                                        <p className="text-gray-600 font-black text-sm uppercase tracking-widest">No published rides</p>
                                                        <Link to="/create-ride" className="mt-4 text-[10px] font-black underline uppercase tracking-widest block">Publish a Ride</Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#f7d302]/10 rounded-full blur-3xl"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="lg:w-1/2">
                                <h2 className="text-5xl font-[1000] text-black tracking-tighter leading-none mb-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                    The ultimate <br />
                                    <span className="text-[#f7d302] stroke-black" style={{ WebkitTextStroke: '2px black' }}>dual-lane</span> experience
                                </h2>
                                <p className="text-gray-500 font-bold text-lg mb-12 max-w-md">Whether you want to save on fuel or find a comfortable seat, blinkride is built for your lifestyle.</p>
                                <div className="flex gap-4">
                                    <Link to="/register" className="bg-black text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10">Join Now ➔</Link>
                                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-white text-black border-2 border-black/5 px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">How it works</button>
                                </div>
                            </div>
                            <div className="lg:w-1/2 grid grid-cols-2 gap-6">
                                <div className="bg-green-50 p-8 rounded-[40px] border border-green-100 flex flex-col items-center text-center">
                                    <div className="text-5xl mb-6">🎫</div>
                                    <h4 className="font-black text-black mb-2">For Riders</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Safe, verified & cheap</p>
                                </div>
                                <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 flex flex-col items-center text-center mt-12">
                                    <div className="text-5xl mb-6">🚗</div>
                                    <h4 className="font-black text-black mb-2">For Drivers</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Earn & Save on fuel</p>
                                </div>
                                <div className="bg-orange-50 p-8 rounded-[40px] border border-orange-100 flex flex-col items-center text-center -mt-6">
                                    <div className="text-5xl mb-6">🛡️</div>
                                    <h4 className="font-black text-black mb-2">Trust</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Verified ID check</p>
                                </div>
                                <div className="bg-purple-50 p-8 rounded-[40px] border border-purple-100 flex flex-col items-center text-center mt-6">
                                    <div className="text-5xl mb-6">⚡</div>
                                    <h4 className="font-black text-black mb-2">Speed</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Instant Booking</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Instant Benefit Cards */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group">
                        <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:rotate-12 transition-transform">💰</div>
                        <h3 className="text-2xl font-black mb-4">Lowest Prices, Period.</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">Save up to 70% compared to private cabs. We prioritize your pocket above all.</p>
                    </div>
                    <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group">
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:rotate-12 transition-transform">🛡️</div>
                        <h3 className="text-2xl font-black mb-4">Verified Members Only</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">Safety is our priority. Every member is verified with ID and phone checks.</p>
                    </div>
                    <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:rotate-12 transition-transform">⚡</div>
                        <h3 className="text-2xl font-black mb-4">Instant Booking</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">No more waiting for back-and-forth messages. Book your seat in just two taps.</p>
                    </div>
                </div>
            </section>

            {/* Promo Banner Style Offer section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto rounded-[48px] overflow-hidden bg-black text-white relative group">
                    <div className="p-12 md:p-20 relative z-10 md:w-2/3">
                        <div className="bg-yellow-400 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">Driver Benefits</div>
                        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-none">Starting a journey? <br /> Share the cost.</h2>
                        <p className="text-white/60 text-lg md:text-xl font-bold mb-10 leading-relaxed">Publish your ride details and we'll find verified co-travelers for you. It's safe, fast, and pays for your fuel.</p>
                        <Link to="/create-ride" className="bg-[#f7d302] text-black px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-yellow-300 transition-all inline-block shadow-2xl shadow-yellow-400/20">
                            Offer a ride 🚗
                        </Link>
                    </div>
                    <div className="absolute top-0 right-0 w-full h-full md:w-1/2 opacity-30 md:opacity-100 group-hover:scale-105 transition-transform duration-700">
                        <img src="https://images.unsplash.com/photo-1549194388-2469d59ec39e?auto=format&fit=crop&q=80&w=1200" alt="Travel" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
                    </div>
                </div>
            </section>


            {successMessage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden border border-black/5 animate-zoom-in">
                        <div className={`p-16 text-center ${successMessage.type === 'WAITING' ? 'bg-blue-50' : successMessage.type === 'PENDING' ? 'bg-amber-50' : 'bg-green-50'}`}>
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-10 shadow-2xl ${successMessage.type === 'WAITING' ? 'bg-blue-600 text-white' : successMessage.type === 'PENDING' ? 'bg-amber-400' : 'bg-green-500 text-white'}`}>
                                {successMessage.type === 'WAITING' ? '🪪' : successMessage.type === 'PENDING' ? '⏳' : '✅'}
                            </div>
                            <h3 className="text-4xl font-[1000] text-black mb-6 uppercase tracking-tighter leading-none">
                                {successMessage.type === 'WAITING' ? 'License <br/>uploaded' : successMessage.type === 'PENDING' ? 'Request <br/>Received' : 'Ride <br/>Confirmed'}
                            </h3>
                            <p className="text-xl font-black text-gray-600 mb-10 leading-relaxed max-w-xs mx-auto">
                                {successMessage.text}
                            </p>
                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        setSuccessMessage(null);
                                        if (successMessage.type !== 'WAITING') {
                                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                        }
                                    }}
                                    className="w-full py-6 bg-black text-white rounded-[32px] font-black text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-black/20"
                                >
                                    {successMessage.type === 'WAITING' ? 'Understood ➔' : 'Check Activity Center ➔'}
                                </button>
                                <button
                                    onClick={() => setSuccessMessage(null)}
                                    className="w-full py-6 bg-gray-100 text-gray-400 rounded-[32px] font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                        <div className="bg-black text-[8px] font-black text-center py-4 text-white/20 uppercase tracking-[0.5em]">BLINKRIDE SECURE SYSTEM</div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Landing;
