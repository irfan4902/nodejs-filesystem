const baseURL: string = window.location.origin + '/file-system';

let homeName: string = '';
let currentPath: string = '';
let page: number = 1;
const limitInput: HTMLInputElement = document.getElementById("input_limit") as HTMLInputElement;
limitInput.value = "5"; // Limit
let filter: string = '';
let sortBy: string = 'type';
let sortOrder: string = 'dsc';

let lastClickedIndex: number = -1;

window.addEventListener('load', async () => {
    const queryParams = new URLSearchParams(window.location.search);
    let bruh = queryParams.get('type') as string;
    console.log('TYPE: ' + bruh);

    currentPath = bruh;
    homeName = bruh;

    await fetchData();
});

async function fetchData() {
    try {
        const url = `/dir?type=${homeName}&path=${currentPath}&page=${page}&limit=${limitInput.value}&filter=${filter}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
        console.log(url);
        const response = await fetch(baseURL + url);
        const data = await response.json();

        // homeName = bruh;
        // currentPath = data.currentPath;

        console.log(data);
        updateUI(data);
    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}

function goTo(path: string) {
    currentPath = path;
    fetchData();
}

function goUp() {
    currentPath = removeOneDir(currentPath);
    fetchData();
}

function changePage(change: number) {
    page += change;
    fetchData();
}

function sortTable(criteria: string) {
    const arrow_image = document.getElementById("img_" + criteria) as HTMLImageElement;
    const thead = document.getElementById("thead_" + criteria) as HTMLElement;

    const allImages = document.getElementsByClassName("arrow");
    const allTheads = document.getElementsByClassName("header");

    for (let i = 0; i < 4; i++) {
        (allTheads[i] as HTMLElement).style.background = "white";
        (allImages[i] as HTMLElement).style.visibility = "hidden";
    }

    arrow_image.style.visibility = "visible";
    thead.style.background = "rgba(52,152,219,0.2)";

    if (sortBy === criteria) {
        sortOrder = sortOrder === 'asc' ? 'dsc' : 'asc';
    } else {
        sortBy = criteria;
        sortOrder = 'asc';
    }


    arrow_image.src = sortOrder === 'asc' ? "/public/img/expand_less.png" : "/public/img/expand_more.png";

    fetchData();
}

function removeOneDir(path: string): string {
    const pathParts = path.split('/');
    return pathParts.slice(0, -1).join('/');
}

function updateUI(data: PaginatedResults) {
    (document.getElementById("title") as HTMLHeadingElement).innerHTML = homeName;
    updateTable(data);
    updatePagination(data);
    updateBreadcrumb();
}

function updateTable(data: any) {
    const tableBody = document.getElementById('file-table-body') as HTMLTableSectionElement;
    tableBody.innerHTML = '';

    for (const item of data.results) {
        const row = tableBody.insertRow(-1);
        const cell1 = row.insertCell(0); // Checkboxes
        const cell2 = row.insertCell(1); // Name
        const cell3 = row.insertCell(2); // Date Modified
        const cell4 = row.insertCell(3); // Type
        const cell5 = row.insertCell(4); // Size
        const cell6 = row.insertCell(5); // Action

        // If the item name is not '', then add a checkbox
        cell1.innerHTML = item.name !== '..' ? `<input type="checkbox" value="${item.name}">` : '';

        if (item.name === '..') {
            cell2.innerHTML =
                `<div>
                    <img class="parent_icon" src="/public/img/folder_up.png" onclick="goUp()" alt="parent directory">
                    <a href="#" onclick="goUp()">[parent directory]</a>
                </div>`;
        } else if (item.type === "Folder") {
            cell2.innerHTML = `<a href="#" onclick="goTo('${item.url}')">${item.name}</a>`;
        } else if (item.type === "File") {
            cell2.innerHTML = item.name;
        }

        cell3.innerHTML = item.date;
        cell4.innerHTML = item.type;

        if (item.type === "File") {
            cell5.innerHTML = item.size_readable;
            cell6.innerHTML = `<button onclick="window.location.href='${baseURL}/download?filepath=${item.url}'">Download</button>`;
        }
    }

    let checkboxes = document.querySelectorAll('input[type="checkbox"]');

    for (let i = 0; i < checkboxes.length; i++) {
        const checkbox = checkboxes[i] as HTMLInputElement;
        checkbox.addEventListener('click', event => handleCheckboxClick(event, i));
    }
}

const nextButtons = document.getElementsByClassName("btn_next");
const prevButtons = document.getElementsByClassName("btn_prev");
const pageText = document.getElementById("txt_page") as HTMLDivElement;

function updatePagination(data: PaginatedResults) {
    for (let button of nextButtons as any) {
        button.disabled = !data.hasOwnProperty("next");
    }
    for (let button of prevButtons as any) {
        button.disabled = !data.hasOwnProperty("prev");
    }
    pageText.innerHTML = `Page: ${page}/${data.totalPages}`;
}

function updateBreadcrumb() {
    let breadcrumb = document.getElementById("breadcrumb") as HTMLUListElement;

    breadcrumb.innerHTML = '';

    let paths = currentPath.split('/');

    for (let i = 0; i < paths.length; i++) {
        let p = currentPath;

        for (let j = paths.length - 1; j > i; j--) {
            p = removeOneDir(p);
        }

        breadcrumb.innerHTML += `<li><a href="#" onclick="goTo('${p}')">${paths[i]}</a></li>`;
    }
}

function handleCheckboxClick(event: MouseEvent, currentIndex: number) {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];

    if (event.shiftKey && lastClickedIndex !== -1) {
        const minIndex = Math.min(currentIndex, lastClickedIndex);
        const maxIndex = Math.max(currentIndex, lastClickedIndex);

        for (let i = minIndex + 1; i < maxIndex; i++) {
            checkboxes[i].checked = true;
        }
    }

    lastClickedIndex = currentIndex;
}

function selectAllItems() {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
    const selectAllBox = document.getElementById("selectAll") as HTMLInputElement;

    const isChecked = selectAllBox.checked;

    for (const checkbox of checkboxes) {
        checkbox.checked = isChecked;
    }
}

function zipItems() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
    const selectedItems: string[] = [];

    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selectedItems.push(`${currentPath}/${checkboxes[i].value}`);
        }
    }

    window.location.href = `${baseURL}/zip?files=${selectedItems.join()}`;
}

function convertDateFormat(inputDate: string) {
    const parts = inputDate.split('/');
    if (parts.length !== 3) {
        throw new Error('Invalid date format');
    }

    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    if (day.length !== 2 || month.length !== 2 || year.length !== 4) {
        throw new Error('Invalid date format');
    }

    return `${day}/${month}/${year}`;
}

function getFilter() {
    const filter_name = (document.getElementById("filter_name") as HTMLInputElement).value;
    const filter_date = (document.getElementById("filter_date") as HTMLInputElement).value;
    const filter_files = (document.getElementById("filter_files") as HTMLInputElement).checked;
    const filter_folders = (document.getElementById("filter_folders") as HTMLInputElement).checked;
    console.log(`name: ${filter_name}, date: ${filter_date}, files: ${filter_files}, folders: ${filter_folders}`);

    let type: string;
    let date: string;

    if (filter_files && !filter_folders) {
        type = "File"
    } else if (!filter_files && filter_folders) {
        type = "Folder"
    } else {
        type = ''
    }

    if (filter_date) {
        date = convertDateFormat(filter_date.replaceAll('-','/'));
    } else {
        date = ''
    }

    filter = `{"name":"${filter_name}","date":"${date}","type":"${type}"}`;
    console.log(filter);
    fetchData();
}

const toggleButton = document.getElementById("toggle_filters") as HTMLInputElement;
const content = document.getElementById("filter_form") as HTMLElement;
toggleButton.addEventListener("click", () => {
    content.style.display = content.style.display === "none" ? "block" : "none";
});

type FileData = {
    name: string;
    date: string;
    type: string;
    size: number;
    size_readable: string;
    url: string;
};

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