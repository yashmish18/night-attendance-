const jwt = require('jsonwebtoken');

const secret = 'e235286c56a3dfb43a19161b4dff19e9674abc9f75f66ca85977b38fee6be3b665c432e3897a96024edf9c836153bef459eb5b935d19c8fcbed5e43cbf908179';
const token = jwt.sign({ id: 1, role: 'Student' }, secret, { expiresIn: '1h' });

const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const descriptor = new Array(128).fill(0.1);

async function test() {
    try {
        console.log('Sending request...');
        const res = await fetch('http://localhost:4000/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                lat: 26.8,
                lng: 75.6,
                faceDescriptor: descriptor,
                image: image
            })
        });

        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
