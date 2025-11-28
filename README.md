Night Attendance System - Implementation Plan
Goal Description
Create a full-stack Night Attendance System with separate dashboards for Students and Wardens. The system ensures attendance is marked only when the student is physically within the campus (Geofencing) and verifies identity using Face Recognition (>70% match).

Technology Stack
Frontend: React.js (Vite), Tailwind CSS
Backend: Node.js, Express.js
Database: MySQL
Key Libraries:
Geofencing: turf (or simple ray-casting algorithm) for Point-in-Polygon check.
Face Recognition: face-api.js (Frontend for liveness/embedding generation) or Python face_recognition (Backend). Recommendation: face-api.js on Frontend to send face descriptors to Backend for matching is more efficient for a web app.
Authentication: JWT (JSON Web Tokens).
Database Schema (MySQL)
1. Student Table
Column	Type	Description
id
INT (PK)	Auto-increment ID
reg_no	VARCHAR	Unique Registration No (e.g., BTech25/0231)
name	VARCHAR	Full Name
email	VARCHAR	Unique Email (Username for login)
password	VARCHAR	Hashed Password (Default '123')
room_no	VARCHAR	Room Number
hostel	VARCHAR	Hostel Name (e.g., BH-2)
mobile	VARCHAR	Mobile Number
floor	VARCHAR	Floor Number
seater	VARCHAR	Seater Type (e.g., 3 Seater)
ac_status	VARCHAR	AC/NAC
2. Warden Table
Column	Type	Description
id
INT (PK)	Auto-increment ID
name	VARCHAR	Full Name
email	VARCHAR	Unique Email (Username for login)
password	VARCHAR	Hashed Password (Default '123')
3. FaceEnrollment Table
Column	Type	Description
id
INT (PK)	Auto-increment ID
student_id	INT (FK)	References Student.id
face_descriptor	JSON	Face embedding vector (float array)
created_at	DATETIME	Timestamp of enrollment
4. Attendance Table
Column	Type	Description
id
INT (PK)	Auto-increment ID
student_id	INT (FK)	References Student.id
date	DATE	Date of attendance
time	TIME	Time of marking
status	ENUM	'Present', 'Absent', 'Late'
location_lat	DECIMAL	Latitude at time of marking
location_long	DECIMAL	Longitude at time of marking
face_match_score	FLOAT	Confidence score of face match
4. Geofence Table (Stores Campus Boundary)
Column	Type	Description
id
INT (PK)	Auto-increment ID
latitude	DECIMAL	Vertex Latitude
longitude	DECIMAL	Vertex Longitude
sequence_order	INT	Order of the vertex in the polygon
Project Structure
night-attendance-system/
├── backend/
│   ├── config/           # DB configuration
│   ├── controllers/      # Logic for Auth, Attendance, User
│   ├── models/           # MySQL Models (Sequelize/TypeORM)
│   ├── routes/           # API Routes
│   ├── middleware/       # Auth & Role verification
│   ├── utils/            # Geofence logic, Face matching helper
│   └── server.js         # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Login, StudentDashboard, WardenDashboard
│   │   ├── context/      # Auth Context
│   │   ├── utils/        # Geolocation, FaceAPI helpers
│   │   └── App.jsx       # Main component
│   └── public/           # Static assets (models for face-api)
└── README.md
Features & Logic
1. Authentication
Login: Email + Password. 2. Camera captures image. 3. System compares captured face with stored face_descriptor. 4. Threshold: Match Euclidean distance must be equivalent to > 70% confidence.
4. Dashboards
Student:
"Mark Attendance" button (Active only during night hours).
Status display (Inside/Outside Campus, Face Match Status).
Attendance History.
Warden:
Live Attendance Feed (Who marked recently).
Missing Students List.
Stats (Total Present/Absent).
Prompts to Create the App
You can use the following prompts to generate the code with an AI assistant.

Prompt 1: Backend Setup & Database
Create a Node.js Express backend with MySQL for a Night Attendance System.

Database: Use sequelize or mysql2. Create tables: Users (id, name, email, password, role, face_descriptor, hostel_details), 
Attendance
 (id, user_id, timestamp, location, status), 
Geofence
 (lat, lng, order).
Night Attendance System - Implementation Plan
Goal Description
Create a full-stack Night Attendance System with separate dashboards for Students and Wardens. The system ensures attendance is marked only when the student is physically within the campus (Geofencing) and verifies identity using Face Recognition (>70% match).

