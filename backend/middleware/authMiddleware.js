const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided.' });
    }

    // Bearer <token>
    const tokenParts = token.split(' ');
    const tokenValue = tokenParts.length === 2 ? tokenParts[1] : token;

    jwt.verify(tokenValue, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token.' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const verifyWarden = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.userRole === 'warden') {
            next();
        } else {
            res.status(403).json({ message: 'Require Warden Role!' });
        }
    });
};

module.exports = { verifyToken, verifyWarden };
