const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/video', function (req, res) {
    // Ensure there is a range given for the video
    const range = req.headers.range;
    if (!range) {
        return res.status(400).send('Requires Range header');
    }

    // get video stats (about 61MB)
    const videoPath = 'bigbuck.mp4';
    const videoSize = fs.statSync('bigbuck.mp4').size;

    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    // Create headers
    const contentLength = end - start + 1;
    const headers = {
        'Content-Range': `bytes ${start}-${end}/${videoSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': 'video/mp4',
    };

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);

    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end });

    // Stream the video chunk to the client
    videoStream.pipe(res);
});

app.get('/download', function (req, res) {
    try {
        const filepath = path.join(__dirname, 'bigbuck.mp4');
        // Check if the file exists
        if (!fs.existsSync(filepath)) {
            res.status(404).send('File not found');
            return;
        }
        // Set headers for the download response
        const fileSize = fs.statSync(filepath).size;
        // Handle range requests for resuming downloads
        const range = req.headers.range;
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Length': fileSize,
            'Content-Disposition': `attachment; filename="bigbuck.mp4"`,
            'Cache-Control': 'public, max-age=31536000',
        });
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            console.log('start: ', start);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            console.log('end: ', end);
            const chunksize = end - start + 1;
            res.writeHead(206, {
                'Content-Type': 'application/octet-stream',
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Content-Length': chunksize,
            });
            const file = fs.createReadStream(filepath, { start, end });
            let downloadedBytes = 0;
            file.on('data', function (chunk) {
                downloadedBytes += chunk.length;
                res.write(chunk);
            });
            file.on('end', function () {
                console.log('Download completed');
                res.end();
            });
            file.on('error', function (err) {
                console.log('Error while downloading file:', err);
                res.status(500).send('Error while downloading file');
            });
        } else {
            // Handle full file download requests
            const file = fs.createReadStream(filepath);
            file.pipe(res);
        }
    } catch (error) {
        console.log('error: ', error);
        res.send(500);
    }
});
app.listen(8000, function () {
    console.log('Listening on port 8000!');
});
