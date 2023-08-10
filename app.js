const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const folderPath = 'C:/Users/irfan.aslam/Desktop/test folder';

const server = http.createServer((req, res) => {
    const indexHtml = fs.readFileSync('index.html', 'utf8');
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(indexHtml);
});
const wss = new WebSocket.Server({server});

function compare( a, b ) {
    if ( a.name < b.name ){
        return -1;
    }
    if ( a.name > b.name ){
        return 1;
    }
    return 0;
}

function sendFiles(ws) {
    var fileData = [];

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error reading folder:', err);
            throw 'Error reading folder:', err;
        }

        files.forEach(file => {
            const filePath = path.join(folderPath, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    throw 'Error getting file stats: ', err;
                }

                if (stats.isFile()) {
                    fileData.push({ name: file, type: "File" , url: filePath});
                } else if (stats.isDirectory()) {
                    fileData.push({ name: file, type: "Folder", url: filePath});
                }

                // If all files have been processed, send the data to the WebSocket
                if (fileData.length === files.length) {
                    ws.send(JSON.stringify(fileData.sort(compare)));
                }
            });
        });

    });
}

wss.on('connection', ws => {
    console.log('Client connected');

    sendFiles(ws);

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(1234, () => {
    console.log('Server is running on port 1234');
});