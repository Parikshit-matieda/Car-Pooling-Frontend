import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';

// Fix Leaflet marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Constants (Stable objects prevent drag interruptions)
const sourceIcon = L.divIcon({
    className: 'custom-marker-wrapper',
    html: `<div class="custom-marker-pin bg-[#f7d302] border-2 border-black"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

const destIcon = L.divIcon({
    className: 'custom-marker-wrapper',
    html: `<div class="custom-marker-pin bg-black border-2 border-white"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

interface Location {
    lat: number;
    lng: number;
    address: string;
}

interface Stop extends Location {
    id: string;
    price: string;
}

interface UserVehicle {
    vehicle_id: number;
    vehicle_number: string;
    model: string;
    seats: number;
}

const RideCreationFlow: React.FC = () => {
    const { user, isAuthenticated, refreshUser } = useAuth();
    const navigate = useNavigate();

    // Helper to get initial state from sessionStorage
    const getInitialState = (key: string, defaultValue: any) => {
        const saved = sessionStorage.getItem('ride_creation_draft');
        if (saved) {
            try {
                const draft = JSON.parse(saved);
                return draft[key] !== undefined ? draft[key] : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        }
        return defaultValue;
    };

    // Step state
    const [step, setStep] = useState(() => getInitialState('step', 1));

    // Form state
    const [source, setSource] = useState<Location | null>(() => getInitialState('source', null));
    const [destination, setDestination] = useState<Location | null>(() => getInitialState('destination', null));
    const [seats, setSeats] = useState(() => getInitialState('seats', 1));
    const [date, setDate] = useState(() => getInitialState('date', ''));
    const [time, setTime] = useState(() => getInitialState('time', ''));
    const [stops, setStops] = useState<Stop[]>(() => getInitialState('stops', []));
    const [routes, setRoutes] = useState<{ coords: [number, number][], distance: number, duration: number }[]>(() => getInitialState('routes', []));
    const [selectedRouteIdx, setSelectedRouteIdx] = useState(() => getInitialState('selectedRouteIdx', 0));
    const [finalLegPrice, setFinalLegPrice] = useState(() => getInitialState('finalLegPrice', '0'));
    const [fullJourneyPrice, setFullJourneyPrice] = useState(() => getInitialState('fullJourneyPrice', '0'));
    const [isManualPrice, setIsManualPrice] = useState(() => getInitialState('isManualPrice', false));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userVehicles, setUserVehicles] = useState<UserVehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
    const [hasVehicles, setHasVehicles] = useState<boolean>(true);
    // Search state
    const [searchSource, setSearchSource] = useState(() => getInitialState('searchSource', ''));
    const [searchDest, setSearchDest] = useState(() => getInitialState('searchDest', ''));
    const [searchStop, setSearchStop] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: string, name: string, lat: number, lon: number }[]>([]);
    const [searchingFor, setSearchingFor] = useState<'source' | 'dest' | 'stop' | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [bookingType, setBookingType] = useState<'INSTANT' | 'APPROVAL'>(() => getInitialState('bookingType', 'INSTANT'));
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);


    // Auto-calculate full journey price when segments change
    useEffect(() => {
        if (!isManualPrice) {
            const sum = stops.reduce((acc, s) => acc + parseFloat(s.price || '0'), 0) + parseFloat(finalLegPrice || '0');
            setFullJourneyPrice(sum.toString());
        }
    }, [stops, finalLegPrice, isManualPrice]);

    const fetchUserVehicles = useCallback(async (vDate?: string, vTime?: string) => {
        try {
            const res = await api.get('/vehicles/my', {
                params: {
                    ride_date: vDate,
                    ride_time: vTime
                }
            });
            setUserVehicles(res.data);

            // If we have vehicles and nothing is selected, or current selection isn't in new list
            if (res.data.length > 0) {
                const isStillAvailable = res.data.some((v: any) => v.vehicle_id === selectedVehicleId);
                if (!selectedVehicleId || !isStillAvailable) {
                    setSelectedVehicleId(res.data[0].vehicle_id);
                    setSeats(res.data[0].seats);
                }
            } else {
                setSelectedVehicleId(null);
            }
        } catch (err) {
            console.error('Failed to fetch vehicles', err);
        }

        // Also check if user has ANY vehicles at all (ignoring time)
        try {
            const res = await api.get('/vehicles/my');
            setHasVehicles(res.data.length > 0);
        } catch (err) {
            console.error('Failed to check vehicles existence', err);
        }
    }, [selectedVehicleId]);

    useEffect(() => {
        if (isAuthenticated) {
            refreshUser();
            fetchUserVehicles(date, time);
        }
    }, [isAuthenticated, refreshUser, fetchUserVehicles, date, time]);


    // Save draft to sessionStorage on state changes
    useEffect(() => {
        if (!isPublished && step < 8) {
            const draft = {
                step,
                source,
                destination,
                seats,
                date,
                time,
                stops,
                routes,
                selectedRouteIdx,
                finalLegPrice,
                fullJourneyPrice,
                isManualPrice,
                bookingType,
                searchSource,
                searchDest
            };
            sessionStorage.setItem('ride_creation_draft', JSON.stringify(draft));
        }
    }, [step, source, destination, seats, date, time, stops, routes, selectedRouteIdx, finalLegPrice, fullJourneyPrice, isManualPrice, bookingType, searchSource, searchDest, isPublished]);

    // Auto-redirect after publishing
    useEffect(() => {
        if (isPublished) {
            sessionStorage.removeItem('ride_creation_draft');
            const timer = setTimeout(() => {
                navigate('/dashboard');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isPublished, navigate]);

    // Debounced search for Source
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchSource.length >= 3) {
                performSearch(searchSource, 'source');
            } else {
                if (searchingFor === 'source') setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchSource]);

    // Debounced search for Destination
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchDest.length >= 3) {
                performSearch(searchDest, 'dest');
            } else {
                if (searchingFor === 'dest') setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchDest]);

    // Debounced search for Stopover
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchStop.length >= 3) {
                performSearch(searchStop, 'stop');
            } else {
                if (searchingFor === 'stop') setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchStop]);

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            return data.display_name;
        } catch (err) {
            console.error('Reverse geocoding failed', err);
            return null;
        }
    };

    const performSearch = async (query: string, type: 'source' | 'dest' | 'stop') => {
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

    const fetchRoute = async () => {
        if (!source || !destination) return;
        setLoading(true);
        try {
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${source.lng},${source.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&alternatives=true`);
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
                const fetchedRoutes = data.routes.map((r: any) => ({
                    coords: r.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]),
                    distance: r.distance,
                    duration: r.duration
                }));
                setRoutes(fetchedRoutes);
                setSelectedRouteIdx(0);
                nextStep();
            } else {
                setError('No routes found between these points.');
            }
        } catch (err) {
            setError('Failed to fetch route');
        } finally {
            setLoading(false);
        }
    };

    const addStop = (lat: number, lng: number, address: string) => {
        const newStop: Stop = { id: Math.random().toString(36).substr(2, 9), lat, lng, address, price: '0' };
        setStops([...stops, newStop]);
    };

    const removeStop = (id: string) => {
        setStops(stops.filter(s => s.id !== id));
    };


    const updateStopPrice = (id: string, price: string) => {
        setStops(stops.map(s => s.id === id ? { ...s, price: price === '' ? '0' : price } : s));
    };

    const adjustPrice = (type: 'stop' | 'final', id: string | null, delta: number) => {
        if (type === 'stop' && id) {
            setStops(stops.map(s => {
                if (s.id === id) {
                    const current = parseInt(s.price || '0');
                    return { ...s, price: Math.max(0, current + delta).toString() };
                }
                return s;
            }));
        } else if (type === 'final') {
            const current = parseInt(finalLegPrice || '0');
            setFinalLegPrice(Math.max(0, current + delta).toString());
        }
    };

    const handleCreateRide = async () => {
        setLoading(true);
        setError('');
        try {
            const rideData = {
                source: source?.address,
                destination: destination?.address,
                source_lat: source?.lat,
                source_lng: source?.lng,
                dest_lat: destination?.lat,
                dest_lng: destination?.lng,
                ride_date: date,
                ride_time: time,
                total_seats: seats,
                vehicle_id: selectedVehicleId,
                base_price: parseFloat(fullJourneyPrice),
                route_polyline: JSON.stringify(routes[selectedRouteIdx]?.coords || []),
                stops: stops.map((s, idx) => ({
                    city_name: s.address,
                    latitude: s.lat,
                    longitude: s.lng,
                    stop_order: idx + 1,
                    stop_price: parseFloat(s.price)
                })),
                booking_type: bookingType
            };

            await api.post('/rides', rideData);

            if (saveAsTemplate) {
                try {
                    await api.post('/templates', {
                        source: source?.address,
                        destination: destination?.address,
                        source_lat: source?.lat,
                        source_lng: source?.lng,
                        dest_lat: destination?.lat,
                        dest_lng: destination?.lng,
                        ride_time: time,
                        total_seats: seats,
                        vehicle_id: selectedVehicleId,
                        base_price: parseFloat(fullJourneyPrice),
                        route_polyline: JSON.stringify(routes[selectedRouteIdx]?.coords || []),
                        stops: stops.map((s, idx) => ({
                            city_name: s.address,
                            latitude: s.lat,
                            longitude: s.lng,
                            stop_order: idx + 1,
                            stop_price: parseFloat(s.price)
                        })),
                        booking_type: bookingType
                    });
                } catch (tempErr) {
                    console.error('Failed to save template, but ride was created:', tempErr);
                }
            }

            setIsPublished(true);

            sessionStorage.removeItem('ride_creation_draft');
            setStep(8); // Move to success step
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create ride');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    if (!isAuthenticated) return (
        <div className="min-h-screen bg-gray-50 flex flex-col uppercase">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white p-12 rounded-3xl shadow-xl text-center border border-gray-100 max-w-md w-full">
                    <div className="text-5xl mb-6">🔒</div>
                    <h2 className="text-2xl font-black mb-4">Identity Unverified</h2>
                    <p className="text-gray-500 font-bold mb-8">Please login to access the driver module.</p>
                    <button onClick={() => navigate('/login')} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg">Sign In</button>
                </div>
            </div>
        </div>
    );

    if (user?.license_status === 'PENDING') return (
        <div className="min-h-screen bg-[#f7d302] p-6 lg:p-12 relative overflow-hidden font-sans flex flex-col">
            <Navbar />
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-black/5 rounded-full blur-3xl"></div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 min-h-[80vh]">
                <div className="bg-white p-12 lg:p-16 rounded-[48px] shadow-2xl text-center border-4 border-black/5 max-w-xl w-full animate-fade-in">
                    <div className="w-24 h-24 bg-amber-50 rounded-[32px] flex items-center justify-center text-5xl mx-auto mb-10 shadow-sm border-2 border-white">⏳</div>
                    <h2 className="text-4xl font-[1000] text-black mb-6 uppercase tracking-tighter leading-none">Review <br />In Progress</h2>
                    <p className="text-gray-500 font-bold mb-10 leading-relaxed text-lg">Our team is currently checking your driving license. You'll be able to publish rides as soon as you're verified!</p>
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-6 bg-black text-white font-[1000] rounded-[28px] shadow-2xl shadow-black/10 hover:bg-gray-900 active:scale-95 transition-all uppercase tracking-widest text-sm"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
                <div className="mt-8 bg-black text-white/20 text-[8px] font-black py-3 px-8 rounded-full uppercase tracking-[0.5em] shadow-2xl">BLINKRIDE SECURE SYSTEM</div>
            </div>
        </div>
    );

    if (user?.license_status !== 'VERIFIED') return (
        <div className="min-h-screen bg-[#f7d302] p-6 lg:p-12 relative overflow-hidden font-sans flex flex-col">
            <Navbar />
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-black/5 rounded-full blur-3xl"></div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 min-h-[80vh]">
                <div className="bg-white p-12 lg:p-16 rounded-[48px] shadow-2xl text-center border-4 border-black/5 max-w-xl w-full animate-fade-in">
                    <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center text-5xl mx-auto mb-10 shadow-sm border-2 border-white">🪪</div>
                    <h2 className="text-4xl font-[1000] text-black mb-6 uppercase tracking-tighter leading-none">Verification <br />Required</h2>
                    <p className="text-gray-500 font-bold mb-10 leading-relaxed text-lg">Your driving license must be verified before you can offer rides.</p>
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/upload-license')}
                            className="w-full py-6 bg-black text-white font-[1000] rounded-[28px] shadow-2xl shadow-black/10 hover:bg-gray-900 active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                        >
                            Upload License <span className="text-white/40">➔</span>
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-6 bg-gray-50 text-gray-400 font-black rounded-[28px] hover:bg-gray-100 hover:text-black transition-all text-[10px] uppercase tracking-widest"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
                <div className="mt-8 bg-black text-white/20 text-[8px] font-black py-3 px-8 rounded-full uppercase tracking-[0.5em] shadow-2xl">BLINKRIDE SECURE SYSTEM</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col uppercase font-sans">
            <Navbar />

            {/* Progress Header (Blinkit Yellow) */}
            <div className="bg-[#f7d302] border-b border-black/5 px-4 py-8 sticky top-20 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                        <div key={s} className="flex items-center flex-1 last:flex-none relative">
                            <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[18px] flex items-center justify-center font-black transition-all relative z-10 text-xs sm:text-base ${step >= s ? 'bg-black text-white scale-110 shadow-xl' : 'bg-white/40 text-black/30'}`}>
                                {step > s ? '✓' : s}
                            </div>
                            {s < 7 && (
                                <div className={`h-1 flex-1 mx-1.5 sm:mx-2 rounded-full transition-all ${step > s ? 'bg-black' : 'bg-black/10'}`}></div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="max-w-4xl mx-auto mt-6 flex justify-between px-1 overflow-x-auto no-scrollbar gap-2">
                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${step >= 1 ? 'text-black' : 'text-black/30'}`}>Route</span>
                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${step >= 2 ? 'text-black' : 'text-black/30'}`}>Point</span>
                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${step >= 3 ? 'text-black' : 'text-black/30'}`}>Path</span>
                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${step >= 4 ? 'text-black' : 'text-black/30'}`}>Stops</span>
                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${step >= 5 ? 'text-black' : 'text-black/30'}`}>Time</span>
                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${step >= 6 ? 'text-black' : 'text-black/30'}`}>Fare</span>
                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${step >= 7 ? 'text-black' : 'text-black/30'}`}>Review</span>
                </div>
            </div>

            <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 font-bold flex items-center gap-3">⚠️ {error}</div>}

                {/* STEP 1: INITIAL SEARCH (Blinkit High Contrast) */}
                {step === 1 && (
                    <div className="bg-white rounded-[48px] shadow-2xl p-10 md:p-16 border border-black/5 animate-fade-in relative">
                        <button
                            onClick={() => navigate('/')}
                            className="absolute top-8 left-8 w-12 h-12 bg-white border border-black/5 rounded-2xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all z-50 group active:scale-90"
                            title="Back to Home"
                        >
                            <span className="text-xl group-hover:-translate-x-1 transition-transform">⬅️</span>
                        </button>
                        <h2 className="text-5xl font-black text-black mb-12 tracking-tighter leading-none">
                            Where are we <br />
                            <span className="bg-[#f7d302] px-4 py-1 inline-block -rotate-1">heading?</span>
                        </h2>

                        <div className="space-y-10">
                            <div className="relative">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">From</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl group-focus-within:scale-110 transition-all">📍</span>
                                    <input
                                        type="text"
                                        className="w-full pl-20 pr-10 py-6 bg-gray-50 border-2 border-transparent focus:border-[#f7d302] focus:bg-white rounded-[32px] outline-none font-black transition-all text-xl shadow-sm placeholder:text-gray-300"
                                        placeholder="City, building, or landmark..."
                                        value={searchSource}
                                        onChange={(e) => setSearchSource(e.target.value)}
                                    />
                                    {isSearching && searchingFor === 'source' && (
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                            <div className="w-6 h-6 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    {searchingFor === 'source' && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] shadow-2xl border border-black/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            {searchResults.map(r => (
                                                <button key={r.id} onClick={() => { setSource({ lat: r.lat, lng: r.lon, address: r.name }); setSearchSource(r.name); setSearchResults([]); }} className="w-full text-left px-8 py-5 hover:bg-[#f7d302]/20 font-black transition-all border-b border-gray-50 last:border-none flex items-center gap-4 text-sm text-gray-700">
                                                    <span className="opacity-30 text-2xl">🏙️</span>
                                                    <span className="truncate">{r.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">To</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl group-focus-within:scale-110 transition-all">🎯</span>
                                    <input
                                        type="text"
                                        className="w-full pl-20 pr-10 py-6 bg-gray-50 border-2 border-transparent focus:border-[#f7d302] focus:bg-white rounded-[32px] outline-none font-black transition-all text-xl shadow-sm placeholder:text-gray-300"
                                        placeholder="Where to?"
                                        value={searchDest}
                                        onChange={(e) => setSearchDest(e.target.value)}
                                    />
                                    {isSearching && searchingFor === 'dest' && (
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                            <div className="w-6 h-6 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    {searchingFor === 'dest' && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] shadow-2xl border border-black/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            {searchResults.map(r => (
                                                <button key={r.id} onClick={() => { setDestination({ lat: r.lat, lng: r.lon, address: r.name }); setSearchDest(r.name); setSearchResults([]); }} className="w-full text-left px-8 py-5 hover:bg-[#f7d302]/20 font-black transition-all border-b border-gray-50 last:border-none flex items-center gap-4 text-sm text-gray-700">
                                                    <span className="opacity-30 text-2xl">🗺️</span>
                                                    <span className="truncate">{r.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 bg-black text-white rounded-[40px] flex items-center justify-between shadow-2xl shadow-black/10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-[#f7d302] rounded-[24px] flex items-center justify-center text-3xl shadow-inner text-black">👥</div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Available Seats</p>
                                        <p className="text-3xl font-black tracking-tight">{seats} <span className="text-sm opacity-40">Persons</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 p-2 rounded-[24px]">
                                    <button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-12 h-12 flex items-center justify-center font-black hover:bg-white/20 rounded-[18px] transition-all text-xl">－</button>
                                    <span className="w-12 text-center font-black text-2xl">{seats}</span>
                                    <button onClick={() => setSeats(Math.min(6, seats + 1))} className="w-12 h-12 flex items-center justify-center font-black hover:bg-white/20 rounded-[18px] transition-all text-xl">＋</button>
                                </div>
                            </div>

                            <button
                                onClick={nextStep}
                                disabled={!source || !destination}
                                className={`w-full py-6 rounded-[32px] font-black text-xl uppercase tracking-widest shadow-2xl transition-all ${(!source || !destination) ? 'bg-black/10 text-black/20 cursor-not-allowed shadow-none' : 'bg-black text-white hover:bg-gray-900 active:scale-95 shadow-black/20'}`}
                            >
                                Continue to Map ➔
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: PRECISION MAP PICKER (Blinkit Style) */}
                {step === 2 && (
                    <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden border border-black/5 flex flex-col min-h-[70vh] animate-fade-in relative">
                        <button
                            onClick={prevStep}
                            className="absolute top-6 left-6 w-10 h-10 bg-white border border-black/5 rounded-xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all z-[100] group active:scale-90"
                            title="Go Back"
                        >
                            <span className="text-lg group-hover:-translate-x-0.5 transition-transform text-black">⬅️</span>
                        </button>
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-black text-white">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Confirm Points</h3>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Drag markers to set exact pickup & dropoff</p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={prevStep} className="px-8 py-3 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all text-xs uppercase tracking-widest">Back</button>
                                <button onClick={fetchRoute} disabled={loading} className="px-10 py-3 bg-[#f7d302] text-black font-black rounded-2xl hover:scale-105 transition-all text-xs uppercase tracking-widest shadow-xl shadow-[#f7d302]/20 flex items-center gap-2">
                                    {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : 'Confirm Points ➔'}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative min-h-[500px]">
                            <MapContainer
                                center={[source?.lat || 20, source?.lng || 78]}
                                zoom={13}
                                style={{ height: '500px', width: '100%' }}
                                className="z-0"
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {source && (
                                    <Marker
                                        position={[source.lat, source.lng]}
                                        draggable={true}
                                        icon={sourceIcon}
                                        eventHandlers={{
                                            dragend: async (e) => {
                                                const marker = e.target;
                                                const position = marker.getLatLng();
                                                const newAddress = await reverseGeocode(position.lat, position.lng);
                                                setSource({ ...source!, lat: position.lat, lng: position.lng, address: newAddress || source!.address });
                                            },
                                        }}
                                    />
                                )}
                                {destination && (
                                    <Marker
                                        position={[destination.lat, destination.lng]}
                                        draggable={true}
                                        icon={destIcon}
                                        eventHandlers={{
                                            dragend: async (e) => {
                                                const marker = e.target;
                                                const position = marker.getLatLng();
                                                const newAddress = await reverseGeocode(position.lat, position.lng);
                                                setDestination({ ...destination!, lat: position.lat, lng: position.lng, address: newAddress || destination!.address });
                                            },
                                        }}
                                    />
                                )}
                                <MapBounds source={source} dest={destination} />
                            </MapContainer>
                        </div>
                    </div>
                )}

                {/* STEP 3: MULTI-ROUTE PREVIEW & SELECTION (Blinkit Style) */}
                {step === 3 && (
                    <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden border border-black/5 flex flex-col min-h-[70vh] animate-fade-in lg:flex-row relative">
                        <button
                            onClick={prevStep}
                            className="absolute top-6 left-6 w-10 h-10 bg-white border border-black/5 rounded-xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all z-[100] group active:scale-90"
                            title="Go Back"
                        >
                            <span className="text-lg group-hover:-translate-x-0.5 transition-transform text-black">⬅️</span>
                        </button>
                        <div className="lg:w-96 bg-gray-50 p-8 flex flex-col border-r border-gray-100">
                            <h3 className="text-2xl font-black text-black mb-2 tracking-tight">Options Found</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Select your preferred pathway</p>

                            <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                                {routes.map((r, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedRouteIdx(idx)}
                                        className={`w-full text-left p-6 rounded-[32px] border-2 transition-all group relative overflow-hidden ${selectedRouteIdx === idx ? 'bg-black border-black text-white shadow-2xl shadow-black/10' : 'bg-white border-transparent hover:border-black/5 text-gray-600'}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedRouteIdx === idx ? 'text-[#f7d302]' : 'text-gray-400'}`}>Path {idx + 1}</span>
                                            {selectedRouteIdx === idx && <span className="bg-[#f7d302] text-black px-2 py-0.5 rounded-full text-[8px] font-black animate-pulse">SELECTED</span>}
                                        </div>
                                        <p className="text-3xl font-black leading-none mb-2 tracking-tight">{(r.duration / 60).toFixed(0)} <span className="text-sm opacity-40">min</span></p>
                                        <p className={`text-[10px] font-bold ${selectedRouteIdx === idx ? 'text-gray-400' : 'text-gray-400'}`}>{(r.distance / 1000).toFixed(1)} km journey</p>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 space-y-3">
                                <button onClick={nextStep} className="w-full py-5 bg-[#f7d302] text-black font-black rounded-2xl shadow-xl shadow-[#f7d302]/20 hover:scale-[1.02] transition-all uppercase text-sm tracking-widest" disabled={routes.length === 0}>Confirm Path ➔</button>
                                <button onClick={prevStep} className="w-full py-4 text-gray-400 font-black rounded-2xl hover:bg-black/5 transition-all uppercase text-[10px] tracking-widest">Adjust Map Points</button>
                            </div>
                        </div>
                        <div className="flex-1 relative min-h-[500px]">
                            <MapContainer
                                center={[source?.lat || 0, source?.lng || 0]}
                                zoom={13}
                                style={{ height: '500px', width: '100%' }}
                                className="z-0"
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[source!.lat, source!.lng]} icon={sourceIcon} />
                                <Marker position={[destination!.lat, destination!.lng]} icon={destIcon} />

                                {routes.map((r, idx) => (
                                    <Polyline
                                        key={idx}
                                        positions={r.coords}
                                        color={selectedRouteIdx === idx ? "#000000" : "#d1d5db"}
                                        weight={selectedRouteIdx === idx ? 8 : 4}
                                        opacity={selectedRouteIdx === idx ? 1 : 0.4}
                                        eventHandlers={{
                                            click: () => setSelectedRouteIdx(idx)
                                        }}
                                    />
                                ))}
                                {routes.length > 0 && <RouteAutoFit coords={routes[selectedRouteIdx].coords} />}
                                <MapBounds source={source} dest={destination} />
                            </MapContainer>
                        </div>
                    </div>
                )}

                {/* STEP 4: STOPOVER SELECTION (Blinkit Style) */}
                {step === 4 && (
                    <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden border border-black/5 flex flex-col min-h-[70vh] animate-fade-in lg:flex-row relative">
                        <button
                            onClick={prevStep}
                            className="absolute top-6 left-6 w-10 h-10 bg-white border border-black/5 rounded-xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all z-[100] group active:scale-90"
                            title="Go Back"
                        >
                            <span className="text-lg group-hover:-translate-x-0.5 transition-transform text-black">⬅️</span>
                        </button>
                        <div className="lg:w-96 bg-gray-50 p-8 flex flex-col border-r border-gray-100">
                            <h3 className="text-2xl font-black text-black mb-2 tracking-tight">Stops</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Click map or search below</p>

                            {/* Manual Stop Search */}
                            <div className="relative mb-8">
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl group-focus-within:scale-110 transition-all">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Add a stop..."
                                        value={searchStop}
                                        onChange={(e) => setSearchStop(e.target.value)}
                                        className="w-full pl-14 pr-6 py-5 bg-white border border-black/5 rounded-[24px] text-xs font-black focus:ring-4 focus:ring-[#f7d302]/20 outline-none transition-all shadow-sm"
                                    />
                                </div>

                                {searchingFor === 'stop' && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[24px] shadow-2xl border border-black/5 z-[100] max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar">
                                        {searchResults.map((res) => (
                                            <button
                                                key={res.id}
                                                onClick={() => {
                                                    addStop(res.lat, res.lon, res.name);
                                                    setSearchStop('');
                                                    setSearchResults([]);
                                                }}
                                                className="w-full px-6 py-4 text-left hover:bg-[#f7d302]/10 transition-all border-b border-gray-50 last:border-none"
                                            >
                                                <p className="text-[10px] font-black text-gray-900 leading-snug">{res.name}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {isSearching && searchingFor === 'stop' && (
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                {stops.length === 0 ? (
                                    <div className="text-center py-16 opacity-20 filter grayscale">
                                        <p className="text-6xl mb-4">📍</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest">No stops added yet</p>
                                    </div>
                                ) : (
                                    stops.map((stop, idx) => (
                                        <div key={stop.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-black/5 animate-slide-in group hover:border-[#f7d302] transition-colors">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="w-8 h-8 bg-[#f7d302] text-black rounded-xl flex items-center justify-center text-xs font-black shadow-sm">{idx + 1}</span>
                                                <button onClick={() => removeStop(stop.id)} className="w-8 h-8 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 transition-all flex items-center justify-center text-xl">×</button>
                                            </div>
                                            <p className="text-[11px] font-black text-black leading-snug line-clamp-2">{stop.address}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-8 space-y-3">
                                <button onClick={nextStep} className="w-full py-5 bg-[#f7d302] text-black font-black rounded-2xl shadow-xl shadow-[#f7d302]/20 hover:scale-[1.02] transition-all uppercase text-sm tracking-widest">Next: Date & Time ➔</button>
                                <button onClick={prevStep} className="w-full py-4 text-gray-400 font-black rounded-2xl hover:bg-black/5 transition-all uppercase text-[10px] tracking-widest">Back to Routes</button>
                            </div>
                        </div>
                        <div className="flex-1 relative min-h-[500px]">
                            <MapContainer
                                center={[source?.lat || 0, source?.lng || 0]}
                                zoom={13}
                                style={{ height: '500px', width: '100%' }}
                                className="z-0"
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[source!.lat, source!.lng]} icon={sourceIcon} />
                                <Marker position={[destination!.lat, destination!.lng]} icon={destIcon} />
                                {routes.length > 0 && <Polyline positions={routes[selectedRouteIdx].coords} color="#000000" weight={6} opacity={0.3} dashArray="10, 10" />}
                                {stops.map((s, idx) => <Marker key={s.id} position={[s.lat, s.lng]} icon={L.divIcon({ html: `<div class="bg-[#f7d302] w-8 h-8 rounded-xl text-black font-black flex items-center justify-center border-2 border-black shadow-xl scale-110">${idx + 1}</div>`, className: '' })} />)}
                                <MapClickHandler onMapClick={async (lat, lng) => {
                                    setLoading(true);
                                    try {
                                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&countrycodes=in`);
                                        const data = await res.json();
                                        addStop(lat, lng, data.display_name || 'Selected Point');
                                    } finally {
                                        setLoading(false);
                                    }
                                }} />
                                <MapBounds source={source} dest={destination} />
                            </MapContainer>
                            {loading && (
                                <div className="absolute inset-0 bg-white/40 backdrop-blur-[4px] z-50 flex items-center justify-center">
                                    <div className="bg-black p-8 rounded-[40px] shadow-2xl flex items-center gap-5 text-white">
                                        <div className="w-8 h-8 border-4 border-white/20 border-t-[#f7d302] rounded-full animate-spin"></div>
                                        <span className="text-xs font-black uppercase tracking-widest">Identifying Point...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 5: TIMING & DETAILS (Blinkit Style) */}
                {step === 5 && (
                    <div className="bg-white rounded-[48px] shadow-2xl p-10 md:p-16 border border-black/5 animate-fade-in max-w-3xl mx-auto relative">
                        <button
                            onClick={prevStep}
                            className="absolute top-8 left-8 w-12 h-12 bg-white border border-black/5 rounded-2xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all z-50 group active:scale-90"
                            title="Go Back"
                        >
                            <span className="text-xl group-hover:-translate-x-1 transition-transform">⬅️</span>
                        </button>
                        <h2 className="text-5xl font-black text-black mb-12 tracking-tighter leading-none text-center">Date, Time & <br /><span className="bg-[#f7d302] px-4 py-1 inline-block rotate-1">Seats</span></h2>

                        <div className="space-y-12 mb-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="relative group">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Departure Date</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-110 transition-all">📅</span>
                                        <input
                                            type="date"
                                            value={date}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-transparent focus:border-[#f7d302] focus:bg-white rounded-[32px] outline-none font-black transition-all text-xl shadow-sm appearance-none"
                                        />
                                    </div>
                                </div>
                                <div className="relative group">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Departure Time</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-110 transition-all">⏰</span>
                                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-transparent focus:border-[#f7d302] focus:bg-white rounded-[32px] outline-none font-black transition-all text-xl shadow-sm appearance-none" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Vehicle & Capacity</label>
                                {userVehicles.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="relative group">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-110 transition-all">🚘</span>
                                            <select
                                                value={selectedVehicleId || ''}
                                                onChange={(e) => {
                                                    const vId = parseInt(e.target.value);
                                                    setSelectedVehicleId(vId);
                                                    const vehicle = userVehicles.find(v => v.vehicle_id === vId);
                                                    if (vehicle) setSeats(vehicle.seats);
                                                }}
                                                className="w-full pl-16 pr-12 py-6 bg-gray-50 border-2 border-transparent focus:border-[#f7d302] rounded-[32px] outline-none font-black transition-all text-xl shadow-sm appearance-none cursor-pointer"
                                            >
                                                {userVehicles.map(v => (
                                                    <option key={v.vehicle_id} value={v.vehicle_id}>{v.model.toUpperCase()} • {v.vehicle_number}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 text-2xl font-black">▼</div>
                                        </div>
                                        <div className="flex items-center gap-8 bg-black text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                                            <div className="absolute -right-8 -bottom-8 text-[120px] opacity-10 rotate-12 group-hover:rotate-0 transition-all duration-700">👥</div>
                                            <div className="flex-1 relative z-10">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Max Journey Capacity</p>
                                                <span className="text-4xl font-black">{seats} <span className="text-sm opacity-40">Passengers</span></span>
                                            </div>
                                            <div className="w-20 h-20 bg-[#f7d302] rounded-[28px] flex items-center justify-center text-4xl shadow-xl shadow-[#f7d302]/20 text-black">🚘</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`${hasVehicles ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'} border-2 p-12 rounded-[48px] text-center shadow-xl animate-fade-in`}>
                                        <p className="text-6xl mb-6">{hasVehicles ? '🚫' : '⚠️'}</p>
                                        <p className={`text-xl font-black ${hasVehicles ? 'text-red-900' : 'text-amber-900'} mb-2 uppercase tracking-tight`}>
                                            {hasVehicles ? 'Vehicle Unavailable' : 'No Vehicle Details Found'}
                                        </p>
                                        <p className={`text-xs ${hasVehicles ? 'text-red-700' : 'text-amber-700'} font-bold mb-10 leading-relaxed max-w-xs mx-auto`}>
                                            {hasVehicles
                                                ? "This vehicle is already engaged in another ride at this time. Please select another vehicle from your profile or add a new one below."
                                                : "You need to register at least one vehicle to your profile before offering a ride to other members."}
                                        </p>
                                        <button
                                            onClick={() => navigate('/profile', { state: { from: '/create-ride', openVehicles: true } })}
                                            className="bg-black text-white px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-black/20 flex items-center gap-4 mx-auto"
                                        >
                                            {hasVehicles ? 'Select Another or Add Vehicle' : 'Add Vehicle Now'} <span className="text-xl opacity-40">➔</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Booking Flow Selection */}
                            <div className="animate-fade-in">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 ml-2">Booking Flow Control</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <button
                                        onClick={() => setBookingType('INSTANT')}
                                        className={`p-8 rounded-[40px] text-left transition-all border-4 ${bookingType === 'INSTANT' ? 'bg-black border-[#f7d302] text-white shadow-2xl' : 'bg-white border-transparent hover:border-black/5 text-gray-400'}`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <span className={`text-4xl ${bookingType === 'INSTANT' ? 'opacity-100' : 'opacity-20 grayscale'}`}>⚡</span>
                                            {bookingType === 'INSTANT' && <span className="bg-[#f7d302] text-black text-[8px] font-black px-3 py-1 rounded-full uppercase">Standard</span>}
                                        </div>
                                        <h4 className={`text-xl font-black mb-2 ${bookingType === 'INSTANT' ? 'text-white' : 'text-black'}`}>Instant Booking</h4>
                                        <p className="text-[10px] font-bold leading-relaxed opacity-60">Passengers book immediately. No action required from you.</p>
                                    </button>

                                    <button
                                        onClick={() => setBookingType('APPROVAL')}
                                        className={`p-8 rounded-[40px] text-left transition-all border-4 ${bookingType === 'APPROVAL' ? 'bg-black border-[#f7d302] text-white shadow-2xl' : 'bg-white border-transparent hover:border-black/5 text-gray-400'}`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <span className={`text-4xl ${bookingType === 'APPROVAL' ? 'opacity-100' : 'opacity-20 grayscale'}`}>👤</span>
                                            {bookingType === 'APPROVAL' && <span className="bg-[#f7d302] text-black text-[8px] font-black px-3 py-1 rounded-full uppercase">Secure</span>}
                                        </div>
                                        <h4 className={`text-xl font-black mb-2 ${bookingType === 'APPROVAL' ? 'text-white' : 'text-black'}`}>Wait for Approval</h4>
                                        <p className="text-[10px] font-bold leading-relaxed opacity-60">Review passenger profiles before accepting their requests.</p>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <button onClick={prevStep} className="flex-1 py-6 bg-gray-100 text-gray-400 font-black rounded-[32px] hover:bg-black hover:text-white transition-all uppercase tracking-widest text-sm">Back</button>
                            <button
                                onClick={nextStep}
                                disabled={!date || !time || userVehicles.length === 0}
                                className={`flex-[2] py-6 rounded-[32px] font-black text-xl uppercase tracking-widest shadow-2xl transition-all ${(!date || !time || userVehicles.length === 0) ? 'bg-black/10 text-black/20 cursor-not-allowed shadow-none' : 'bg-[#f7d302] text-black hover:bg-black hover:text-white shadow-[#f7d302]/20'}`}
                            >
                                Set Fare ➔
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 6: JOURNEY TIMELINE & PRICING (Blinkit Premium Style) */}
                {step === 6 && (
                    <div className="bg-white rounded-[48px] shadow-2xl p-10 md:p-16 border border-black/5 animate-fade-in max-w-4xl mx-auto relative">
                        <button
                            onClick={prevStep}
                            className="absolute top-8 left-8 w-12 h-12 bg-white border border-black/5 rounded-2xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all z-50 group active:scale-90"
                            title="Go Back"
                        >
                            <span className="text-xl group-hover:-translate-x-1 transition-transform">⬅️</span>
                        </button>
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8 sm:gap-12 mb-10 sm:mb-16">
                            <div className="flex-1">
                                <h2 className="text-4xl sm:text-6xl font-[1000] text-black leading-[0.9] tracking-tighter mb-4">
                                    Journey <br />
                                    <span className="bg-[#f7d302] px-6 py-2 inline-block -rotate-1 skew-x-1">Fare Details</span>
                                </h2>
                                <p className="text-[10px] sm:text-[12px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Configure individual segment pricing</p>
                            </div>
                            <div className="bg-black p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] text-white shadow-2xl shadow-black/30 w-full sm:min-w-[320px] relative overflow-hidden group border-4 border-[#f7d302]/20">
                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#f7d302]/10 rounded-full blur-3xl group-hover:bg-[#f7d302]/20 transition-all duration-700"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f7d302]">Full Journey Price</p>
                                        <span className="bg-white/10 text-[9px] font-black px-3 py-1 rounded-full text-white/40 uppercase tracking-widest">Calculated</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl font-black text-[#f7d302] italic">₹</span>
                                        <input
                                            type="number"
                                            value={fullJourneyPrice}
                                            onChange={(e) => {
                                                setIsManualPrice(true);
                                                setFullJourneyPrice(e.target.value);
                                            }}
                                            className="bg-transparent border-none outline-none text-5xl sm:text-7xl font-[1000] w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-white/5 tracking-tighter"
                                        />
                                        {isManualPrice && (
                                            <button
                                                onClick={() => setIsManualPrice(false)}
                                                className="absolute top-2 right-8 text-[8px] font-black uppercase bg-white/10 px-4 py-2 rounded-full hover:bg-[#f7d302] hover:text-black transition-all border border-white/5"
                                            >
                                                Auto-Sync
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-12 bg-gray-50/50 rounded-[48px] sm:rounded-[64px] border border-black/5 relative overflow-hidden mb-16 shadow-inner">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f7d302]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                            <div className="space-y-0 relative max-w-2xl mx-auto">
                                {/* Segment 1: Source to Stop 1 */}
                                {stops.length > 0 && (
                                    <div className="relative pl-16 sm:pl-24 pb-12 sm:pb-16 group animate-fade-in">
                                        <div className="absolute left-[26px] sm:left-[34px] top-6 bottom-0 w-1.5 sm:w-2 bg-black/5 rounded-full group-hover:bg-[#f7d302]/10 transition-colors"></div>
                                        <div className="absolute left-0 top-2 w-14 h-14 sm:w-18 sm:h-18 rounded-[20px] sm:rounded-[28px] border-[4px] sm:border-[5px] border-black bg-[#f7d302] shadow-2xl shadow-[#f7d302]/30 z-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                            <span className="text-2xl sm:text-3xl">🏠</span>
                                        </div>

                                        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-xl border border-black/[0.03] group-hover:border-[#f7d302] transition-all relative z-10 group-hover:-translate-y-1">
                                            <div className="flex-1 w-full mb-6 md:mb-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-[10px] font-black text-white bg-black px-3 py-1 rounded-full uppercase tracking-widest">LEG 01</span>
                                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Pickup</span>
                                                </div>
                                                <p className="font-black text-black text-lg sm:text-2xl tracking-tighter leading-tight uppercase line-clamp-1">{source?.address.split(',')[0]} → {stops[0].address.split(',')[0]}</p>
                                            </div>
                                            <div className="flex items-center gap-4 bg-gray-50 p-3 sm:p-4 rounded-[24px] sm:rounded-[32px] shadow-inner group-hover:bg-[#f7d302]/10 transition-colors border border-transparent group-hover:border-[#f7d302]/20">
                                                <button onClick={() => adjustPrice('stop', stops[0].id, -50)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[20px] bg-white text-black flex items-center justify-center font-black hover:bg-black hover:text-white transition-all text-base sm:text-lg shadow-sm">－</button>
                                                <div className="flex flex-col items-center w-20 sm:w-24">
                                                    <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">PRICE</span>
                                                    <div className="flex items-center">
                                                        <span className="text-xs sm:text-sm font-black text-black/20 mr-1">₹</span>
                                                        <input
                                                            type="number"
                                                            value={stops[0].price}
                                                            onChange={(e) => updateStopPrice(stops[0].id, e.target.value)}
                                                            className="w-full bg-transparent border-none outline-none font-black text-black text-center text-xl sm:text-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </div>
                                                </div>
                                                <button onClick={() => adjustPrice('stop', stops[0].id, 50)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[20px] bg-black text-white flex items-center justify-center font-black hover:bg-[#f7d302] hover:text-black transition-all text-base sm:text-lg shadow-xl shadow-black/10">＋</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Middle Segments (Waitpoints) */}
                                {stops.length > 1 && stops.map((s, idx) => {
                                    if (idx === 0) return null;
                                    return (
                                        <div key={s.id} className="relative pl-16 sm:pl-24 pb-12 sm:pb-16 group animate-fade-in">
                                            <div className="absolute left-[26px] sm:left-[34px] top-6 bottom-0 w-1.5 sm:w-2 bg-black/5 rounded-full group-hover:bg-[#f7d302]/10 transition-colors"></div>
                                            <div className="absolute left-4 top-4 w-8 h-8 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[16px] border-[3px] sm:border-[4px] border-white bg-gray-200 z-20 flex items-center justify-center group-hover:bg-[#f7d302] group-hover:border-black transition-all duration-500 shadow-sm">
                                                <span className="text-base sm:text-lg">📍</span>
                                            </div>

                                            <div className="flex flex-col md:flex-row justify-between items-center bg-white/70 backdrop-blur-sm p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-lg border border-black/[0.02] group-hover:border-[#f7d302] transition-all relative z-10 group-hover:-translate-y-1">
                                                <div className="flex-1 w-full mb-6 md:mb-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-[10px] font-black text-black/40 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">LEG 0{idx + 1}</span>
                                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Waitpoint</span>
                                                    </div>
                                                    <p className="font-black text-black/60 text-lg sm:text-xl tracking-tighter leading-tight uppercase line-clamp-1">{stops[idx - 1].address.split(',')[0]} → {s.address.split(',')[0]}</p>
                                                </div>
                                                <div className="flex items-center gap-4 bg-gray-50/50 p-3 sm:p-4 rounded-[24px] sm:rounded-[32px] shadow-inner group-hover:bg-[#f7d302]/10 transition-colors border border-transparent group-hover:border-[#f7d302]/20">
                                                    <button onClick={() => adjustPrice('stop', s.id, -50)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[20px] bg-white text-black flex items-center justify-center font-black hover:bg-black hover:text-white transition-all text-base sm:text-lg shadow-sm">－</button>
                                                    <div className="flex flex-col items-center w-20 sm:w-24">
                                                        <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">PRICE</span>
                                                        <div className="flex items-center">
                                                            <span className="text-xs sm:text-sm font-black text-black/20 mr-1">₹</span>
                                                            <input
                                                                type="number"
                                                                value={s.price}
                                                                onChange={(e) => updateStopPrice(s.id, e.target.value)}
                                                                className="w-full bg-transparent border-none outline-none font-black text-black text-center text-xl sm:text-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button onClick={() => adjustPrice('stop', s.id, 50)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[20px] bg-black text-white flex items-center justify-center font-black hover:bg-[#f7d302] hover:text-black transition-all text-base sm:text-lg shadow-xl shadow-black/10">＋</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Final Segment: Target Arrival */}
                                <div className="relative pl-16 sm:pl-24 group animate-fade-in">
                                    <div className="absolute left-0 top-2 w-14 h-14 sm:w-18 sm:h-18 rounded-[20px] sm:rounded-[28px] bg-black shadow-2xl shadow-black/30 z-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 scale-105 border-[4px] sm:border-[5px] border-[#f7d302]/20">
                                        <div className="relative">
                                            <span className="text-2xl sm:text-3xl">🏁</span>
                                            <div className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-[#f7d302] rounded-full animate-ping"></div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-between items-center bg-black text-white p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-2xl transition-all relative z-10 border-2 border-transparent group-hover:border-[#f7d302]/40">
                                        <div className="flex-1 w-full mb-6 md:mb-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black text-black bg-[#f7d302] px-3 py-1 rounded-full uppercase tracking-widest italic">FINALE</span>
                                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Dropoff</span>
                                            </div>
                                            <p className="font-black text-white text-lg sm:text-2xl tracking-tighter leading-tight uppercase line-clamp-1">
                                                {stops.length > 0 ? stops[stops.length - 1].address.split(',')[0] : source?.address.split(',')[0]} → {destination?.address.split(',')[0]}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white/10 p-3 sm:p-4 rounded-[24px] sm:rounded-[32px] shadow-inner group-hover:bg-[#f7d302]/10 transition-colors border border-white/5 group-hover:border-[#f7d302]/20">
                                            <button onClick={() => adjustPrice('final', null, -50)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[20px] bg-white/10 text-white flex items-center justify-center font-black hover:bg-white hover:text-black transition-all text-base sm:text-lg">－</button>
                                            <div className="flex flex-col items-center w-20 sm:w-24">
                                                <span className="text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-wider mb-1">PRICE</span>
                                                <div className="flex items-center">
                                                    <span className="text-xs sm:text-sm font-black text-white/20 mr-1">₹</span>
                                                    <input
                                                        type="number"
                                                        value={finalLegPrice}
                                                        onChange={(e) => setFinalLegPrice(e.target.value === '' ? '0' : e.target.value)}
                                                        className="w-full bg-transparent border-none outline-none font-black text-white text-center text-xl sm:text-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={() => adjustPrice('final', null, 50)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[20px] bg-[#f7d302] text-black flex items-center justify-center font-black hover:bg-white transition-all text-base sm:text-lg shadow-xl shadow-[#f7d302]/20">＋</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8">
                            <button onClick={prevStep} className="flex-1 py-8 bg-black/5 text-gray-400 font-black rounded-[40px] hover:bg-black hover:text-white transition-all uppercase tracking-[0.2em] text-sm border-2 border-transparent">Adjust Schedule</button>
                            <button
                                onClick={nextStep}
                                disabled={(stops.reduce((acc, s) => acc + parseFloat(s.price || '0'), 0) + parseFloat(finalLegPrice || '0')) <= 0}
                                className={`flex-[2] py-8 rounded-[40px] font-black text-2xl uppercase tracking-[0.2em] shadow-2xl transition-all relative overflow-hidden group ${((stops.reduce((acc, s) => acc + parseFloat(s.price || '0'), 0) + parseFloat(finalLegPrice || '0')) <= 0) ? 'bg-black/10 text-black/20 cursor-not-allowed' : 'bg-[#f7d302] text-black hover:bg-black hover:text-white hover:-translate-y-1 shadow-[#f7d302]/30'}`}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-4">
                                    Continue to Review <span className="text-3xl group-hover:translate-x-2 transition-transform">➔</span>
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 7: FINAL REVIEW (Blinkit Style) */}
                {step === 7 && (
                    <div className="bg-white rounded-[48px] shadow-2xl p-10 md:p-16 border border-black/5 animate-fade-in relative">
                        <button
                            onClick={prevStep}
                            className="absolute top-8 left-8 w-12 h-12 bg-white border border-black/5 rounded-2xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all z-50 group active:scale-90"
                            title="Go Back"
                        >
                            <span className="text-xl group-hover:-translate-x-1 transition-transform">⬅️</span>
                        </button>
                        <h2 className="text-5xl font-black text-black mb-12 tracking-tighter leading-none">Ready for <br /><span className="bg-[#f7d302] px-4 py-1 inline-block -rotate-1 italic">Takeoff?</span></h2>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-gray-50 rounded-[40px] p-10 border border-black/5 relative overflow-hidden shadow-inner">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#f7d302]/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                                    <div className="relative space-y-10">
                                        <div className="flex gap-8 items-start">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-6 h-6 rounded-xl border-4 border-black bg-[#f7d302] shadow-sm"></div>
                                                <div className="w-1.5 h-full min-h-[48px] bg-black/5 rounded-full"></div>
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Departure Point</p>
                                                <p className="font-black text-black text-lg tracking-tight leading-snug uppercase">{source?.address}</p>
                                            </div>
                                        </div>

                                        {/* Segments in Review */}
                                        {stops.map((s, idx) => (
                                            <div key={s.id} className="flex gap-8 items-start pl-1.5">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full bg-black/10"></div>
                                                    <div className="w-1.5 h-full min-h-[32px] bg-black/5 rounded-full"></div>
                                                </div>
                                                <div className="flex-1 flex justify-between items-center bg-white p-5 rounded-[24px] border border-black/5 shadow-sm">
                                                    <div>
                                                        <p className="text-[8px] font-black text-[#f7d302] uppercase tracking-widest mb-1">Leg 0{idx + 1}</p>
                                                        <p className="text-xs font-black text-black/60 truncate max-w-[200px] uppercase tracking-tighter">
                                                            → {s.address.split(',')[0]}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] font-black opacity-30">₹</span>
                                                        <span className="text-sm font-black text-black">{s.price}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Final Segment in Review */}
                                        <div className="flex gap-8 items-start pl-1.5">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-black/10"></div>
                                                <div className="w-1.5 h-full min-h-[32px] bg-black/5 rounded-full"></div>
                                            </div>
                                            <div className="flex-1 flex justify-between items-center bg-white p-5 rounded-[24px] border border-black/5 shadow-sm">
                                                <div>
                                                    <p className="text-[8px] font-black text-[#f7d302] uppercase tracking-widest mb-1">Final Dest</p>
                                                    <p className="text-xs font-black text-black/60 truncate max-w-[200px] uppercase tracking-tighter">
                                                        → {destination?.address.split(',')[0]}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-black opacity-30">₹</span>
                                                    <span className="text-sm font-black text-black">{finalLegPrice}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-8 items-start">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-1.5 h-6 bg-black/5 rounded-full"></div>
                                                <div className="w-6 h-6 rounded-xl bg-black shadow-xl shadow-black/10 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-[#f7d302] rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="flex-1 pt-4">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Final Destination</p>
                                                <p className="font-black text-black text-lg tracking-tight leading-snug uppercase">{destination?.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-black rounded-[40px] p-10 text-white shadow-2xl shadow-black/20 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#f7d302] mb-3 leading-none italic">Verified Journey</p>
                                        <p className="text-6xl font-black mb-10 tracking-tighter">₹{fullJourneyPrice}</p>
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 group/item">
                                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl group-hover/item:scale-110 transition-transform">📅</div>
                                                <span className="font-black text-sm uppercase tracking-widest opacity-80">{date}</span>
                                            </div>
                                            <div className="flex items-center gap-4 group/item">
                                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl group-hover/item:scale-110 transition-transform">⏰</div>
                                                <span className="font-black text-sm uppercase tracking-widest opacity-80">{time}</span>
                                            </div>
                                            <div className="flex items-center gap-4 group/item">
                                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl group-hover/item:scale-110 transition-transform">👥</div>
                                                <span className="font-black text-sm uppercase tracking-widest opacity-80">{seats} Available Seats</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Save as Template Option */}
                                <div className="bg-gray-50 p-6 rounded-[32px] border border-black/5 flex items-center justify-between group hover:bg-[#f7d302]/5 transition-colors cursor-pointer" onClick={() => setSaveAsTemplate(!saveAsTemplate)}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${saveAsTemplate ? 'bg-[#f7d302] text-black shadow-lg scale-110' : 'bg-white text-gray-300'}`}>
                                            {saveAsTemplate ? '⭐️' : '☆'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-black">Save as Template</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Easy quick-publish from home</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative transition-all ${saveAsTemplate ? 'bg-black' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${saveAsTemplate ? 'left-7' : 'left-1'}`}></div>
                                    </div>
                                </div>

                                <div className="space-y-4">

                                    <button
                                        onClick={handleCreateRide}
                                        disabled={loading}
                                        className="w-full py-7 bg-[#f7d302] text-black font-black rounded-[32px] shadow-2xl shadow-[#f7d302]/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xl flex items-center justify-center gap-5"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
                                                Deploying...
                                            </>
                                        ) : (
                                            <>Launch Ride 🚀</>
                                        )}
                                    </button>
                                    <button onClick={prevStep} className="w-full py-5 text-gray-400 font-black rounded-[24px] hover:bg-black hover:text-white transition-all uppercase tracking-widest text-xs">Edit Details</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 8: SUCCESS SCREEN (Blinkit Style) */}
                {step === 8 && isPublished && (
                    <div className="bg-white rounded-[48px] shadow-2xl p-10 md:p-16 border border-black/5 animate-fade-in text-center max-w-2xl mx-auto">
                        <div className="w-32 h-32 bg-[#f7d302] rounded-[40px] flex items-center justify-center text-6xl mx-auto mb-10 shadow-2xl shadow-[#f7d302]/20 relative">
                            <span className="relative z-10">🚀</span>
                            <div className="absolute inset-0 bg-white rounded-[40px] animate-ping opacity-20"></div>
                        </div>
                        <h2 className="text-5xl font-black text-black mb-6 tracking-tighter leading-none">
                            Ride Published <br />
                            <span className="bg-[#f7d302] px-4 py-1 inline-block rotate-1">Successfully!</span>
                        </h2>
                        <p className="text-gray-500 font-bold mb-12 text-lg">
                            Your ride is now live and visible to potential passengers. <br />
                            Get ready for a great journey!
                        </p>
                        <div className="space-y-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-6 bg-black text-white font-black rounded-[32px] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xl"
                            >
                                Go to Dashboard ➔
                            </button>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                Redirecting automatically in 5 seconds...
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// Helper component to auto-fit map bounds for a specific route
const RouteAutoFit: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.flyToBounds(bounds, { padding: [100, 100], duration: 1.5 });
        }
    }, [coords, map]);
    return null;
};

// Helper component to auto-fit map bounds
const MapBounds: React.FC<{ source: Location | null, dest: Location | null }> = ({ source, dest }) => {
    const map = useMap();
    useEffect(() => {
        if (source && dest) {
            const bounds = L.latLngBounds([source.lat, source.lng], [dest.lat, dest.lng]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [source, dest, map]);
    return null;
};

export default RideCreationFlow;
