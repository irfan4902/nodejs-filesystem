import express from 'express';
import archiver, { Archiver } from 'archiver';
import fs from "fs";
import path from "path";
import { view_path, getConfigData } from "../app";

const router = express.Router();

let root_paths: any[] = [];


//
//  Routes
//


router.get('/file-system', async (req, res) => {
  root_paths = getConfigData().filesystems;
  res.sendFile(path.join(view_path, 'file-system.html'));
});

router.get('/file-system/dir', async (req, res) => {
  try {
    let fs_name = (req.query.fsname as string);
    let fs_root_path = getPathByName(fs_name);
    let path = (req.query.path as string);
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 5;
    let filter = (req.query.filter as string) || "{}";
    let sort_by = (req.query.sort_by as SortTypes) || "type";
    let sort_order = (req.query.sort_order as SortOrder) || "dsc";

    const result = await processData(fs_name, fs_root_path, path, page, limit, filter, sort_by, sort_order);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

router.get('/file-system/download', (req, res) => {
  const file_path = (req.query.filepath as string);
  const fs_name = (req.query.fsname as string);
  const new_path = file_path.replace(fs_name, getPathByName(fs_name));

  if (!fs.existsSync(new_path)) {
    res.status(404).send("File not found");
    return;
  }

  console.log(`Downloading file: ${new_path}`);
  res.download(new_path);
});

router.get('/file-system/zip', async (req, res) => {
  const file_list = (req.query.files as string).split(',');
  const fs_name = (req.query.fsname as string);

  console.log("Downloading files as zip:");
  console.log(file_list);
  console.log(fs_name);

  const zip = archiver('zip', { zlib: { level: 9 } });  // Set the compression level
  await addStuffToZip(zip, file_list, fs_name);
  await zip.finalize();
  zip.pipe(res);
  res.attachment(`${fs_name}.zip`);
});


//
//  Functions
//

function getPathByName(name_to_find: any) {
  const item = root_paths.find(item => item.name === name_to_find);

  if (item) {
    return item.path;
  } else {
    return null;
  }
}

/**
 * Function that describes the high-level logic that happens when a user makes a GET request to /dir
 * @param fs_name
 * @param fs_root_path
 * @param current_path
 * @param page
 * @param limit
 * @param filter
 * @param sort_by
 * @param sort_order
 */
async function processData(fs_name: string, fs_root_path: string, current_path: string, page: number, limit: number, filter: string, sort_by: SortTypes, sort_order: SortOrder) {

  current_path = current_path.replace(fs_name, fs_root_path);

  let data = await getData(fs_name, fs_root_path, current_path);
  let filteredData = filterData(data, filter);
  let sortedData = sortData(filteredData, sort_by, sort_order);
  let paginated_data = paginateData(sortedData, fs_name, fs_root_path, current_path, page, limit);

  if (!(root_paths.some(item => item.path === current_path))) {
    return addParentDirectory(paginated_data, current_path, fs_name, fs_root_path);
  }

  return paginated_data;
}

async function getData(fs_name: string, fs_root_path: string, directory: string): Promise<FileData[]> {
  const file_data: FileData[] = [];

  console.log("Current Directory:", directory);

  try {
    const items: string[] = await fs.promises.readdir(directory);

    // For every item in items, get the file data and add it to statPromises
    const statPromises: Promise<FileData>[] = items.map(async item_name => {
      const file_path = path.join(directory, item_name);
      const stats = await fs.promises.stat(file_path);
      return {
        name: item_name,
        date: stats.mtime,
        date_readable: stats.mtime.toLocaleString(),
        type: stats.isFile() ? "File" : "Folder",
        size: stats.size,
        size_readable: formatFileSize(stats.size),
        url: file_path.replaceAll('\\', '/').replace(fs_root_path, fs_name)
      };
    });

    // Push everything from statPromises to fileData
    file_data.push(...await Promise.all(statPromises));

  } catch (err) {
    console.log("Error reading folder:", err);
    throw err;
  }

  return file_data;
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
    if (criteria.date && !item.date_readable.includes(criteria.date)) {
      return false;
    }
    if (criteria.type && item.type !== criteria.type) {
      return false;
    }
    return true;
  });
}

function sortData(data: FileData[], sort_by: keyof FileData, sort_order: SortOrder): FileData[] {
  return data.slice().sort((a, b) => {
    const aValue = a[sort_by];
    const bValue = b[sort_by];

    if (sort_order === 'asc') {
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

function paginateData(data: FileData[], fs_name: string, fs_root_path: string, path: string, page: number, limit: number): PaginatedResults {
  const start_index = (page - 1) * limit;
  const end_index = start_index + limit;

  const results: PaginatedResults = {
    results: data.slice(start_index, end_index),
    total_pages: Math.ceil(data.length / limit),
    current_path: path.replace(fs_root_path, fs_name),
    home_name: fs_name
  };

  if (end_index < data.length) {
    results.next = {
      page: page + 1,
      limit: limit,
    };
  }

  if (start_index > 0) {
    results.prev = {
      page: page - 1,
      limit: limit,
    };
  }

  return results;
}

function addParentDirectory(paginated_data: PaginatedResults, path: string, fs_name: string, fs_root_path: string): PaginatedResults {

  // Remove the last directory
  const path_parts = path.split('/');
  const new_path = path_parts.slice(0, -1).join('/');

  let parentDir: FileData = {
    name: "..",
    date_readable: "",
    date: new Date(0),
    type: "Folder",
    size: 0,
    size_readable: "",
    url: new_path.replace(fs_root_path, fs_name)
  };

  paginated_data.results.unshift(parentDir);
  return paginated_data;
}

async function addStuffToZip(zip: Archiver, list_of_items: string[], fs_name: string) {
  for (let item of list_of_items) {
    let item_name = path.basename(item);
    let itemPath = item.replace(fs_name, getPathByName(fs_name));

    try {
      const stats = await fs.promises.stat(itemPath);

      if (stats.isFile()) {
        console.log(`Adding file ${item_name} to archive.`);
        zip.append(fs.createReadStream(itemPath), { name: item_name });
      } else if (stats.isDirectory()) {
        console.log(`Adding folder ${item_name} to archive.`);
        zip.directory(itemPath, item_name);
      } else {
        console.error(`Error: Path is neither a file nor a directory: ${item_name}`);
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
  date: Date;
  date_readable: string;
  type: string;
  size: number;
  size_readable: string;
  url: string;
};

type FilterCriteria = {
  name?: string;
  date?: string;
  type?: string;
};

type SortOrder = 'asc' | 'dsc';

type SortTypes = 'name' | 'date' | 'type' | 'size';

type PaginatedResults = {
  results: FileData[];
  total_pages: number;
  current_path: string;
  home_name: string;
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