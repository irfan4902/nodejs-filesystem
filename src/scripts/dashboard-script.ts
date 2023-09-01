window.addEventListener('load', async () => {
    await getFileSystems();
});

async function getFileSystems() {
    try {
        const response = await fetch('/get-filesystems');
        const data = await response.json();
        console.log(data);

        for (const f of data) {
            addBox(f.name);
        }
    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}

function addBox(name: string) {
    const container = document.getElementById("box-container") as HTMLElement;

    const html = `
        <div class="box">
            <img class="box-image" src="/public/img/folder.svg" alt="${name}">
            <br>
            <a class="box-link" href="/file-system?type=${encodeURIComponent(name)}">${name}</a>
        </div>
    `;

    container.innerHTML += html;
}