Technology Stack
Frontend: React.js (Vite), Tailwind CSS
Backend: Node.js, Express.js
Database: MySQL
Key Libraries:
Geofencing: turf (or simple ray-casting algorithm) for Point-in-Polygon check.
Face Recognition: face-api.js (Frontend for liveness/embedding generation) or Python face_recognition (Backend). Recommendation: face-api.js on Frontend to send face descriptors to Backend for matching is more efficient for a web app.
Authentication: JWT (JSON Web Tokens).
Database Schema (MySQL)
1. Student Table
Column	Type	Description
id
INT (PK)	Auto-increment ID
reg_no	VARCHAR	Unique Registration No (e.g., BTech25/0231)
name	VARCHAR	Full Name
email	VARCHAR	Unique Email (Username for login)
password	VARCHAR	Hashed Password (Default '123')
room_no	VARCHAR	Room Number
hostel	VARCHAR	Hostel Name (e.g., BH-2)
mobile	VARCHAR	Mobile Number
floor	VARCHAR	Floor Number
seater	VARCHAR	Seater Type (e.g., 3 Seater)
ac_status	VARCHAR	AC/NAC
2. Warden Table
Column	Type	Description
id
INT (PK)	Auto-increment ID
name	VARCHAR	Full Name
email	VARCHAR	Unique Email (Username for login)
password	VARCHAR	Hashed Password (Default '123')
3. FaceEnrollment Table
Column	Type	Description
id
INT (PK)	Auto-increment ID
student_id	INT (FK)	References Student.id
face_descriptor	JSON	Face embedding vector (float array)
created_at	DATETIME	Timestamp of enrollment
4. Attendance Table
Column	Type	Description
id
INT (PK)	Auto-increment ID
student_id	INT (FK)	References Student.id
date	DATE	Date of attendance
time	TIME	Time of marking
status	ENUM	'Present', 'Absent', 'Late'
location_lat	DECIMAL	Latitude at time of marking
location_long	DECIMAL	Longitude at time of marking
face_match_score	FLOAT	Confidence score of face match
4. Geofence Table (Stores Campus Boundary)
Column	Type	Description
id
INT (PK)	Auto-increment ID
latitude	DECIMAL	Vertex Latitude
longitude	DECIMAL	Vertex Longitude
sequence_order	INT	Order of the vertex in the polygon
Project Structure
night-attendance-system/
├── backend/
│   ├── config/           # DB configuration
│   ├── controllers/      # Logic for Auth, Attendance, User
│   ├── models/           # MySQL Models (Sequelize/TypeORM)
│   ├── routes/           # API Routes
│   ├── middleware/       # Auth & Role verification
│   ├── utils/            # Geofence logic, Face matching helper
│   └── server.js         # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Login, StudentDashboard, WardenDashboard
│   │   ├── context/      # Auth Context
│   │   ├── utils/        # Geolocation, FaceAPI helpers
│   │   └── App.jsx       # Main component
│   └── public/           # Static assets (models for face-api)
└── README.md
Features & Logic
1. Authentication
Login: Email + Password. 2. Camera captures image. 3. System compares captured face with stored face_descriptor. 4. Threshold: Match Euclidean distance must be equivalent to > 70% confidence.
4. Dashboards
Student:
"Mark Attendance" button (Active only during night hours).
Status display (Inside/Outside Campus, Face Match Status).
Attendance History.
Warden:
Live Attendance Feed (Who marked recently).
Missing Students List.
Stats (Total Present/Absent).
Prompts to Create the App
You can use the following prompts to generate the code with an AI assistant.

Prompt 1: Backend Setup & Database
Create a Node.js Express backend with MySQL for a Night Attendance System.

Database: Use sequelize or mysql2. Create tables: Users (id, name, email, password, role, face_descriptor, hostel_details), 
Attendance
 (id, user_id, timestamp, location, status), 
Geofence
 (lat, lng, order).
Auth: Implement JWT login. Default password for all is '123'. Seed a Warden user warden@jklu.edu.in.
Geofencing: Create a utility function that takes (lat, lng) and checks if it's inside a polygon. I will provide 
coordinates.csv
 for the polygon vertices.
API:
POST /login: Returns JWT.
POST /attendance: Accepts { lat, lng, face_descriptor }. Verifies location (Geofence) and Face Match (>70%). Records attendance.
GET /dashboard/warden: Returns today's stats.
GET /dashboard/student: Returns personal history.
Integration: Connect to the Node.js backend running on port 4000.
Prompt 2: Frontend & Face Recognition
Create a React (Vite) frontend with Tailwind CSS.

Login Page: Email/Password form.
Prompt 4: Detailed Features (New)
Database:
Add hostel column to 
Warden
 table.
Ensure 
Student
 table has hostel.
Student Dashboard:
Enrollment: Check is_enrolled on login. If false, redirect to /enroll.
Calendar: Use react-calendar. Fetch monthly attendance status.
Geofence: Real-time check. Disable button if outside.
Warden Dashboard:
Filters: Add Hostel dropdown (BH-2, GH-1). Filter students/stats by this.
Verification: Modal showing FaceEnrollment.face_descriptor (visual representation if possible, or just the photo if we stored it. Wait, we only stored descriptor. We might need to store the actual image for visual verification, or just trust the score. User asked for "Enrolled Photo". We need to store the image blob/url in FaceEnrollment.)
Note: To show "Enrolled Photo", we must update FaceEnrollment to store the image data (Base64 or URL) alongside the descriptor.
User Review Required
Email Generation: Emails will be generated from First Names (e.g., anirudh@jklu.edu.in). Duplicates will be handled by appending numbers.
Face Data: The system needs initial face data. The plan assumes a "Face Enrollment" phase or placeholder data for now.
