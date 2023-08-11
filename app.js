const fs = require('fs');
const path = require('path');
const express = require("express");
const port = 1234;
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const folderPath = 'C:/Users/irfan.aslam/Desktop/test folder';

app.get("/info", (req, res) => {
    sendFiles(folderPath, (err, fileData) => {
        if (err) {
            console.error('Error sending files:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).json(fileData);
        }
    });
});

app.get("/download-file", (req, res) => {
    const filename = req.query.filename;
    const filePath = path.join(folderPath, filename);

    if (!fs.existsSync(filePath)) {
        res.status(404).send("File not found");
        return;
    }
    res.download(filePath);
});

app.get("/info", (req, res) => {
    sendFiles(folderPath, (err, fileData) => {
        if (err) {
            console.error('Error sending files:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).json(fileData);
        }
    });
});

function compare(a, b) {
    // Folders are sorted above the files
    if (a.type === "Folder" && b.type !== "Folder") {
        return -1;
    }
    if (a.type !== "Folder" && b.type === "Folder") {
        return 1;
    }
    // Sort them alphabetically
    if (a.name < b.name) {
        return -1;
    }
    if (a.name > b.name) {
        return 1;
    }
    return 0;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function sendFiles(myPath, callback) {
    var fileData = [];

    fs.readdir(myPath, (err, files) => {
        if (err) {
            console.error('Error reading folder:', err);
            callback(err, null);
            return;
        }

        let processedCount = 0;

        files.forEach(file => {
            const filePath = path.join(myPath, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    callback(err, null);
                    return;
                }

                let item = {name: file, date: stats.mtime.toLocaleString(), type: "", size: formatFileSize(stats.size)};

                if (stats.isFile()) {
                    item.type = "File";
                } else if (stats.isDirectory()) {
                    item.type = "Folder";
                }
                fileData.push(item);

                processedCount++;

                if (processedCount === files.length) {
                    callback(null, fileData.sort(compare));
                }
            });
        });
    });
}

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});