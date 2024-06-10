const fs = require('fs');

const readable = fs.createReadStream(__dirname + '/README.txt', {
    encoding: 'utf8',
    highWaterMark: 32,
});

const writeable = fs.createWriteStream(__dirname + '/READMECOPY.txt');
readable.on('data', (chunk) => {
    console.log(chunk.length);
    writeable.write(chunk);
});
