import express from 'express';
import url from 'url';
// import archiver from 'archiver';
import fs from "fs";
import path from "path";
import {viewPath} from "../app";

const router = express.Router();

// Name of the root directory in the client (displayed on the breadcrumbs)
const homeName = "File System";
const rootPath = "D:/Irfan's Files/Southampton";

// Typescript
type FileData = {
    name: string;
    date: string;
    type: string;
    size: string;
    url: string;
};

//
//  Routes
//

router.get('/file-system', (req, res) => {
    res.sendFile(path.join(viewPath, 'file-system.html'));
});

router.get('/file-system/home', async (req, res) => {
    try {
        const hi = await sendFiles(rootPath);
        res.status(200).json(hi);
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});


//
//  Functions
//


/**
 * Sends file data for the given directory.
 * @param {string} directory - Directory path
 */
async function sendFiles(directory: string): Promise<FileData[]> {
    const fileData: FileData[] = [];

    console.log("Current Directory:", directory);

    try {
        const items: string[] = await fs.promises.readdir(directory);
    
        // For every item in items, get the file data and add it to statPromises
        const statPromises: Promise<FileData>[] = items.map(async itemName => {
            const filePath= path.join(directory, itemName);
            const stats = await fs.promises.stat(filePath);
            return {
                name: itemName,
                date: stats.mtime.toLocaleString(),
                type: stats.isFile() ? "File" : "Folder",
                size: formatFileSize(stats.size),
                url: filePath.replaceAll('\\', '/').replace(rootPath, homeName)
            }
        });
    
        // Push everything from statPromises to fileData
        fileData.push(...await Promise.all(statPromises));

    } catch (err) {
        console.log("Error reading folder:", err);
        throw err;
    }
    
    console.log(fileData);
    return fileData;
}

/**
 * Formats file size for better readability.
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default router;