import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
    LogOut,
    MapPin,
    Shield,
    Camera,
    History,
    AlertCircle,
    LayoutDashboard,
    User,
    ChevronRight,
    CheckCircle,
    XCircle,
    Play,
    RefreshCw,
    Send,
    Calendar as CalendarIcon,
    Clock,
    X,
    Menu
} from 'lucide-react';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [location, setLocation] = useState(null);
    const [isInsideGeofence, setIsInsideGeofence] = useState(false);
    const [distanceToBoundary, setDistanceToBoundary] = useState(null);

    // Attendance State
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');

    // Face Enrollment State
    const webcamRef = useRef(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [enrollmentStep, setEnrollmentStep] = useState(0); // 0: Intro, 1: Center, 2: Left, 3: Right, 4: Complete
    const [capturedAngles, setCapturedAngles] = useState({ center: null, left: null, right: null });
    const [enrollmentStatus, setEnrollmentStatus] = useState(null);
    const canvasRef = useRef(null);
    const [isFaceDetected, setIsFaceDetected] = useState(false);

    useEffect(() => {
        let interval;
        if (activeTab === 'enrollment' && enrollmentStep >= 1 && enrollmentStep <= 3 && isModelLoaded) {
            interval = setInterval(async () => {
                if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
                    const video = webcamRef.current.video;
                    const displaySize = { width: video.videoWidth, height: video.videoHeight };

                    // Ensure canvas matches video size
                    if (canvasRef.current) {
                        faceapi.matchDimensions(canvasRef.current, displaySize);
                    }

                    const detections = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();

                    if (detections) {
                        setIsFaceDetected(true);
                        if (canvasRef.current) {
                            const resizedDetections = faceapi.resizeResults(detections, displaySize);
                            const ctx = canvasRef.current.getContext('2d');
                            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                            faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
                        }
                    } else {
                        setIsFaceDetected(false);
                        if (canvasRef.current) {
                            const ctx = canvasRef.current.getContext('2d');
                            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        }
                    }
                }
            }, 100);
        }
        return () => clearInterval(interval);
    }, [activeTab, enrollmentStep, isModelLoaded]);

    // History State
    const [history, setHistory] = useState([]);

    const CAMPUS_CENTER = { lat: 26.8336, lng: 75.6499 };
    const GEOFENCE_RADIUS_METERS = 500;

    const menuItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'mark-attendance', label: 'Mark Attendance', icon: Camera },
        { id: 'enrollment', label: 'Face Enrollment', icon: User },
        { id: 'history', label: 'Attendance History', icon: History },
        { id: 'report', label: 'Report Issue', icon: AlertCircle },
    ];

    const [isEnrolled, setIsEnrolled] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const init = async () => {
            await loadModels();
            startLocationTracking();
            await checkEnrollmentStatus();
            await fetchHistory();
        };
        init();
    }, []);

    const handleAuthError = (error) => {
        console.error("Auth Error:", error);
        if (error.response && (error.response.status === 401 || error.response.status === 403 || error.response.status === 500)) {
            logout();
            navigate('/login');
        }
    };

    const checkEnrollmentStatus = async () => {
        try {
            const response = await api.get('/student/profile');
            if (!response.data.FaceEnrollment) {
                setIsEnrolled(false);
            } else {
                setIsEnrolled(true);
            }
        } catch (error) {
            handleAuthError(error);
        }
    };

    const loadModels = async () => {
        try {
            const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            setIsModelLoaded(true);
        } catch (err) {
            console.error("Error loading face models:", err);
        }
    };

    const startLocationTracking = () => {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });
                    checkGeofence(latitude, longitude);
                },
                (error) => console.error("Location error:", error),
                { enableHighAccuracy: true }
            );
        }
    };

    const refreshLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });
                    checkGeofence(latitude, longitude);
                },
                (error) => console.error("Location refresh error:", error),
                { enableHighAccuracy: true }
            );
        }
    };

    const checkGeofence = (lat, lng) => {
        const R = 6371e3;
        const φ1 = lat * Math.PI / 180;
        const φ2 = CAMPUS_CENTER.lat * Math.PI / 180;
        const Δφ = (CAMPUS_CENTER.lat - lat) * Math.PI / 180;
        const Δλ = (CAMPUS_CENTER.lng - lng) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;

        setDistanceToBoundary(Math.max(0, Math.round(d - GEOFENCE_RADIUS_METERS)));
        setIsInsideGeofence(d <= GEOFENCE_RADIUS_METERS);
    };

    const fetchHistory = async () => {
        try {
            const response = await api.get('/attendance/student');
            setHistory(response.data);
        } catch (error) {
            handleAuthError(error);
        }
    };

    // --- Enrollment Logic ---
    const handleEnrollmentStep = async () => {
        if (!webcamRef.current || !isModelLoaded) return;

        const imageSrc = webcamRef.current.getScreenshot();
        const img = await faceapi.fetchImage(imageSrc);
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        if (!detections) {
            setStatusMessage("No face detected. Please position yourself clearly.");
            return;
        }

        if (enrollmentStep === 1) { // Center
            setCapturedAngles(prev => ({ ...prev, center: { descriptor: detections.descriptor, image: imageSrc } }));
            setEnrollmentStep(2);
            setStatusMessage("Great! Now turn your head slightly to the LEFT.");
        } else if (enrollmentStep === 2) { // Left
            setCapturedAngles(prev => ({ ...prev, left: { descriptor: detections.descriptor, image: imageSrc } }));
            setEnrollmentStep(3);
            setStatusMessage("Perfect! Now turn your head slightly to the RIGHT.");
        } else if (enrollmentStep === 3) { // Right
            setCapturedAngles(prev => ({ ...prev, right: { descriptor: detections.descriptor, image: imageSrc } }));
            setEnrollmentStep(4);
            setStatusMessage("All angles captured! Please confirm to enroll.");
        }
    };

    const finishEnrollment = async () => {
        if (!capturedAngles.center) return;
        setEnrollmentStatus('loading');
        try {
            const descriptor = Array.from(capturedAngles.center.descriptor);

            await api.post('/student/enroll-face', {
                face_descriptor: descriptor,
                image: capturedAngles.center.image
            });

            setEnrollmentStep(5);
            setEnrollmentStatus('success');
            setIsEnrolled(true);
        } catch (error) {
            console.error("Enrollment error:", error);
            setEnrollmentStatus('error');
            setStatusMessage("Failed to save enrollment. Please try again.");
            if (error.response?.status === 401 || error.response?.status === 403) {
                handleAuthError(error);
            }
        }
    };

    const handleMarkAttendance = async () => {
        if (!webcamRef.current || !isModelLoaded) return; // Removed !location check
        setStatusMessage("Verifying face...");
        setAttendanceStatus('loading');

        try {
            const imageSrc = webcamRef.current.getScreenshot();
            const img = await faceapi.fetchImage(imageSrc);
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

            if (!detections) {
                setStatusMessage("No face detected. Please try again.");
                setAttendanceStatus('error');
                return;
            }

            const descriptor = Array.from(detections.descriptor);
            // Use actual location or dummy data if null (since check is disabled)
            const lat = location ? location.latitude : 0;
            const lng = location ? location.longitude : 0;

            const response = await api.post('/attendance', {
                lat: lat,
                lng: lng,
                faceDescriptor: descriptor,
                image: imageSrc // Send captured image
            });

            setAttendanceStatus('success');
            setStatusMessage(`Attendance Marked! Match Score: ${response.data.matchScore}`);

            fetchHistory();

            setTimeout(() => {
                setIsCameraActive(false);
                setAttendanceStatus(null);
                setActiveTab('dashboard');
            }, 3000);

        } catch (error) {
            console.error("Attendance error:", error);
            setAttendanceStatus('error');
            setStatusMessage(error.response?.data?.message || "Verification failed. Please try again.");
            if (error.response?.status === 401 || error.response?.status === 403) {
                handleAuthError(error);
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-slate-800 font-sans flex overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-2xl border-r border-white/40 shadow-2xl shadow-indigo-100/50 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="p-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">VISTA</h1>
                        <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Student Portal</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 py-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            disabled={!isEnrolled && item.id !== 'enrollment'}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${activeTab === item.id
                                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                                } ${!isEnrolled && item.id !== 'enrollment' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <item.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="font-medium">{item.label}</span>
                            {activeTab === item.id && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full" />}
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all duration-300 font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto relative">
                <div className="p-8 lg:p-12 max-w-7xl mx-auto">

                    {/* Header */}
                    <header className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 rounded-lg bg-white shadow-sm text-slate-600">
                                <Menu className="w-6 h-6" />
                            </button>
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                                    {menuItems.find(i => i.id === activeTab)?.label}
                                </h2>
                                <p className="text-slate-500 mt-1">Welcome back, {user?.name || 'Student'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm text-sm text-slate-600">
                                <MapPin className={`w-4 h-4 ${isInsideGeofence ? 'text-emerald-500' : 'text-rose-500'}`} />
                                {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Locating...'}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold">
                                    {user?.name?.[0] || 'S'}
                                </div>
                            </div>
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* DASHBOARD TAB */}
                            {activeTab === 'dashboard' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column */}
                                    <div className="lg:col-span-1 space-y-8">
                                        {/* Mark Attendance Card */}
                                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl shadow-indigo-100/50 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-rose-200 transition-colors duration-500" />
                                            <div className="relative z-10">
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">Mark Tonight's Attendance</h3>
                                                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                                    Please mark your attendance before 10:00 PM. Face recognition will be required.
                                                </p>
                                                <button
                                                    onClick={() => setActiveTab('mark-attendance')}
                                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-400 to-rose-500 text-white font-bold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                                >
                                                    <Camera className="w-5 h-5" />
                                                    Mark Attendance
                                                </button>
                                            </div>
                                        </div>

                                        {/* Location Status Card */}
                                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl shadow-indigo-100/50 relative overflow-hidden">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-bold text-slate-900">Current Location Status</h3>
                                                <button
                                                    onClick={refreshLocation}
                                                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                                    title="Refresh Location"
                                                >
                                                    <RefreshCw className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className={`p-6 rounded-2xl border flex items-start gap-4 ${isInsideGeofence
                                                ? 'bg-emerald-50 border-emerald-100'
                                                : 'bg-rose-50 border-rose-100'
                                                }`}>
                                                <div className={`p-3 rounded-xl ${isInsideGeofence ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    <MapPin className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className={`font-bold ${isInsideGeofence ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                        {isInsideGeofence ? 'You are INSIDE' : 'You are OUTSIDE'}
                                                    </h4>
                                                    <p className={`text-sm mt-1 ${isInsideGeofence ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {isInsideGeofence
                                                            ? 'You can now mark your attendance.'
                                                            : `Move ${distanceToBoundary}m closer to campus.`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Calendar */}
                                    <div className="lg:col-span-2">
                                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl shadow-indigo-100/50 h-full">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-bold text-slate-900">Your Attendance History</h3>
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                                    <button className="p-1 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                                                    <span>{format(new Date(), 'MMMM yyyy')}</span>
                                                    <button className="p-1 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-7 gap-4 mb-4 text-center">
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                    <div key={day} className="text-xs font-bold text-slate-400 uppercase tracking-wider">{day}</div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-7 gap-4">
                                                {(() => {
                                                    const today = new Date();
                                                    const year = today.getFullYear();
                                                    const month = today.getMonth();
                                                    const firstDay = new Date(year, month, 1).getDay();
                                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                                    const days = [];

                                                    for (let i = 0; i < firstDay; i++) {
                                                        days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                                                    }

                                                    for (let i = 1; i <= daysInMonth; i++) {
                                                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                                                        const record = history.find(h => h.date.startsWith(dateStr));
                                                        const isToday = i === today.getDate();

                                                        days.push(
                                                            <div key={i} className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 ${isToday
                                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                                }`}>
                                                                <span className="text-sm font-bold">{i}</span>
                                                                {record && (
                                                                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isToday ? 'bg-white' : (record.status === 'Present' ? 'bg-emerald-400' : 'bg-rose-400')
                                                                        }`} />
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return days;
                                                })()}
                                            </div>

                                            <div className="flex justify-center gap-6 mt-8">
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <div className="w-3 h-3 rounded-full bg-emerald-400" /> Present
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <div className="w-3 h-3 rounded-full bg-rose-400" /> Absent
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <div className="w-3 h-3 rounded-full bg-slate-200" /> Future
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MARK ATTENDANCE TAB */}
                            {activeTab === 'mark-attendance' && (
                                <div className="max-w-3xl mx-auto">
                                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-2 border border-white/50 shadow-2xl shadow-indigo-100/50 overflow-hidden">
                                        {!isCameraActive ? (
                                            <div className="p-16 text-center bg-white/50 rounded-[2rem]">
                                                <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-8 text-indigo-500">
                                                    <Camera className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to Verify?</h3>
                                                <p className="text-slate-500 mb-10 max-w-md mx-auto">
                                                    Ensure you are in a well-lit area. We will scan your face to mark your attendance.
                                                </p>
                                                <button
                                                    onClick={() => setIsCameraActive(true)}
                                                    className="px-10 py-4 rounded-xl bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Start Camera
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative rounded-[2rem] overflow-hidden bg-black shadow-2xl">
                                                <div className="aspect-video relative">
                                                    <Webcam
                                                        audio={false}
                                                        ref={webcamRef}
                                                        screenshotFormat="image/jpeg"
                                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                                    />
                                                    <canvas
                                                        ref={canvasRef}
                                                        className="absolute inset-0 w-full h-full transform scale-x-[-1]"
                                                    />

                                                    {/* Face Detection Frame */}
                                                    <div className={`absolute inset-0 border-[4px] transition-colors duration-300 m-6 rounded-3xl ${isFaceDetected ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]' : 'border-slate-500/30'
                                                        }`}>
                                                        {isFaceDetected && (
                                                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4" />
                                                                Face Detected
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-white flex justify-between items-center">
                                                    <p className={`font-medium ${attendanceStatus === 'error' ? 'text-rose-500' : (attendanceStatus === 'success' ? 'text-emerald-600' : 'text-slate-600')}`}>
                                                        {statusMessage || (isFaceDetected ? "Face detected. Ready to capture." : "Align face within frame")}
                                                    </p>
                                                    <div className="flex gap-3">
                                                        <button onClick={() => setIsCameraActive(false)} className="px-6 py-2 rounded-lg text-slate-500 hover:bg-slate-100 font-medium">Cancel</button>
                                                        <button
                                                            onClick={handleMarkAttendance}
                                                            disabled={!isFaceDetected}
                                                            className={`px-6 py-2 rounded-lg font-bold shadow-lg transition-all ${isFaceDetected
                                                                ? 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700'
                                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Capture
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ENROLLMENT TAB */}
                            {activeTab === 'enrollment' && (
                                <div className="max-w-4xl mx-auto">
                                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-12 border border-white/50 shadow-2xl shadow-indigo-100/50 text-center">
                                        <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-6 text-purple-500">
                                            <User className="w-10 h-10" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Face Enrollment</h2>
                                        <p className="text-slate-500 max-w-lg mx-auto mb-10">
                                            We need to capture your face from 3 angles (Center, Left, Right) to ensure secure access.
                                        </p>

                                        {enrollmentStep === 0 && (
                                            <button onClick={() => setEnrollmentStep(1)} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all">
                                                Start Enrollment
                                            </button>
                                        )}

                                        {(enrollmentStep >= 1 && enrollmentStep <= 3) && (
                                            <div className="max-w-xl mx-auto space-y-6">
                                                <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
                                                    {isModelLoaded ? (
                                                        <>
                                                            <Webcam
                                                                audio={false}
                                                                ref={webcamRef}
                                                                screenshotFormat="image/jpeg"
                                                                className="w-full h-full object-cover transform scale-x-[-1]"
                                                            />
                                                            <canvas
                                                                ref={canvasRef}
                                                                className="absolute inset-0 w-full h-full transform scale-x-[-1]"
                                                            />
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-white">Loading Camera...</div>
                                                    )}

                                                    {/* Visual Guides Overlay */}
                                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                        <div className={`w-64 h-80 border-4 rounded-[3rem] transition-all duration-300 ${isFaceDetected
                                                            ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]'
                                                            : 'border-indigo-500/30'
                                                            }`}></div>

                                                        {enrollmentStep === 2 && (
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 animate-pulse">
                                                                <ChevronRight className="w-16 h-16 text-white/80 rotate-180" />
                                                            </div>
                                                        )}
                                                        {enrollmentStep === 3 && (
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-pulse">
                                                                <ChevronRight className="w-16 h-16 text-white/80" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                    <div className="text-left">
                                                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Step {enrollmentStep} of 3</p>
                                                        <h3 className="text-xl font-bold text-slate-900">
                                                            {enrollmentStep === 1 && "Look Straight Ahead"}
                                                            {enrollmentStep === 2 && "Turn Head Left"}
                                                            {enrollmentStep === 3 && "Turn Head Right"}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 mt-1">
                                                            {enrollmentStep === 1 && "Position your face in the center frame"}
                                                            {enrollmentStep === 2 && "Rotate your head slightly to your left"}
                                                            {enrollmentStep === 3 && "Rotate your head slightly to your right"}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={handleEnrollmentStep}
                                                        disabled={!isFaceDetected}
                                                        className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${isFaceDetected
                                                            ? 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-105'
                                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        <Camera className="w-5 h-5" />
                                                        Capture
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {enrollmentStep === 4 && (
                                            <div className="text-center py-8">
                                                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6 text-indigo-600 animate-in zoom-in duration-300">
                                                    <User className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to Enroll?</h3>
                                                <p className="text-slate-500 mb-8">We have captured your face data. Click below to finish enrollment.</p>

                                                <div className="flex justify-center gap-4">
                                                    <button
                                                        onClick={() => setEnrollmentStep(1)}
                                                        className="px-8 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
                                                    >
                                                        Retake
                                                    </button>
                                                    <button
                                                        onClick={finishEnrollment}
                                                        disabled={enrollmentStatus === 'loading'}
                                                        className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        {enrollmentStatus === 'loading' ? (
                                                            <>
                                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                                Enrolling...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-5 h-5" />
                                                                Confirm Enrollment
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {enrollmentStep === 5 && (
                                            <div className="text-center py-8">
                                                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 text-emerald-600 animate-in zoom-in duration-300">
                                                    <CheckCircle className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Enrollment Complete!</h3>
                                                <p className="text-slate-500 mb-8">Your face data has been securely recorded.</p>
                                                <button onClick={() => setActiveTab('dashboard')} className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all">
                                                    Return to Dashboard
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* HISTORY TAB */}
                            {activeTab === 'history' && (
                                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 shadow-2xl shadow-indigo-100/50">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-8">Full Attendance Log</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Time</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Location</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {history.map((record) => (
                                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-slate-700 font-medium">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                                                        <td className="px-6 py-4 text-slate-500">{record.time}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                                }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${record.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-slate-400 font-mono text-xs">
                                                            {record.lat?.toFixed(4)}, {record.lng?.toFixed(4)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* REPORT TAB */}
                            {activeTab === 'report' && (
                                <div className="max-w-2xl mx-auto">
                                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/50 shadow-2xl shadow-indigo-100/50">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900">Report an Issue</h3>
                                                <p className="text-slate-500">Let us know if you're facing any problems.</p>
                                            </div>
                                        </div>

                                        <form className="space-y-6" onSubmit={async (e) => {
                                            e.preventDefault();
                                            const type = e.target.elements.type.value;
                                            const description = e.target.elements.description.value;
                                            const token = localStorage.getItem('token');
                                            try {
                                                await axios.post('http://localhost:4000/api/issues', { type, description }, { headers: { Authorization: `Bearer ${token}` } });
                                                alert("Issue reported successfully!");
                                                e.target.reset();
                                                setActiveTab('dashboard');
                                            } catch (error) {
                                                console.error("Report error:", error);
                                                alert("Failed to report issue.");
                                            }
                                        }}>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Issue Type</label>
                                                <select name="type" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none">
                                                    <option>Geolocation Error</option>
                                                    <option>Face Recognition Failed</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                                <textarea name="description" rows="4" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none" placeholder="Describe the issue..."></textarea>
                                            </div>
                                            <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 transition-all">
                                                Submit Report
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div >
            </main >
        </div >
    );
};

export default StudentDashboard;
