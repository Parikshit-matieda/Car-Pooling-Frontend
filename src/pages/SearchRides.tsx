import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import Navbar from '../components/Navbar';
import api from '../api';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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
    driver_name: string;
    profile_image: string;
    vehicle_make: string;
    vehicle_model: string;
    route_polyline: string;
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
    const [activeRide, setActiveRide] = useState<Ride | null>(null);

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
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
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
            if (res.data.length === 0) {
                setError('No rides found matching your route. Try adjusting your search area.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans">
            <Navbar />

            {/* Search Header (Blinkit High Contrast) */}
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

            <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-200px)] overflow-hidden">
                {/* Search Results List */}
                <div className="lg:w-[480px] bg-white border-r border-gray-100 overflow-y-auto p-8 animate-fade-in">
                    {error && <div className="bg-red-50 text-red-600 p-6 rounded-3xl mb-8 font-black text-xs uppercase tracking-widest border border-red-100">🚫 {error}</div>}

                    {!loading && rides.length === 0 && !error && (
                        <div className="text-center py-32 opacity-20">
                            <span className="text-8xl mb-6 block">⚡</span>
                            <p className="text-sm font-black uppercase tracking-widest leading-relaxed">Enter pickup & destination<br />to see available rides</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {rides.map(ride => (
                            <div
                                key={ride.ride_id}
                                onMouseEnter={() => setActiveRide(ride)}
                                className={`p-8 rounded-[40px] border-2 transition-all cursor-pointer group ${activeRide?.ride_id === ride.ride_id ? 'border-black bg-gray-50' : 'border-gray-50 hover:border-black/10 bg-white'}`}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-[#f7d302] rounded-[24px] overflow-hidden border-2 border-white shadow-lg shadow-yellow-100 flex items-center justify-center text-black font-black text-xl">
                                            {ride.profile_image ? <img src={ride.profile_image} alt="" className="w-full h-full object-cover" /> : ride.driver_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Driver Profile</p>
                                            <p className="font-black text-black text-lg leading-none">{ride.driver_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Price</p>
                                        <p className="text-3xl font-black text-black tracking-tight">₹{ride.base_price}</p>
                                    </div>
                                </div>

                                <div className="space-y-5 relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 before:rounded-full">
                                    <div className="relative">
                                        <div className="absolute -left-7 top-1.5 w-3 h-3 rounded-full border-4 border-white bg-[#f7d302] shadow-sm"></div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup</p>
                                        <p className="text-[13px] font-black text-gray-700 truncate">{ride.source}</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-7 top-1.5 w-3 h-3 rounded-full border-4 border-white bg-black shadow-sm"></div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Destination</p>
                                        <p className="text-[13px] font-black text-gray-700 truncate">{ride.destination}</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-2 rounded-xl">
                                            <span className="text-sm">🕒</span>
                                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{ride.ride_time}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-2 rounded-xl">
                                            <span className="text-sm">👥</span>
                                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{ride.available_seats} Seats</span>
                                        </div>
                                    </div>
                                    <button className="bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-black/10">Book ✨</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Map Visualization */}
                <div className="flex-1 relative bg-gray-100">
                    <MapContainer center={[20, 78]} zoom={5} style={{ height: '100%', width: '100%' }} className="z-10">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {pickup && <Marker position={[pickup.lat, pickup.lng]} />}
                        {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} />}

                        {activeRide && (
                            <>
                                <Marker position={[activeRide.source_lat, activeRide.source_lng]} />
                                <Marker position={[activeRide.dest_lat, activeRide.dest_lng]} />
                                {(() => {
                                    try {
                                        const poly = JSON.parse(activeRide.route_polyline);
                                        return <Polyline positions={poly} color="#4f46e5" weight={6} opacity={0.6} />
                                    } catch (e) { return null; }
                                })()}
                                {activeRide.stops.map((s, idx) => (
                                    <Marker key={idx} position={[s.latitude, s.longitude]} icon={L.divIcon({ html: `<div class="bg-indigo-600 w-4 h-4 rounded-full border-2 border-white shadow-md"></div>`, className: '' })} />
                                ))}
                                <MapAutoFit ride={activeRide} pickup={pickup} dropoff={dropoff} />
                            </>
                        )}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

const MapAutoFit: React.FC<{ ride: Ride, pickup: Location | null, dropoff: Location | null }> = ({ ride, pickup, dropoff }) => {
    const map = useMap();
    useEffect(() => {
        const points: [number, number][] = [
            [ride.source_lat, ride.source_lng],
            [ride.dest_lat, ride.dest_lng]
        ];
        if (pickup) points.push([pickup.lat, pickup.lng]);
        if (dropoff) points.push([dropoff.lat, dropoff.lng]);

        try {
            const poly = JSON.parse(ride.route_polyline);
            if (Array.isArray(poly)) points.push(...poly);
        } catch (e) { }

        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.flyToBounds(bounds, { padding: [100, 100], duration: 1.5 });
        }
    }, [ride, pickup, dropoff, map]);
    return null;
}

export default SearchRides;
