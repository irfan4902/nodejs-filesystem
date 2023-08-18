const fs = require('fs');
const path = require('path');
const url = require("url");
const archiver = require('archiver');
const express = require("express");
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Port number
const port = 1234;
// Address of the root directory of the file system
const rootPath = "C:/Users/irfan.aslam/Desktop/test folder";
// Name of the root directory in the client (displayed on the breadcrumbs)
const homeName = "File System";

app.get("/home", (req, res) => {
    console.log("Current URL:", rootPath);
    sendFiles(rootPath, (err, fileData) => {
        if (err) {
            console.error('Error sending files:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).json(fileData);
        }
    });
});

app.get("/dir", (req, res) => {
    const url = req.query.url;

    let newUrl = url.replace(homeName, rootPath);
    console.log("Changing directory to:", newUrl);

    sendFiles(newUrl, (err, fileData) => {
        if (err) {
            console.error('Error sending files:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).json(fileData);
        }
    });
});

app.get("/download", (req, res) => {
    const filePath = req.query.filepath;
    const newPath = filePath.replace(homeName, rootPath);

    if (!fs.existsSync(newPath)) {
        res.status(404).send("File not found");
        return;
    }

    console.log(`Downloading file: ${newPath}`);
    res.download(newPath);
});

app.get("/zip", async (req, res) => {
    let fileList = req.query.files.split(',');
    console.log("Downloading files as zip:");
    console.log(fileList);

    const zip = archiver('zip', {zlib: {level: 9}});  // Set the compression level
    await addStuffToZip(zip, fileList);
    await zip.finalize();
    zip.pipe(res);
    res.attachment('NLF-Files.zip');
});

/**
 * Sends file data for the given directory.
 * @param {string} directory - Directory path
 * @param {function} callback - Callback function
 */
function sendFiles(directory, callback) {
    const fileData = [];

    console.log("Current Directory:", directory);

    fs.readdir(directory, (err, items) => {
        if (err) {
            console.error('Error reading folder:', err);
            callback(err, null);
            return;
        }

        // Remove the last directory
        const pathParts = directory.split('/');
        const newPath = pathParts.slice(0, -1).join('/');

        // Add the .. item at the top of the table
        if (fileData.length < 1 && directory !== rootPath) {
            fileData.push({
                name: "..",
                date: "",
                type: "Folder",
                size: "",
                url: newPath.replace(rootPath, homeName)
            });
        }

        let processedCount = 0;

        items.forEach(itemName => {
            const filePath = path.join(directory, itemName);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    callback(err, null);
                    return;
                }

                let item = {
                    name: itemName,
                    date: stats.mtime.toLocaleString(),
                    type: "",
                    size: formatFileSize(stats.size),
                    url: filePath.replaceAll('\\', '/').replace(rootPath, homeName)
                };

                if (stats.isFile()) {
                    item.type = "File";
                } else if (stats.isDirectory()) {
                    item.type = "Folder";
                }
                fileData.push(item);

                processedCount++;

                if (processedCount === items.length) {
                    callback(null, fileData.sort(compare));
                    return;
                }
            });
        });
        if (processedCount === items.length) {
            callback(null, fileData.sort(compare));
        }
    });
}

/**
 * Adds files or folders to the .zip archive.
 * @param {Archiver} zip - Archiver object
 * @param {string[]} listOfItems - List of item paths
 */
async function addStuffToZip(zip, listOfItems) {
    for (let item of listOfItems) {
        let itemName = path.basename(item);
        let itemPath = item.replace(homeName, rootPath);

        try {
            const stats = await fs.promises.stat(itemPath);

            if (stats.isFile()) {
                console.log(`Adding file ${itemName} to archive.`);
                zip.append(fs.createReadStream(itemPath), {name: itemName});
            }
            else if (stats.isDirectory()) {
                console.log(`Adding folder ${itemName} to archive.`);
                zip.directory(itemPath, itemName);
            }
            else {
                console.error(`Error: Path is neither a file nor a directory: ${itemName}`);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    }
}

/**
 * Compares items for sorting.
 * @returns {number} - Comparison result.
 */
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

/**
 * Formats file size for better readability.
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});