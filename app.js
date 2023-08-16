const fs = require('fs');
const path = require('path');
const express = require("express");
const archiver = require('archiver');
const port = 1234;
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Address of root folder to display files from:
const rootURL = 'C:/Users/irfan.aslam/Desktop/test folder';
let currentURL = rootURL;

app.get("/home", (req, res) => {
    console.log("Current URL:", rootURL);
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
    sendFiles(url, (err, fileData) => {
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

    console.log(`Downloading file: ${fileName}`);
    res.download(filePath);
});

app.get("/zip", async (req, res) => {
    const fileList = req.query.files.split(',');
    console.log(fileList);

    const zip = archiver('zip', {
        zlib: {level: 9} // Set the compression level
    });

    console.log(`Downloading files as zip: ${fileList}`);
    res.attachment('bpmb-files.zip');
    zip.pipe(res);
    await addStuffToZip(zip, fileList);
    await zip.finalize();
});

async function addStuffToZip(zip, listOfItems) {
    for (const itemName of listOfItems) {
        const itemPath = path.join(currentURL, itemName);
        console.log(itemPath);

        try {
            const stats = await fs.promises.stat(itemPath);

            if (stats.isFile()) {
                console.log(`Adding file ${itemName} to archive.`);
                zip.append(fs.createReadStream(itemPath), {name: itemName});
            } else if (stats.isDirectory()) {
                console.log(`Adding folder ${itemName} to archive.`);
                zip.directory(itemPath, itemName);
            } else {
                console.error(`Error: Path is neither a file nor a directory: ${itemName}`);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    }
}

function sendFiles(myPath, callback) {
    const fileData = [];

    fs.readdir(myPath, (err, files) => {
        if (err) {
            console.error('Error reading folder:', err);
            callback(err, null);
            return;
        }

        let processedCount = 0;

        files.forEach(file => {
            const filePath = path.join(myPath, file);
            console.log(filePath);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    callback(err, null);
                    return;
                }

                // Remove the last directory
                const pathParts = myPath.split('/');
                const newPath = pathParts.slice(0, -1).join('/');
                // Add the .. item at the top of the table
                if (fileData.length < 1 && myPath != rootURL) {
                    fileData.push({name: "..", date: "", type: "Folder", size: "", url: newPath});
                }

                let item = {
                    name: file,
                    date: stats.mtime.toLocaleString(),
                    type: "",
                    size: formatFileSize(stats.size),
                    url: filePath
                };

                if (stats.isFile()) {
                    item.type = "File";
                } else if (stats.isDirectory()) {
                    item.type = "Folder";
                }
                fileData.push(item);

                processedCount++;

                // Add currentURL to the end of the JSON response
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