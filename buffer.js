const fs = require('fs');
const path = require('path');

fs.readFile(path.join(__dirname, 'README.txt'), (error, data) => {
    if (error) {
        console.log(error);
    }
    console.log(data.toString());
});
