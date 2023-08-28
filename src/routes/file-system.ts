import express from 'express';
// import archiver from 'archiver';
import fs from "fs";
import path from "path";
import {viewPath} from "../app";

const router = express.Router();

// Name of the root directory in the client (displayed on the breadcrumbs)
const homeName = "File System";
const rootPath = "C:/Users/irfan.aslam/Desktop/test folder"; // Must use forward slashes

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

type SortOrder = 'asc' | 'desc';

type SortTypes = 'name' | 'date' | 'type' | 'size';

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
        let sortBy = (req.query.sortBy as SortTypes) || "type";
        let sortOrder = (req.query.sortOrder as SortOrder) || "asc";

        const result = await processData(page, limit, filter, sortBy, sortOrder);
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

function filterData(model: FileData[], filter: string): FileData[] {

    let criteria = JSON.parse(filter) as FilterCriteria;

    return model.filter(item => {
        if (criteria.name && !item.name.includes(criteria.name)) {
            return false;
        }
        if (criteria.date && !item.date.includes(criteria.date)) {
            return false;
        }
        if (criteria.type && item.type !== criteria.type) {
            return false;
        }
        if (criteria.max_size && criteria.min_size && (item.size < criteria.min_size || item.size > criteria.max_size)) {
            return false;
        }
        return true;
    });
}

function sortData(data: FileData[], sortBy: keyof FileData, sortOrder: SortOrder): FileData[] {
    return data.slice().sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (sortOrder === 'asc') {
            if (aValue < bValue) return -1;
            if (aValue > bValue) return 1;
            return 0;
        } else {
            if (aValue > bValue) return -1;
            if (aValue < bValue) return 1;
            return 0;
        }
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

async function processData(page: number, limit: number, filter: string, sortBy: SortTypes, sortOrder: SortOrder) {
    console.log(`page: ${page}, limit: ${limit}, filter: ${filter}, sortBy: ${sortBy}, sortOrder: ${sortOrder}`);

    let hi = await getData(rootPath);
    let lol = filterData(hi, filter);
    let lmao = sortData(lol, sortBy, sortOrder);
    let bye = paginateData(lmao, page, limit);

    return bye;
}

export default router;