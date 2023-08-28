import express from 'express';
// import archiver from 'archiver';
import fs from "fs";
import path from "path";
import {viewPath} from "../app";

const router = express.Router();

// Name of the root directory in the client (displayed on the breadcrumbs)
const homeName = "File System";
const rootPath = "C:\\Users\\irfan.aslam\\Desktop\\test folder";

// http://localhost:4000/file-system/home?filter={"type":"Folder"}

// Typescript types
type FileData = {
    name: string;
    date: string;
    type: string;
    size: number;
    size_readable: string;
    url: string;
};

type FilterCriteria = {
    name?: string;
    date?: string;
    type?: string;
    min_size?: number;
    max_size?: number;
};

type PaginatedResults = {
    results: FileData[];
    totalPages: number;
    next?: {
        page: number;
        limit: number;
    };
    prev?: {
        page: number;
        limit: number;
    };
};

//
//  Routes
//


router.get('/file-system', (req, res) => {
    res.sendFile(path.join(viewPath, 'file-system.html'));
});

router.get('/file-system/home', async (req, res) => {
    try {
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 5;
        let filter = (req.query.filter as string) || "{}";
        let sort = (req.query.sort as string) || "";

        const result = await processData(page, limit, filter, sort);
        res.status(200).json(result);
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
async function getData(directory: string): Promise<FileData[]> {
    const fileData: FileData[] = [];

    console.log("Current Directory:", directory);

    try {
        const items: string[] = await fs.promises.readdir(directory);

        // For every item in items, get the file data and add it to statPromises
        const statPromises: Promise<FileData>[] = items.map(async itemName => {
            const filePath = path.join(directory, itemName);
            const stats = await fs.promises.stat(filePath);
            return {
                name: itemName,
                date: stats.mtime.toLocaleString(),
                type: stats.isFile() ? "File" : "Folder",
                size: stats.size,
                size_readable: formatFileSize(stats.size),
                url: filePath.replaceAll('\\', '/').replace(rootPath, homeName)
            }
        });

        // Push everything from statPromises to fileData
        fileData.push(...await Promise.all(statPromises));

    } catch (err) {
        console.log("Error reading folder:", err);
        throw err;
    }

    // console.log(fileData);
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

function filterData(model: FileData[], criteria: string): FileData[] {

    let lol = JSON.parse(criteria) as FilterCriteria;
    console.log(lol);

    return model.filter(item => {
        if (lol.name && !item.name.includes(lol.name)) {
            return false;
        }
        if (lol.date && !item.date.includes(lol.date)) {
            return false;
        }
        if (lol.type && item.type !== lol.type) {
            return false;
        }
        if (lol.max_size && lol.min_size && (item.size < lol.min_size || item.size > lol.max_size)) {
            return false;
        }
        return true;
    });
}

function paginateData(model: FileData[], page: number, limit: number): PaginatedResults {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const results: PaginatedResults = {
        results: model.slice(startIndex, endIndex),
        totalPages: Math.ceil(model.length / limit)
    };

    if (endIndex < model.length) {
        results.next = {
            page: page + 1,
            limit: limit,
        };
    }

    if (startIndex > 0) {
        results.prev = {
            page: page - 1,
            limit: limit,
        };
    }

    return results;
}

async function processData(page: number, limit: number, filter: string, sort: string) {
    console.log(`page: ${page}, limit: ${limit}, filter: ${filter}, sort: ${sort}`);

    let hi = await getData(rootPath);
    let lol = filterData(hi, filter);
    let bye = paginateData(lol, page, limit);

    return bye;
}

export default router;