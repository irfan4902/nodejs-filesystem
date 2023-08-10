const fs = require('fs');
const path = require('path');
const express = require("express");
const port = 1234;
const app = express();
app.use(express.static("public"));
const folderPath = 'C:/Users/irfan.aslam/Desktop/test folder';

// const server = http.createServer((req, res) => {
//     const indexHtml = fs.readFileSync('index.html', 'utf8');
//     res.writeHead(200, {'Content-Type': 'text/html'});
//     res.end(indexHtml);
// });
// const wss = new WebSocket.Server({server});

app.get("/info", (req, res) => {
    res.json("Bruh moment");
});

app.get("/download-file", (req,res) => {

    console.log(req.query);
    console.log(Object.entries(req.query));
    console.log(req.query.filename);

    res.download(folderPath + "/" + req.query.filename);
});

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

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});