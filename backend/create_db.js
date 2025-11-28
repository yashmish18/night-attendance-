const mysql = require('mysql2/promise');
require('dotenv').config();

const createDb = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || ''
        });

        const dbName = process.env.DB_NAME || 'night_attendance';

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`Database '${dbName}' created or already exists.`);

        await connection.end();
    } catch (error) {
        console.error('Error creating database:', error);
    }
};

createDb();
