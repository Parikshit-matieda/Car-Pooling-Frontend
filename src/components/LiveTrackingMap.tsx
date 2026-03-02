import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import io, { Socket } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
// Fix for default marker icons in Leaflet with React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});
// Custom Car Icon for Driver
const carIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854866.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
});
interface LiveTrackingMapProps {
    rideId: number;
    isDriver: boolean;
    pickup: { lat: number; lng: number, address: string };
    destination: { lat: number; lng: number, address: string };
}
// Component to auto-resize and center map
const ChangeView = ({ center }: { center: L.LatLngExpression }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
};
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || `http://${window.location.hostname}:4000`;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:4000`;
const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ rideId, isDriver, pickup, destination }) => {
    const [driverLocation, setDriverLocation] = useState<[number, number] | null>(
        // Driver already knows their own location starts at pickup; passenger starts null
        isDriver ? [pickup.lat, pickup.lng] : null
    );
    const socketRef = useRef<Socket | null>(null);
    // --- FIX 1: Passenger fetches last-known driver location on mount ---
    useEffect(() => {
        if (isDriver) return;
        const token = localStorage.getItem('token');
        fetch(`${BACKEND_URL}/api/rides/${rideId}/location`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                if (!res.ok) return null;
                return res.json();
            })
            .then(data => {
                if (data?.lat && data?.lng) {
                    setDriverLocation([data.lat, data.lng]);
                }
            })
            .catch(() => {
                // No location yet - socket will update it once driver moves
            });
    }, [rideId, isDriver]);
    // --- FIX 2: removed `pickup` from deps to prevent constant re-subscription ---
    useEffect(() => {
        const socketUrl = SOCKET_URL;
        socketRef.current = io(socketUrl);
        socketRef.current.emit('join-ride', rideId.toString());
        if (isDriver) {
            // Geolocation tracking for Driver
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newLoc: [number, number] = [latitude, longitude];
                    setDriverLocation(newLoc);
                    socketRef.current?.emit('update-location', {
                        rideId: rideId.toString(),
                        lat: latitude,
                        lng: longitude
                    });
                },
                (error) => console.error('Error watching position:', error),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
            return () => {
                navigator.geolocation.clearWatch(watchId);
                socketRef.current?.disconnect();
            };
        } else {
            // Listen for updates for Rider
            socketRef.current.on('location-updated', (data: { lat: number; lng: number }) => {
                setDriverLocation([data.lat, data.lng]);
            });
            return () => {
                socketRef.current?.disconnect();
            };
        }
    }, [rideId, isDriver]); // pickup removed from deps
    const centerLocation: L.LatLngExpression = driverLocation || [pickup.lat, pickup.lng];
    return (
        <div className="h-[400px] w-full rounded-[32px] overflow-hidden shadow-2xl border-4 border-white relative">
            <MapContainer center={centerLocation} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <ChangeView center={centerLocation} />
                {/* Pickup Marker */}
                <Marker position={[pickup.lat, pickup.lng]}>
                    <Popup>
                        <div className="font-black text-xs uppercase tracking-widest text-[#f7d302]">Boarding Point</div>
                        <div className="font-bold text-black">{pickup.address}</div>
                    </Popup>
                </Marker>
                {/* Destination Marker */}
                <Marker position={[destination.lat, destination.lng]}>
                    <Popup>
                        <div className="font-black text-xs uppercase tracking-widest text-black">Dropping Point</div>
                        <div className="font-bold text-black">{destination.address}</div>
                    </Popup>
                </Marker>
                {/* Driver Marker */}
                {driverLocation && (
                    <Marker position={driverLocation} icon={carIcon}>
                        <Popup>
                            <div className="font-black text-xs uppercase tracking-widest text-black">Driver is here</div>
                        </Popup>
                    </Marker>
                )}
                {/* Path Line */}
                <Polyline
                    positions={[[pickup.lat, pickup.lng], [destination.lat, destination.lng]]}
                    color="black"
                    weight={3}
                    dashArray="10, 10"
                    opacity={0.3}
                />
            </MapContainer>
            <div className="absolute top-6 left-6 z-[1000] bg-black text-white px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Live Tracking Active
            </div>
            {isDriver && (
                <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-black/5 shadow-2xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Broadcasting Status</p>
                    <p className="text-xs font-bold text-black">Your location is visible to passengers</p>
                </div>
            )}
            {!isDriver && !driverLocation && (
                <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-black/5 shadow-2xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Waiting for driver</p>
                    <p className="text-xs font-bold text-black">Driver location will appear shortly</p>
                </div>
            )}
        </div>
    );
};
export default LiveTrackingMap;
