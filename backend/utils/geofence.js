const turf = require('@turf/turf');
const db = require('../models');

const isInsideCampus = async (lat, lng) => {
    try {
        // Fetch polygon coordinates from DB
        const points = await db.Geofence.findAll({
            order: [['sequence_order', 'ASC']]
        });

        if (!points || points.length < 3) {
            // Fallback or error if no geofence defined
            console.warn('Geofence not defined in DB.');
            return false;
        }

        // Create polygon array: [[lng, lat], [lng, lat], ...]
        // Note: Turf uses [lng, lat] order
        const polygonCoords = points.map(p => [parseFloat(p.longitude), parseFloat(p.latitude)]);

        // Close the polygon if not closed
        if (polygonCoords[0][0] !== polygonCoords[polygonCoords.length - 1][0] ||
            polygonCoords[0][1] !== polygonCoords[polygonCoords.length - 1][1]) {
            polygonCoords.push(polygonCoords[0]);
        }

        const pt = turf.point([parseFloat(lng), parseFloat(lat)]);
        const poly = turf.polygon([polygonCoords]);

        return turf.booleanPointInPolygon(pt, poly);
    } catch (error) {
        console.error('Geofence check error:', error);
        return false;
    }
};

module.exports = { isInsideCampus };
