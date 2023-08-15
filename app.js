const fs = require('fs');
const path = require('path');
const express = require("express");
const archiver = require('archiver');
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
    const fileName = req.query.filename;
    const filePath = path.join(currentURL, fileName);

    if (!fs.existsSync(filePath)) {
        res.status(404).send("File not found");
        return;
    }
    res.download(filePath);
});

app.get("/zip", async (req, res) => {
    const fileList = req.query.files.split(',');
    console.log(fileList);

    const zip = archiver('zip', {
        zlib: { level: 9 } // Set the compression level
    });

    res.attachment('bruh.zip');
    zip.pipe(res);

    await addStuffToZip(zip, fileList);

    zip.finalize();
});

async function addStuffToZip(zip, listOfItems) {
    console.log("bruh moment");
    for (const itemName of listOfItems) {
        const itemPath = path.join(currentURL, itemName);
        console.log(itemPath);

        try {
            const stats = await fs.promises.stat(itemPath);

            if (stats.isFile()) {
                console.log(`The path points to a file: ${itemName}`);
                const readableStream = fs.createReadStream(itemPath);
                zip.append(readableStream, { name: itemName });
            } else if (stats.isDirectory()) {
                console.log(`The path points to a directory: ${itemName}`);
                await addDirectoryToZip(zip, itemPath, itemName);
            } else {
                console.log(`The path is neither a file nor a directory: ${itemName}`);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    }
}

async function addDirectoryToZip(zip, dirPath, baseName) {
    const items = await fs.promises.readdir(dirPath);

    for (const item of items) {
        const itemPath = path.join(dirPath, item);

        try {
            const stats = await fs.promises.stat(itemPath);

            if (stats.isFile()) {
                console.log(`Adding file to archive: ${item}`);
                const readableStream = fs.createReadStream(itemPath);
                zip.append(readableStream, { name: path.join(baseName, item) });
            } else if (stats.isDirectory()) {
                console.log(`Recursing into directory: ${item}`);
                await addDirectoryToZip(zip, itemPath, path.join(baseName, item));
            }
        } catch (err) {
            console.error('Error:', err);
        }
    }
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
                    fileData.push({"path": currentURL});
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