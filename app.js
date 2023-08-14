const fs = require('fs');
const path = require('path');
const express = require("express");
const port = 1234;
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
// Address of root folder to display files from:
const rootURL = 'C:\\Users\\irfan.aslam\\Desktop\\test folder';
let currentURL = rootURL;

app.get("/info", (req, res) => {
    sendFiles(rootURL, (err, fileData) => {
        if (err) {
            console.error('Error sending files:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).json(fileData);
        }
    });
});

app.get("/info2", (req, res) => {
    const url = req.query.url;
    const folderPath = path.join(currentURL, url);
    currentURL = folderPath;
    console.log("Current URL:", currentURL);
    console.log("Root URL:", rootURL);
    sendFiles(folderPath, (err, fileData) => {
        if (err) {
            console.error('Error sending files:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).json(fileData);
        }
    });
});

app.get("/download", (req, res) => {
    const filename = req.query.filename;
    const filePath = path.join(currentURL, filename);

    if (!fs.existsSync(filePath)) {
        res.status(404).send("File not found");
        return;
    }
    res.download(filePath);
});

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

                if (fileData.length < 1 && currentURL !== rootURL) {
                    fileData.push({name: "..", date: "", type: "Folder", size: ""});
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
                    fileData.push({"bruh": currentURL});
                    callback(null, fileData.sort(compare));
                }
            });
        });
    });
}

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

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});