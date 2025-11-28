import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Users, Activity, Search, Filter, MapPin, Shield, CheckCircle, XCircle, Clock, Calendar, X, Menu, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { motion } from 'framer-motion';

const WardenDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterHostel, setFilterHostel] = useState('All');

    // Face Modal State
    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
    const [selectedStudentFace, setSelectedStudentFace] = useState(null);
    const [faceLoading, setFaceLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/attendance/warden');

            const { totalStudents, presentCount, absentCount, attendanceList } = response.data;

            setStats({
                totalStudents,
                presentToday: presentCount,
                absentToday: absentCount
            });

            // Map attendance list to activity feed format
            const activity = attendanceList.map((record) => ({
                id: record.id,
                name: record.Student ? record.Student.name : 'Unknown',
                time: record.time, // Time is already formatted string from backend
                status: record.status,
                location: 'Campus',
                image: record.captured_image,
                score: record.face_match_score
            }));
            setRecentActivity(activity);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'students') {
            fetchStudents();
        }
    }, [activeTab, filterHostel]);

    const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
            const response = await api.get('/student/all', {
                params: { hostel: filterHostel }
            });
            setStudents(response.data);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleViewFace = async (studentId) => {
        setIsFaceModalOpen(true);
        setFaceLoading(true);
        setSelectedStudentFace(null);
        try {
            const response = await api.get(`/student/face/${studentId}`);
            setSelectedStudentFace(response.data.image);
        } catch (error) {
            console.error("Error fetching face:", error);
            alert("Failed to load face image.");
            setIsFaceModalOpen(false);
        } finally {
            setFaceLoading(false);
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Activity },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'reports', label: 'Reports', icon: Calendar },
    ];

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
                        <p className="text-xs text-indigo-500 font-bold tracking-wider uppercase bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">Admin Portal</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 py-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${activeTab === item.id
                                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="font-medium">{item.label}</span>
                            {activeTab === item.id && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full" />}
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {user?.name?.charAt(0) || 'W'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Warden'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
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

                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <header className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-900 mb-1">Overview</h2>
                                    <p className="text-slate-500">Welcome back, here's what's happening tonight.</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/50 px-4 py-2 rounded-full border border-white/50 shadow-sm">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </header>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                                    { label: 'Present Today', value: stats.presentToday, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                                    { label: 'Absent Today', value: stats.absentToday, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
                                ].map((stat, index) => (
                                    <div key={index} className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl shadow-indigo-100/50 hover:scale-[1.02] transition-transform duration-300">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                                <stat.icon className="w-6 h-6" />
                                            </div>
                                            <span className={`text-4xl font-bold ${stat.color}`}>{stat.value}</span>
                                        </div>
                                        <p className="text-slate-500 font-medium">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Activity Table */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-2xl shadow-indigo-100/50 overflow-hidden">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-indigo-500" />
                                        Live Attendance Feed
                                    </h3>
                                    <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                                                <th className="px-8 py-4">Student</th>
                                                <th className="px-8 py-4">Photo</th>
                                                <th className="px-8 py-4">Time</th>
                                                <th className="px-8 py-4">Status</th>
                                                <th className="px-8 py-4">Score</th>
                                                <th className="px-8 py-4">Location</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {recentActivity.map((activity) => (
                                                <tr key={activity.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-8 py-4 font-bold text-slate-700">{activity.name}</td>
                                                    <td className="px-8 py-4">
                                                        {activity.image ? (
                                                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
                                                                <img src={activity.image} alt="Captured" className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <Users className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-4 text-slate-500 flex items-center gap-2">
                                                        <Clock className="w-3 h-3" /> {activity.time}
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${activity.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                                                            activity.status === 'Late' ? 'bg-amber-50 text-amber-600' :
                                                                'bg-rose-50 text-rose-600'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${activity.status === 'Present' ? 'bg-emerald-500' :
                                                                activity.status === 'Late' ? 'bg-amber-500' :
                                                                    'bg-rose-500'
                                                                }`}></span>
                                                            {activity.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4 text-slate-500 font-mono text-xs">
                                                        {activity.score ? `${(activity.score * 100).toFixed(1)}%` : 'N/A'}
                                                    </td>
                                                    <td className="px-8 py-4 text-slate-500 flex items-center gap-2">
                                                        <MapPin className="w-3 h-3" /> {activity.location}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'students' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-900 mb-1">Student Directory</h2>
                                    <p className="text-slate-500">Manage and view all registered students.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search students..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 w-64 shadow-sm"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <select
                                            value={filterHostel}
                                            onChange={(e) => setFilterHostel(e.target.value)}
                                            className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer shadow-sm"
                                        >
                                            <option value="All">All Hostels</option>
                                            <option value="BH-1">BH-1</option>
                                            <option value="BH-2">BH-2</option>
                                            <option value="GH-1">GH-1</option>
                                        </select>
                                    </div>
                                </div>
                            </header>

                            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-2xl shadow-indigo-100/50 overflow-hidden">
                                {loadingStudents ? (
                                    <div className="p-12 text-center text-slate-400">
                                        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                        Loading student data...
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                                    <th className="px-8 py-4">ID</th>
                                                    <th className="px-8 py-4">Student</th>
                                                    <th className="px-8 py-4">Contact</th>
                                                    <th className="px-8 py-4">Hostel Info</th>
                                                    <th className="px-8 py-4">Face ID</th>
                                                    <th className="px-8 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredStudents.length > 0 ? (
                                                    filteredStudents.map((student) => (
                                                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                                                            <td className="px-8 py-4 text-slate-500 font-mono text-xs">#{student.id}</td>
                                                            <td className="px-8 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    {student.FaceEnrollment && student.FaceEnrollment.image ? (
                                                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
                                                                            <img src={student.FaceEnrollment.image} alt={student.name} className="w-full h-full object-cover" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                                                            {student.name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                    <span className="font-bold text-slate-700">{student.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-slate-700 text-sm">{student.email}</span>
                                                                    <span className="text-slate-400 text-xs">{student.mobile || 'N/A'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 w-fit">
                                                                        {student.hostel || 'N/A'}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500">Room: {student.room_no || 'N/A'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-4">
                                                                {student.FaceEnrollment ? (
                                                                    <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
                                                                        <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-full">
                                                                        <XCircle className="w-3.5 h-3.5" /> Pending
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-4 text-right">
                                                                {student.FaceEnrollment && (
                                                                    <button
                                                                        onClick={() => handleViewFace(student.id)}
                                                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100"
                                                                    >
                                                                        View Face
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="px-8 py-12 text-center text-slate-500">
                                                            No students found matching your criteria.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <header>
                                <h2 className="text-3xl font-bold text-slate-900 mb-1">Attendance Reports</h2>
                                <p className="text-slate-500">Generate and view attendance reports by date.</p>
                            </header>

                            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/50 p-10 shadow-2xl shadow-indigo-100/50 max-w-2xl">
                                <div className="flex flex-col gap-4">
                                    <label className="text-sm font-bold text-slate-700">Select Date</label>
                                    <div className="flex gap-4">
                                        <input
                                            type="date"
                                            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                                        />
                                        <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/30">
                                            Generate Report
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center text-slate-400 bg-slate-50/50">
                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="font-medium">Select a date above to view the detailed attendance report.</p>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Face Verification Modal */}
            {isFaceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900">Student Face Verification</h3>
                            <button
                                onClick={() => setIsFaceModalOpen(false)}
                                className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 flex flex-col items-center">
                            {faceLoading ? (
                                <div className="py-12 flex flex-col items-center gap-4">
                                    <div className="animate-spin w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                                    <p className="text-slate-500 font-medium">Securely retrieving face data...</p>
                                </div>
                            ) : selectedStudentFace ? (
                                <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden border-4 border-white shadow-xl shadow-indigo-100">
                                    <img
                                        src={selectedStudentFace}
                                        alt="Student Face"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-500">
                                    <p>No face image available.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400 font-medium">
                                This image is securely stored and used for biometric verification only.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WardenDashboard;
