const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testAPI() {
    try {
        // 1. Generate Token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET not found in .env');
            return;
        }

        // Use ID 1 (Anirudh)
        const token = jwt.sign({ id: 1, role: 'student' }, secret, { expiresIn: '24h' });
        console.log('Generated Token:', token.substring(0, 20) + '...');

        const baseURL = 'http://localhost:4000/api';
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Test Profile
        console.log('Testing /student/profile...');
        try {
            const profileRes = await fetch(`${baseURL}/student/profile`, { headers });
            console.log('Profile Status:', profileRes.status);
            const profileData = await profileRes.json();
            console.log('Profile Data:', profileData);
        } catch (err) {
            console.error('Profile Error:', err.message);
        }

        // 3. Test History
        console.log('Testing /attendance/student...');
        try {
            const historyRes = await fetch(`${baseURL}/attendance/student`, { headers });
            console.log('History Status:', historyRes.status);
            const historyData = await historyRes.json();
            console.log('History Data:', historyData);
        } catch (err) {
            console.error('History Error:', err.message);
        }

    } catch (error) {
        console.error('Test API Error:', error);
    }
}

testAPI();
