window.previewImage = () => {
    const fileInput = document.getElementById('animalImage');
    const previewContainer = document.getElementById('imagePreview');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.alt = 'Image Preview';
            img.classList.add('img-fluid');
            previewContainer.innerHTML = '';
            previewContainer.appendChild(img);
        };

        reader.readAsDataURL(file);
    }
};

document.getElementById('animalImage').addEventListener('change', previewImage);

class AnimalCard {
    constructor(containerId, url, options) {
        this.container = document.getElementById(containerId);
        this.url = url;
        this.options = options;
        this.data = [];
        this.sortOrder = {};
        this.fetchData();
    }
    async fetchData() {
        try {
            const response = await fetch(this.url);
            if (!response.ok) throw new Error(`Failed to fetch data from ${this.url}`);
            const result = await response.json();
            
            if (Array.isArray(result)) {
                this.data = result;
            } else {
                throw new Error('Fetched data is not an array.');
            }
            
            this.render();
        } catch (error) {
            console.error('Error fetching data:', error.message);
        }
    }

    // Render cards
    render() {
        if (!this.data || this.data.length === 0) {
            this.container.innerHTML = '<p>No data available.</p>';
            return;
        }
    
        const defaultImage = './images/default.jpg';
    
        this.container.innerHTML = `
            <button class="btn btn-primary mb-3 d-flex" onclick="openAddModal('${this.options.key}')">Add Animal</button>
            <div class="row">
                ${this.data
                    .map(
                        (row) => `
                    <div class="col-md-3 d-flex mb-4">
                        <div class="animal-card">
                            <img src="${row.image || defaultImage}" alt="${row.name}" class="animal-image">
                            <div class="card-body">
                                <p class="card-text">
                                    Name: <span style="${
                                        this.options.key === 'dogs' 
                                            ? 'font-weight: bold;' 
                                            : this.options.key === 'bigFish' 
                                            ? 'font-weight: bold; font-style: italic; color: blue;' 
                                            : ''
                                    }">${row.name}</span>
                                </p>

                                <p class="card-text">Location: ${row.location}</p>
                                <p class="card-text">Size: ${row.size} ft</p>
                                <div class="card-buttons">
                                    <button class="btn btn-warning" onclick="openEditModal('${this.options.key}', '${row.name}')">Edit</button>
                                    <button class="btn btn-danger" onclick="deleteRow('${this.options.key}', '${row.name}')">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>`
                    )
                    .join('')}
                <div class="border mt-3 mb-5"></div>
            </div>
        `;
    }
    
    sortData(column) {
        this.sortOrder[column] = this.sortOrder[column] === 'asc' ? 'desc' : 'asc';

        if (column === 'size') {
            this.data.sort((a, b) =>
                this.sortOrder[column] === 'asc' ? parseFloat(a.size) - parseFloat(b.size) : parseFloat(b.size) - parseFloat(a.size)
            );
        } else {
            this.data.sort((a, b) => {
                const valA = a[column].toLowerCase();
                const valB = b[column].toLowerCase();
                if (valA < valB) return this.sortOrder[column] === 'asc' ? -1 : 1;
                if (valA > valB) return this.sortOrder[column] === 'asc' ? 1 : -1;
                return 0;
            });
        }
        this.render();
    }
}

const cards = {
    bigCats: new AnimalCard('bigCatsCardContainer', './bigCats.json', {
        key: 'bigCats',
    }),
    dogs: new AnimalCard('dogsCardContainer', './dogs.json', {
        key: 'dogs',
    }),
    bigFish: new AnimalCard('bigFishCardContainer', './bigFish.json', {
        key: 'bigFish',
    }),
};

window.openAddModal = (key) => {
    const modalTitle = document.getElementById('animalFormModalLabel');
    modalTitle.textContent = 'Add Animal';
    document.getElementById('animalForm').reset();
    document.getElementById('imagePreview').innerHTML = ''; 
    document.getElementById('animalForm').onsubmit = (event) => handleAddFormSubmit(event, key);
    const modal = new bootstrap.Modal(document.getElementById('animalFormModal'));
    modal.show();
};

