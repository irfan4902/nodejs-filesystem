import express from 'express';
import archiver, {Archiver} from 'archiver';
import fs from "fs";
import path from "path";
import {viewPath} from "../app";

const router = express.Router();

// Name of the root directory in the client (displayed on the breadcrumbs and page title)
const homeName = "File System";
const rootPath = "C:/Users/irfan.aslam/Desktop/test folder"; // Must use forward slashes


//
//  Routes
//


router.get('/file-system', (req, res) => {
    res.sendFile(path.join(viewPath, 'file-system.html'));
});

router.get('/file-system/dir', async (req, res) => {
    try {
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 5;
        let filter = (req.query.filter as string) || "{}";
        let sortBy = (req.query.sortBy as SortTypes) || "type";
        let sortOrder = (req.query.sortOrder as SortOrder) || "dsc";
        let path = (req.query.path as string) || homeName;
        let truePath = path.replace(homeName, rootPath);

        const result = await processData(truePath, page, limit, filter, sortBy, sortOrder);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

router.get('/file-system/download', (req, res) => {
    const filePath = (req.query.filepath as string);
    const newPath = filePath.replace(homeName, rootPath);

    if (!fs.existsSync(newPath)) {
        res.status(404).send("File not found");
        return;
    }

    console.log(`Downloading file: ${newPath}`);
    res.download(newPath);
});

router.get('/file-system/zip', async (req, res) => {
    const fileList = (req.query.files as string).split(',');
    console.log("Downloading files as zip:");
    console.log(fileList);

    const zip = archiver('zip', {zlib: {level: 9}});  // Set the compression level
    await addStuffToZip(zip, fileList);
    await zip.finalize();
    zip.pipe(res);
    res.attachment('NLF-Files.zip');
});


//
//  Functions
//


/**
 * Function that describes the high-level logic that happens when a user makes a GET request
 * @param path
 * @param page
 * @param limit
 * @param filter
 * @param sortBy
 * @param sortOrder
 */
async function processData(path: string, page: number, limit: number, filter: string, sortBy: SortTypes, sortOrder: SortOrder) {
    console.log(`page: ${page}, limit: ${limit}, filter: ${filter}, sortBy: ${sortBy}, sortOrder: ${sortOrder}, path: ${path}`);

    let data = await getData(path);
    let filteredData = filterData(data, filter);
    let sortedData = sortData(filteredData, sortBy, sortOrder);
    let paginatedData = paginateData(sortedData, path, page, limit);

    if (path !== rootPath) {
        return addParentDirectory(paginatedData, path);
    }

    return paginatedData;
}

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

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function filterData(data: FileData[], filter: string): FileData[] {

    let criteria = JSON.parse(filter) as FilterCriteria;

    return data.filter(item => {
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

function paginateData(data: FileData[], path: string, page: number, limit: number): PaginatedResults {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const results: PaginatedResults = {
        results: data.slice(startIndex, endIndex),
        totalPages: Math.ceil(data.length / limit),
        currentPath: path.replace(rootPath, homeName),
        homeName: homeName
    };

    if (endIndex < data.length) {
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

function addParentDirectory(paginatedData: PaginatedResults, path: string): PaginatedResults {

    // Remove the last directory
    const pathParts = path.split('/');
    const newPath = pathParts.slice(0, -1).join('/');

    let parentDir: FileData = {
        name: "..",
        date: "",
        type: "Folder",
        size: 0,
        size_readable: "",
        url: newPath.replace(rootPath, homeName)
    }

    paginatedData.results.unshift(parentDir);
    return paginatedData;
}

async function addStuffToZip(zip: Archiver, listOfItems: string[]) {
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


//
//  TypeScript types
//


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

type SortOrder = 'asc' | 'dsc';

type SortTypes = 'name' | 'date' | 'type' | 'size';

type PaginatedResults = {
    results: FileData[];
    totalPages: number;
    currentPath: string;
    homeName: string;
    next?: {
        page: number;
        limit: number;
    };
    prev?: {
        page: number;
        limit: number;
    };
};

export default router;