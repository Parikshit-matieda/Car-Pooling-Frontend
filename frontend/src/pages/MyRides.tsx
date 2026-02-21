import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';
import LiveTrackingMap from '../components/LiveTrackingMap';
import { Calendar, Clock, Star, Users, CheckCircle } from 'lucide-react';
import RatePassengersModal from '../components/RatePassengersModal';

const MyRides: React.FC = () => {
    const location = useLocation();
    const locationState = location.state as { tab?: string; activeTab?: string; autoTrack?: boolean } | null;

    const [mainTab, setMainTab] = useState<'PUBLISHED' | 'TAKEN'>(
        locationState?.tab === 'TAKEN' ? 'TAKEN' : 'PUBLISHED'
    );
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY' | 'CANCELLED'>(
        (locationState?.activeTab as 'ACTIVE' | 'HISTORY' | 'CANCELLED') || 'ACTIVE'
    );
    const [rides, setRides] = useState<{ active: any[], history: any[], cancelled: any[] }>({
        active: [], history: [], cancelled: []
    });
    const [loading, setLoading] = useState(true);
    const [trackingRide, setTrackingRide] = useState<any | null>(null);
    const [expandedMapId, setExpandedMapId] = useState<number | null>(null);
    const [endingRideId, setEndingRideId] = useState<number | null>(null);
    const [completionBanner, setCompletionBanner] = useState<string | null>(null);

    // Passenger rating modal state
    const [passengerRatingModal, setPassengerRatingModal] = useState<{ ride: any } | null>(null);
    const [driverRatedRides, setDriverRatedRides] = useState<Record<number, boolean>>({}); // ride_id -> if ALL passengers rated

    // Rating modal state
    const [ratingModal, setRatingModal] = useState<{ ride: any } | null>(null);
    const [ratingValue, setRatingValue] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingBanner, setRatingBanner] = useState<string | null>(null);

    // Track which rides the current user has already rated (ride_id -> true)
    const [ratedRides, setRatedRides] = useState<Record<number, boolean>>({});

    const fetchRides = async () => {
        try {
            const res = await api.get('/users/me/rides');
            setRides(res.data);
        } catch (err) {
            console.error('Failed to fetch rides', err);
        } finally {
            setLoading(false);
        }
    };

    const checkDriverRatedStatus = async (historyRides: any[]) => {
        const driverCompleted = historyRides.filter(r => r.type === 'DRIVER' && r.status === 'COMPLETED');
        const results: Record<number, boolean> = {};
        await Promise.all(
            driverCompleted.map(async (ride) => {
                try {
                    const res = await api.get(`/ratings/ride-passengers/${ride.ride_id}`);
                    // If no unrated passengers found, then it's done
                    const allRated = res.data.every((p: any) => p.has_rated);
                    results[ride.ride_id] = allRated && res.data.length > 0;
                } catch {
                    results[ride.ride_id] = false;
                }
            })
        );
        setDriverRatedRides(results);
    };

    // After fetching rides, check which completed TAKEN rides are already rated
    const checkRatedStatus = async (historyRides: any[]) => {
        const passengerCompleted = historyRides.filter(r => r.type === 'PASSENGER' && (r.status === 'COMPLETED' || r.booking_status === 'COMPLETED'));
        const results: Record<number, boolean> = {};
        await Promise.all(
            passengerCompleted.map(async (ride) => {
                try {
                    const res = await api.get(`/ratings/check?ride_id=${ride.ride_id}`);
                    results[ride.ride_id] = res.data.hasRated;
                } catch {
                    results[ride.ride_id] = false;
                }
            })
        );
        setRatedRides(results);
    };

    useEffect(() => {
        fetchRides();
    }, []);

    useEffect(() => {
        if (rides.history.length > 0) {
            checkRatedStatus(rides.history);
            checkDriverRatedStatus(rides.history);
        }
    }, [rides.history]);

    // Track My Ride auto-tracking logic
    useEffect(() => {
        if (locationState?.autoTrack && !loading && rides.active.length > 0) {
            // Find the first active booking that is STARTED
            const activeBooking = rides.active.find(r =>
                r.type === 'PASSENGER' &&
                (r.status === 'STARTED' || r.status === 'ACTIVE')
            );

            if (activeBooking) {
                setTrackingRide({ ...activeBooking, isDriver: false });
            }
        }
    }, [locationState?.autoTrack, loading, rides.active]);

    const handleCancel = async (ride: any) => {
        const isDriver = ride.type === 'DRIVER';
        const confirmMsg = isDriver
            ? 'Are you sure you want to cancel this ride? All passengers will be notified and their bookings will be cancelled.'
            : 'Are you sure you want to cancel your booking?';
        if (!window.confirm(confirmMsg)) return;
        try {
            if (isDriver) {
                await api.patch(`/rides/${ride.ride_id}/cancel`, { reason: 'Cancelled by driver' });
            } else {
                await api.patch(`/bookings/${ride.booking_id}/cancel`);
            }
            fetchRides();
        } catch (err) {
            console.error('Failed to cancel', err);
            alert('Failed to cancel. Please try again.');
        }
    };

    const handleCompleteRide = (rideId: number) => setEndingRideId(rideId);

    const confirmEndRide = async (rideId: number) => {
        setEndingRideId(null);
        try {
            const res = await api.patch(`/rides/${rideId}/complete`);
            const passengerCount = res.data.completedPassengers?.length || 0;
            setCompletionBanner(
                passengerCount > 0
                    ? `🏁 Ride completed! ${passengerCount} passenger${passengerCount > 1 ? 's have' : ' has'} been notified.`
                    : '🏁 Ride completed successfully!'
            );
            setTimeout(() => setCompletionBanner(null), 8000);
            fetchRides();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to end ride. Please try again.');
        }
    };

    const handleBookingAction = async (bookingId: number, action: 'APPROVE' | 'REJECT') => {
        try {
            await api.patch(`/bookings/${bookingId}/action`, { action });
            fetchRides(); // Refresh data to reflect status change
        } catch (err: any) {
            alert(err.response?.data?.message || `Failed to ${action.toLowerCase()} booking.`);
        }
    };

    const handleSubmitRating = async () => {
        if (!ratingModal || ratingValue === 0) return;
        setRatingSubmitting(true);
        try {
            await api.post('/ratings', {
                ride_id: ratingModal.ride.ride_id,
                rating: ratingValue,
                review: reviewText.trim() || undefined,
            });
            setRatedRides(prev => ({ ...prev, [ratingModal.ride.ride_id]: true }));
            setRatingModal(null);
            setRatingValue(0);
            setReviewText('');
            setRatingBanner('⭐ Thank you! Your review has been submitted and the driver has been notified.');
            setTimeout(() => setRatingBanner(null), 7000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to submit rating. Please try again.');
        } finally {
            setRatingSubmitting(false);
        }
    };

    const RideCard = ({ ride, isExpanded, onToggleExpand }: { ride: any; isExpanded: boolean; onToggleExpand: () => void }) => {
        const isDriver = ride.type === 'DRIVER';
        const isCancelled = ride.status === 'CANCELLED' || ride.booking_status === 'CANCELLED';
        const isCompleted = ride.status === 'COMPLETED' || ride.booking_status === 'COMPLETED';
        const isPassengerCompleted = !isDriver && isCompleted;
        const alreadyRated = ratedRides[ride.ride_id];

        const getDateLabel = (dateString: string) => {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
            const rideDate = new Date(dateString); rideDate.setHours(0, 0, 0, 0);
            if (rideDate.getTime() === today.getTime()) return 'Today';
            if (rideDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
            return 'Upcoming';
        };

        const dateLabel = getDateLabel(ride.ride_date);
        const labelColors = {
            'Today': 'bg-indigo-500 text-white',
            'Tomorrow': 'bg-amber-500 text-white',
            'Upcoming': 'bg-blue-500 text-white'
        };

        return (
            <div className={`bg-white rounded-[40px] p-8 border border-black/5 shadow-sm hover:shadow-xl transition-all relative overflow-hidden ${isCancelled ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                {isCancelled && <div className="absolute top-0 right-0 bg-red-500 text-white px-6 py-2 rounded-bl-[24px] font-black text-[10px] uppercase tracking-widest z-10">Cancelled</div>}
                {isCompleted && <div className="absolute top-0 right-0 bg-green-500 text-white px-6 py-2 rounded-bl-[24px] font-black text-[10px] uppercase tracking-widest z-10">Completed</div>}
                {!isCancelled && !isCompleted && (
                    <div className={`absolute top-0 right-0 ${labelColors[dateLabel as keyof typeof labelColors]} px-6 py-2 rounded-bl-[24px] font-black text-[10px] uppercase tracking-widest z-10`}>{dateLabel}</div>
                )}

                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 ${isDriver ? 'bg-yellow-400' : 'bg-black text-white'} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                            {isDriver ? '🚗' : '🎫'}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isDriver ? 'You are Driving' : 'You are Passenger'}</p>
                            <h3 className="text-xl font-black text-black tracking-tight flex items-center gap-2">
                                {isDriver ? 'Your Ride' : `With ${ride.driver_name}`}
                                {ride.driver_photo && <img src={`http://localhost:4000/${ride.driver_photo}`} className="w-6 h-6 rounded-full object-cover border border-white shadow-sm" alt="" />}
                            </h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-black tracking-tighter">₹{ride.base_price || ride.price}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Cost</p>
                    </div>
                </div>

                <div className="space-y-6 mb-8 relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100"></div>
                    <div className="flex items-start gap-4 relative">
                        <div className="w-4 h-4 rounded-full bg-yellow-400 border-4 border-white shadow-sm z-10 mt-1"></div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup</p>
                            <p className="font-bold text-black text-sm">{ride.source}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 relative">
                        <div className="w-4 h-4 rounded-full bg-black border-4 border-white shadow-sm z-10 mt-1"></div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dropoff</p>
                            <p className="font-bold text-black text-sm">{ride.destination}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-3xl">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Calendar size={12} className="text-yellow-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Date</span>
                        </div>
                        <p className="text-xs font-black text-black italic">{new Date(ride.ride_date).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-3xl">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Clock size={12} className="text-yellow-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Time</span>
                        </div>
                        <p className="text-xs font-black text-black italic">{ride.ride_time}</p>
                    </div>
                </div>

                {/* Pending Requests list for Drivers */}
                {isDriver && ride.pending_requests && ride.pending_requests.length > 0 && (
                    <div className="mb-6 p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> New Booking Requests ({ride.pending_requests.length})
                        </p>
                        <div className="space-y-4">
                            {ride.pending_requests.map((req: any) => (
                                <div key={req.booking_id} className="bg-white p-4 rounded-2xl border border-indigo-100/50 shadow-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-xl overflow-hidden border border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600">
                                                {req.profile_photo ? (
                                                    <img src={`http://localhost:4000/${req.profile_photo}`} className="w-full h-full object-cover" alt="" />
                                                ) : req.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-black">{req.full_name}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Requested {req.seats_booked} {req.seats_booked === 1 ? 'Seat' : 'Seats'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleBookingAction(req.booking_id, 'REJECT')}
                                                className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-100"
                                                title="Reject"
                                            >
                                                ×
                                            </button>
                                            <button
                                                onClick={() => handleBookingAction(req.booking_id, 'APPROVE')}
                                                className="px-4 h-10 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center gap-2"
                                            >
                                                Approve ✓
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Confirmed Passengers list for Drivers */}
                {isDriver && ride.confirmed_passengers && ride.confirmed_passengers.length > 0 && (
                    <div className="mb-6 p-6 bg-yellow-50/50 rounded-[32px] border border-yellow-100">
                        <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Users size={12} /> Confirmed Passengers ({ride.confirmed_passengers.length})
                        </p>
                        <div className="space-y-4">
                            {ride.confirmed_passengers.map((p: any, i: number) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl border border-yellow-100 overflow-hidden shadow-sm flex items-center justify-center text-xs font-black text-black">
                                            {p.profile_photo ? (
                                                <img
                                                    src={`http://localhost:4000/${p.profile_photo}`}
                                                    className="w-full h-full object-cover"
                                                    alt=""
                                                />
                                            ) : p.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-black">{p.full_name}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Boarding at {ride.source.split(',')[0]}</p>
                                        </div>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ⭐ Reviews & Ratings section for completed passenger rides */}
                {isPassengerCompleted && (
                    <div className="mt-2">
                        {alreadyRated ? (
                            <div className="w-full py-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                <Star size={14} fill="currentColor" />
                                Reviews & Ratings — Submitted ✓
                            </div>
                        ) : (
                            <button
                                onClick={() => { setRatingModal({ ride }); setRatingValue(0); setReviewText(''); }}
                                className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/30"
                            >
                                <Star size={14} />
                                Reviews &amp; Ratings
                            </button>
                        )}
                    </div>
                )}

                {/* 👥 Reviews & Ratings section for completed driver rides (Rate Passengers) */}
                {isDriver && isCompleted && (
                    <div className="mt-2">
                        {driverRatedRides[ride.ride_id] ? (
                            <div className="w-full py-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                <CheckCircle size={14} />
                                Passengers Rated ✓
                            </div>
                        ) : (
                            <button
                                onClick={() => setPassengerRatingModal({ ride })}
                                className="w-full py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                            >
                                <Users size={14} />
                                Rate Passengers
                            </button>
                        )}
                    </div>
                )}

                {/* Active/Started ride controls */}
                {!isCancelled && !isCompleted && (ride.status === 'ACTIVE' || ride.status === 'STARTED') && (
                    <div className="space-y-4 mt-2">
                        {ride.status === 'STARTED' ? (
                            <div className="space-y-4">
                                <div onClick={onToggleExpand} className={`${isExpanded ? 'h-[500px]' : 'h-[250px]'} w-full rounded-[32px] overflow-hidden border-2 ${isDriver ? 'border-yellow-400' : 'border-indigo-400'} shadow-lg relative cursor-pointer transition-all duration-300 ease-in-out`}>
                                    <div className={`absolute top-4 right-4 z-10 ${isDriver ? 'bg-black/50' : 'bg-indigo-600/50'} text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-sm`}>
                                        {isExpanded ? 'Click to Shrink' : 'Click to Expand'}
                                    </div>
                                    <LiveTrackingMap rideId={ride.ride_id} isDriver={isDriver} pickup={{ lat: Number(ride.source_lat), lng: Number(ride.source_lng), address: ride.source }} destination={{ lat: Number(ride.dest_lat), lng: Number(ride.dest_lng), address: ride.destination }} />
                                </div>
                                <div className="flex gap-3">
                                    {isDriver ? (
                                        <button onClick={() => handleCompleteRide(ride.ride_id)} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20">
                                            End Ride ➔
                                        </button>
                                    ) : (
                                        <button onClick={() => setTrackingRide({ ...ride, isDriver: false })} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                            Full Tracking View
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={async () => {
                                        if (isDriver && ride.status === 'ACTIVE') {
                                            if (!window.confirm("Are you sure you want to start the journey? This will notify all passengers.")) return;
                                            try { await api.patch(`/rides/${ride.ride_id}/start`); fetchRides(); } catch (err) { console.error('Failed to notify passengers', err); return; }
                                        }
                                        setTrackingRide({ ...ride, isDriver });
                                    }}
                                    className={`flex-[2] py-4 ${isDriver ? 'bg-yellow-400 text-black' : 'bg-black text-white'} rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/5`}
                                >
                                    {isDriver ? 'Start Journey 📡' : (<><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>Track Driver Live</>)}
                                </button>
                                <button onClick={() => handleCancel(ride)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    const currentRides = rides[activeTab.toLowerCase() as keyof typeof rides]
        .filter(r => mainTab === 'PUBLISHED' ? r.type === 'DRIVER' : r.type === 'PASSENGER');

    const getCount = (tab: string) =>
        rides[tab.toLowerCase() as keyof typeof rides]
            .filter(r => mainTab === 'PUBLISHED' ? r.type === 'DRIVER' : r.type === 'PASSENGER').length;

    return (
        <div className="min-h-screen bg-[#f8f8f8] font-sans">
            <Navbar />

            {/* Completion Banner */}
            {completionBanner && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-2xl animate-fade-in max-w-lg text-center">
                    {completionBanner}
                </div>
            )}

            {/* Rating Submitted Banner */}
            {ratingBanner && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-yellow-400 text-black px-8 py-4 rounded-2xl font-black text-sm shadow-2xl animate-fade-in max-w-lg text-center">
                    {ratingBanner}
                </div>
            )}

            {/* End Ride Confirmation Modal */}
            {endingRideId !== null && (() => {
                const rideToEnd = rides.active.find(r => r.ride_id === endingRideId);
                return (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10 border border-black/5">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">🏁</div>
                            <h3 className="text-2xl font-black text-black text-center tracking-tighter mb-2">End This Ride?</h3>
                            <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest text-center mb-2">
                                {rideToEnd ? `${rideToEnd.source?.split(',')[0]} → ${rideToEnd.destination?.split(',')[0]}` : ''}
                            </p>
                            <p className="text-gray-500 text-sm text-center mb-8">All passengers will be notified. This cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setEndingRideId(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                                <button onClick={() => confirmEndRide(endingRideId)} className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">Yes, End Ride ✓</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Reviews & Ratings Modal */}
            {ratingModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10 border border-black/5">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">⭐</div>
                            <h3 className="text-2xl font-black text-black tracking-tighter">Reviews &amp; Ratings</h3>
                            <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest mt-1">
                                {ratingModal.ride.source?.split(',')[0]} → {ratingModal.ride.destination?.split(',')[0]}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">Driver: <strong>{ratingModal.ride.driver_name}</strong></p>
                        </div>

                        {/* Star Selector */}
                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRatingValue(star)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={36}
                                        className={`transition-colors ${star <= (hoverRating || ratingValue) ? 'text-yellow-400' : 'text-gray-200'}`}
                                        fill={star <= (hoverRating || ratingValue) ? 'currentColor' : 'currentColor'}
                                    />
                                </button>
                            ))}
                        </div>
                        {ratingValue > 0 && (
                            <p className="text-center text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][ratingValue]}
                            </p>
                        )}

                        {/* Review text */}
                        <textarea
                            value={reviewText}
                            onChange={e => setReviewText(e.target.value)}
                            placeholder="Share your experience (optional)..."
                            rows={3}
                            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:border-yellow-400 mb-6"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setRatingModal(null); setRatingValue(0); setReviewText(''); }}
                                className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitRating}
                                disabled={ratingValue === 0 || ratingSubmitting}
                                className="flex-[2] py-4 bg-yellow-400 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-yellow-400/30"
                            >
                                {ratingSubmitting ? 'Submitting...' : 'Submit Review ✓'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Driver Rating Modal (Rate Passengers) */}
            {passengerRatingModal && (
                <RatePassengersModal
                    ride={passengerRatingModal.ride}
                    onClose={() => setPassengerRatingModal(null)}
                    onSuccess={(msg: string) => {
                        setRatingBanner(msg);
                        setTimeout(() => setRatingBanner(null), 7000);
                        fetchRides(); // Refresh to update rated status
                    }}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div className="space-y-6">
                        <div>
                            <div className="bg-yellow-400 text-black px-4 py-1.5 rounded-full inline-block font-black text-[10px] uppercase tracking-[0.2em] mb-4">Your Journeys</div>
                            <h1 className="text-6xl font-[1000] text-black tracking-tighter leading-none">
                                My <span className="text-yellow-400" style={{ WebkitTextStroke: '2px black' }}>Rides</span>
                            </h1>
                        </div>
                        <div className="inline-flex bg-white p-1.5 rounded-3xl border border-black/5 shadow-lg">
                            {(['PUBLISHED', 'TAKEN'] as const).map(tab => (
                                <button key={tab} onClick={() => setMainTab(tab)} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${mainTab === tab ? 'bg-yellow-400 text-black shadow-md' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}>
                                    {tab === 'PUBLISHED' ? 'Published' : 'Taken'} Rides
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-2 rounded-[32px] flex flex-wrap gap-2 border border-black/5 shadow-xl">
                        {(['ACTIVE', 'HISTORY', 'CANCELLED'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-black text-white shadow-xl translate-y-[-2px]' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}>
                                {tab}
                                {getCount(tab) > 0 && <span className="ml-2 opacity-50">({getCount(tab)})</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {currentRides.length === 0 ? (
                    <div className="bg-white rounded-[64px] py-40 text-center border-2 border-dashed border-gray-100">
                        <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center text-5xl mx-auto mb-10">
                            {activeTab === 'ACTIVE' ? '🚗' : activeTab === 'HISTORY' ? '📚' : '🛑'}
                        </div>
                        <h2 className="text-3xl font-black text-black mb-4 uppercase tracking-tight">No rides found</h2>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-10 italic">
                            {activeTab === 'ACTIVE' ? "You don't have any active rides." : activeTab === 'HISTORY' ? "Your ride history is empty." : "No cancelled rides."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {currentRides.map((ride, idx) => (
                            <RideCard key={idx} ride={ride} isExpanded={expandedMapId === ride.ride_id} onToggleExpand={() => setExpandedMapId(expandedMapId === ride.ride_id ? null : ride.ride_id)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Live Tracking Modal */}
            {trackingRide && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-4xl overflow-hidden border border-black/5 relative">
                        <button onClick={() => setTrackingRide(null)} className="absolute top-8 right-8 z-[1001] w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black text-xl hover:scale-110 transition-transform shadow-2xl">×</button>
                        <div className="p-10 md:p-14">
                            <div className="mb-8">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Live Trip Tracking</p>
                                <h3 className="text-3xl font-black text-black tracking-tighter leading-none">{trackingRide.source} ➔ {trackingRide.destination}</h3>
                            </div>
                            <LiveTrackingMap rideId={trackingRide.ride_id} isDriver={trackingRide.isDriver} pickup={{ lat: Number(trackingRide.source_lat), lng: Number(trackingRide.source_lng), address: trackingRide.source }} destination={{ lat: Number(trackingRide.dest_lat), lng: Number(trackingRide.dest_lng), address: trackingRide.destination }} />
                            <div className="mt-8 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-xl">{trackingRide.isDriver ? '📡' : '📱'}</div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                                        <p className="font-bold text-black">{trackingRide.isDriver ? 'Broadcasting your location' : 'Tracking driver location'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setTrackingRide(null)} className="px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors">Close Map</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyRides;
