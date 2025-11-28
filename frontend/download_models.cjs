const fs = require('fs');
const https = require('https');
const path = require('path');

const models = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const outputDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const downloadFile = (filename) => {
    const file = fs.createWriteStream(path.join(outputDir, filename));
    const url = baseUrl + filename;

    https.get(url, (response) => {
        if (response.statusCode !== 200) {
            console.error(`Failed to download ${filename}: Status Code ${response.statusCode}`);
            return;
        }
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${filename}`);
        });
    }).on('error', (err) => {
        fs.unlink(path.join(outputDir, filename), () => { }); // Delete the file async. (But we don't check the result)
        console.error(`Error downloading ${filename}: ${err.message}`);
    });
};

models.forEach(model => {
    downloadFile(model);
});
