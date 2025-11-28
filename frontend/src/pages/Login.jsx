import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, MapPin, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import GeolocationVisualizer from '../components/GeolocationVisualizer';
import * as turf from '@turf/turf';
import api from '../utils/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [geofence, setGeofence] = useState([]);
    const [isInside, setIsInside] = useState(false);
    const [distance, setDistance] = useState(null);
    const [checkingLocation, setCheckingLocation] = useState(true);

    // Fetch Geofence
    useEffect(() => {
        const fetchGeofence = async () => {
            try {
                const response = await api.get('/attendance/geofence');
                if (Array.isArray(response.data) && response.data.length > 0) {
                    setGeofence(response.data);
                }
            } catch (err) {
                console.error("Failed to fetch geofence", err);
            }
        };
        fetchGeofence();
    }, []);

    // Watch Location & Calculate Geofence Status
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by this browser.");
            setCheckingLocation(false);
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setLocation({ lat, lng });
                setLocationError('');
                setCheckingLocation(false);

                if (geofence.length > 2) {
                    // Create Polygon
                    const polygonCoords = geofence.map(p => [parseFloat(p.longitude), parseFloat(p.latitude)]);
                    // Close polygon
                    if (polygonCoords[0][0] !== polygonCoords[polygonCoords.length - 1][0] ||
                        polygonCoords[0][1] !== polygonCoords[polygonCoords.length - 1][1]) {
                        polygonCoords.push(polygonCoords[0]);
                    }

                    const pt = turf.point([lng, lat]);
                    const poly = turf.polygon([polygonCoords]);

                    const inside = turf.booleanPointInPolygon(pt, poly);
                    setIsInside(inside);

                    if (!inside) {
                        // Calculate distance to polygon boundary
                        const line = turf.polygonToLine(poly);
                        const dist = turf.pointToLineDistance(pt, line, { units: 'meters' });
                        setDistance(dist);
                    } else {
                        setDistance(0);
                    }
                }
            },
            (err) => {
                console.error("Location error:", err);
                setLocationError("Unable to retrieve location. Please enable GPS.");
                setCheckingLocation(false);
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [geofence]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!location && !locationError) {
            setError("Fetching location... Please wait.");
            return;
        }

        if (locationError) {
            setError(locationError);
            return;
        }

        setLoading(true);
        try {
            // Pass location to login
            await login(email, password, location?.lat, location?.lng);
            navigate('/'); // AuthContext will redirect based on role
        } catch (err) {
            console.error(err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-200/30 rounded-full blur-[100px] z-0"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[100px] z-0"></div>

            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden z-10 relative border border-slate-100">
                {/* Left Side - Visualizer */}
                <div className="hidden md:flex w-1/2 bg-slate-50 flex-col items-center justify-center p-12 border-r border-slate-100">
                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-600">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Campus Perimeter
                        </h2>
                        <p className="text-slate-500 mt-2 text-sm">
                            Real-time geofence monitoring active.
                        </p>
                    </div>

                    <div className="w-full relative shadow-lg rounded-xl overflow-hidden border border-slate-200">
                        <GeolocationVisualizer />
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        System Operational
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight flex items-center gap-2 justify-center md:justify-start">
                            <span className="text-orange-500">VISTA</span>
                        </h1>
                        <h2 className="text-xl font-semibold text-slate-700 mt-4">Warden & Student Login</h2>
                        <p className="text-slate-500 text-sm mt-1">Securely sign in to your account.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Geofence Status Indicator */}
                    <div className={`mb-8 p-4 rounded-xl border transition-colors duration-300 ${checkingLocation ? 'bg-slate-50 border-slate-200' :
                            locationError ? 'bg-red-50 border-red-200' :
                                isInside ? 'bg-emerald-50 border-emerald-200' :
                                    'bg-amber-50 border-amber-200'
                        }`}>
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${checkingLocation ? 'bg-slate-200 text-slate-500' :
                                    locationError ? 'bg-red-100 text-red-500' :
                                        isInside ? 'bg-emerald-100 text-emerald-600' :
                                            'bg-amber-100 text-amber-600'
                                }`}>
                                {checkingLocation ? <MapPin className="w-5 h-5 animate-pulse" /> :
                                    locationError ? <AlertTriangle className="w-5 h-5" /> :
                                        isInside ? <CheckCircle className="w-5 h-5" /> :
                                            <MapPin className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${checkingLocation ? 'text-slate-600' :
                                        locationError ? 'text-red-700' :
                                            isInside ? 'text-emerald-700' :
                                                'text-amber-700'
                                    }`}>
                                    {checkingLocation ? 'Verifying Location...' :
                                        locationError ? 'Location Error' :
                                            isInside ? 'Inside Campus' :
                                                'Outside Campus'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    {checkingLocation ? 'Please wait while we verify your position.' :
                                        locationError ? locationError :
                                            isInside ? 'You are within the campus perimeter.' :
                                                `You are ${distance ? distance.toFixed(1) : '...'}m away from the boundary.`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="group">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <a href="#" className="text-sm font-medium text-orange-600 hover:text-orange-700">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isInside || !!locationError}
                            className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center text-sm ${loading || !isInside || !!locationError
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5'
                                }`}
                        >
                            {loading ? 'Authenticating...' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400">
                            © 2024 Night Attendance System. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
