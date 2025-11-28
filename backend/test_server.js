const http = require('http');

const server = http.createServer((req, res) => {
    console.log('Request received:', req.url);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Test server is working!');
});

const PORT = 5002;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Test server running on port ${PORT}`);
    console.log(`Try accessing: http://localhost:${PORT}`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
});