window.handleAddFormSubmit = (event, key) => {
    event.preventDefault();
    const table = cards[key];
    const name = document.getElementById('animalName').value;
    const location = document.getElementById('animalLocation').value;
    const size = document.getElementById('animalSize').value;

    const imageInput = document.getElementById('animalImage');
    const imageFile = imageInput.files[0];
    const defaultImage = './images/default.jpg';

    const reader = new FileReader();
    reader.onload = function(event) {
        const imageBase64 = imageFile ? event.target.result : defaultImage;

        if (!imageBase64.startsWith('data:image/') && imageFile) {
            alert('Please upload a valid image.');
            return;
        }

        if (table.data.some((row) => row.name.toLowerCase() === name.toLowerCase())) {
            alert('Duplicate name! An animal with this name already exists.');
            return;
        }

        let sizeNumber = parseFloat(size);
        if (isNaN(sizeNumber) || sizeNumber <= 0) {
            alert('Size must be a positive number.');
            return;
        }

        sizeNumber = Math.round(sizeNumber);

        table.data.push({ name, image: imageBase64, location, size: sizeNumber });
        table.render();
        bootstrap.Modal.getInstance(document.getElementById('animalFormModal')).hide();
    };

    if (imageFile) {
        reader.readAsDataURL(imageFile);
    } else {
        reader.onload({ target: { result: defaultImage } });
    }
};

window.openEditModal = (key, name) => {
    const table = cards[key];
    const row = table.data.find((row) => row.name === name);
    if (!row) return;

    const modalTitle = document.getElementById('animalFormModalLabel');
    modalTitle.textContent = 'Edit Animal';

    document.getElementById('animalName').value = row.name;
    document.getElementById('animalLocation').value = row.location;
    document.getElementById('animalSize').value = row.size;

    const imagePreviewContainer = document.getElementById('imagePreview');
    const img = document.createElement('img');
    img.src = row.image;
    img.alt = 'Image Preview';
    img.classList.add('img-fluid');
    img.style.maxWidth = '100%';
    imagePreviewContainer.innerHTML = '';
    imagePreviewContainer.appendChild(img);

    document.getElementById('animalForm').onsubmit = (event) => handleEditFormSubmit(event, key, name);
    const modal = new bootstrap.Modal(document.getElementById('animalFormModal'));
    modal.show();
};

window.handleEditFormSubmit = (event, key, oldName) => {
    event.preventDefault();
    const table = cards[key];
    const name = document.getElementById('animalName').value;
    const location = document.getElementById('animalLocation').value;
    const size = document.getElementById('animalSize').value;

    const imageInput = document.getElementById('animalImage');
    const imageFile = imageInput.files[0];

    let image = table.data.find((row) => row.name === oldName).image;

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            image = event.target.result;

            if (!image.startsWith('data:image/')) {
                alert('Please upload a valid image.');
                return;
            }

            updateAnimalData(image);
        };

        reader.readAsDataURL(imageFile);
    } else {
        updateAnimalData(image);
    }

    function updateAnimalData(image) {
        if (table.data.some((row) => row.name.toLowerCase() === name.toLowerCase() && row.name !== oldName)) {
            alert('Duplicate name! An animal with this name already exists.');
            return;
        }

        let sizeNumber = parseFloat(size);
        if (isNaN(sizeNumber) || sizeNumber <= 0) {
            alert('Size must be a positive number (either integer or float).');
            return;
        }

        sizeNumber = Math.round(sizeNumber);

        const row = table.data.find((row) => row.name === oldName);
        row.name = name;
        row.location = location;
        row.size = sizeNumber;
        row.image = image;

        table.render();
        bootstrap.Modal.getInstance(document.getElementById('animalFormModal')).hide();
    }
};

window.deleteRow = (key, name) => {
    const table = cards[key];
    table.data = table.data.filter((row) => row.name !== name);
    table.render();
};

window.sortBigCats = (column) => {
    const table = cards['bigCats'];
    table.sortData(column);
};

window.sortDogs = (column) => {
    if (['name', 'location'].includes(column)) {
        const table = cards['dogs'];
        table.sortData(column);
    }
};

window.sortBigFish = () => {
    const table = cards['bigFish'];
    table.sortData('size');
};
