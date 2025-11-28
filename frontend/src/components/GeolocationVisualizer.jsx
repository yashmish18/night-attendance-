import React, { useEffect, useRef, useState } from 'react';
import api from '../utils/api';

const GeolocationVisualizer = () => {
    const canvasRef = useRef(null);
    const [geofence, setGeofence] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [error, setError] = useState('');
    const requestRef = useRef();

    useEffect(() => {
        const fetchGeofence = async () => {
            try {
                const response = await api.get('/attendance/geofence');
                if (Array.isArray(response.data) && response.data.length > 0) {
                    setGeofence(response.data);
                } else {
                    console.warn("Geofence data is empty or invalid");
                }
            } catch (err) {
                console.error("Failed to fetch geofence", err);
                setError('Failed to load map data');
            }
        };
        fetchGeofence();

        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                    setError('');
                },
                (err) => {
                    setError('Location access denied.');
                    console.error(err);
                },
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        } else {
            setError('Geolocation not supported.');
        }
    }, []);

    const draw = (time) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Professional Background
        ctx.fillStyle = '#f8fafc'; // Slate 50
        ctx.fillRect(0, 0, width, height);

        // Grid Lines (Professional Map Grid)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'; // Slate 400, low opacity
        ctx.lineWidth = 1;
        const gridSize = 40;

        // Static Grid (No movement for professional feel)
        ctx.beginPath();
        for (let x = 0; x < width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        if (geofence.length === 0) return;

        // Calculate Bounds
        const lats = geofence.map(p => parseFloat(p.latitude));
        const lngs = geofence.map(p => parseFloat(p.longitude));

        if (userLocation) {
            lats.push(userLocation.lat);
            lngs.push(userLocation.lng);
        }

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        const latRange = maxLat - minLat || 0.0001;
        const lngRange = maxLng - minLng || 0.0001;
        const padding = 0.2;

        const scaleX = width / (lngRange * (1 + padding * 2));
        const scaleY = height / (latRange * (1 + padding * 2));
        const scale = Math.min(scaleX, scaleY);

        const project = (lat, lng) => {
            const x = (lng - minLng + lngRange * padding) * scale;
            const y = height - (lat - minLat + latRange * padding) * scale;
            return { x, y };
        };

        // Draw Geofence Polygon (Orange Professional)
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#f97316'; // Orange 500
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(249, 115, 22, 0.1)'; // Orange 500 with opacity

        ctx.beginPath();
        geofence.forEach((point, index) => {
            const { x, y } = project(parseFloat(point.latitude), parseFloat(point.longitude));
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        // Draw User Location (Blue Dot)
        if (userLocation) {
            const { x, y } = project(userLocation.lat, userLocation.lng);

            // Pulse Animation (Subtle)
            const pulseSize = 8 + Math.sin(time / 300) * 2;

            ctx.fillStyle = '#3b82f6'; // Blue 500
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();

            // Outer Ring
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, pulseSize, 0, 2 * Math.PI);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#1e293b'; // Slate 800
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('YOU', x + 12, y + 4);
        }
    };

    const animate = (time) => {
        draw(time);
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [geofence, userLocation]);

    return (
        <div className="w-full h-64 bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden shadow-inner">
            <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="w-full h-full object-cover"
            />
            {error && (
                <div className="absolute top-2 left-2 bg-red-50 text-red-600 text-xs px-2 py-1 rounded border border-red-200 font-medium">
                    {error}
                </div>
            )}
            <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 font-medium bg-white/80 px-2 py-1 rounded border border-slate-200 backdrop-blur-sm">
                {userLocation ? '● GPS ACTIVE' : '○ SEARCHING...'}
            </div>
        </div>
    );
};

export default GeolocationVisualizer;
