const express = require('express');
const app = express();
const fs = require('fs');
const mongodb = require('mongodb');
const url = 'mongodb://user:password@db:27017';

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/init-video', async (req, res) => {
    try {
        const client = await mongodb.MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        const db = client.db('videos');
        const bucket = new mongodb.GridFSBucket(db);

        const writeStream = fs.createWriteStream('./output.mp4');

        bucket
            .openDownloadStreamByName('bigbuck', { start: 1024 * 1585 }) // skip the first 1585 KB, approximately 41 seconds
            .pipe(writeStream)
            .on('error', (error) => {
                console.error(error);
                res.status(500).json({ error: 'Error during video download' });
                client.close();
            })
            .on('finish', () => {
                console.log('Download complete');
                res.status(200).send('Video initialization complete');
                client.close();
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to connect to database' });
    }
});

app.get('/mongo-video', async (req, res) => {
    try {
        const client = await mongodb.MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        const db = client.db('videos');

        const range = req.headers.range;
        if (!range) {
            res.status(400).send('Requires Range header');
            client.close();
            return;
        }

        const video = await db.collection('fs.files').findOne({});
        if (!video) {
            res.status(404).send('No video uploaded!');
            client.close();
            return;
        }

        const videoSize = video.length;
        const start = Number(range.replace(/\D/g, ''));
        const end = videoSize - 1;
        const contentLength = end - start + 1;
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${videoSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, headers);

        const bucket = new mongodb.GridFSBucket(db);
        const downloadStream = bucket.openDownloadStreamByName('bigbuck', { start });

        downloadStream
            .pipe(res)
            .on('error', (error) => {
                console.error(error);
                res.status(500).json({ error: 'Error during video streaming' });
                client.close();
            })
            .on('end', () => {
                client.close();
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to connect to database' });
    }
});

app.listen(8000, () => {
    console.log('Listening on port 8000!');
});
