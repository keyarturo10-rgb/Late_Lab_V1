// Inicialización de jsPDF
const { jsPDF } = window.jspdf;

// Variables globales para configuración de GitHub
let githubConfig = {
    token: null,
    username: 'keyarturo10-rgb',
    repo: 'Late_Lab_V1',
    file: 'recipes.json'
};

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a los elementos del DOM
    const doseSlider = document.getElementById('dose-slider');
    const doseValue = document.getElementById('dose-value');
    const ratioSlider = document.getElementById('ratio-slider');
    const ratioValue = document.getElementById('ratio-value');
    const grindSlider = document.getElementById('grind-slider');
    const grindValue = document.getElementById('grind-value');
    const tempSlider = document.getElementById('temp-slider');
    const tempValue = document.getElementById('temp-value');
    const timeSlider = document.getElementById('time-slider');
    const timeValue = document.getElementById('time-value');
    const yieldValue = document.getElementById('yield-value');
    const espressoType = document.getElementById('espresso-type');
    
    // Referencias a los elementos del formulario
    const coffeeName = document.getElementById('coffee-name');
    const coffeeVariety = document.getElementById('coffee-variety');
    const coffeeOrigin = document.getElementById('coffee-origin');
    const coffeeAltitude = document.getElementById('coffee-altitude');
    const coffeeProcess = document.getElementById('coffee-process');
    const roastDate = document.getElementById('roast-date');
    const roastType = document.getElementById('roast-type');
    const imageInput = document.getElementById('image-input');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    // Referencias a la evaluación sensorial
    const flavorNotes = document.getElementById('flavor-notes');
    const sweetness = document.getElementById('sweetness');
    const acidity = document.getElementById('acidity');
    const body = document.getElementById('body');
    const balance = document.getElementById('balance');
    const score = document.getElementById('score');
    const additionalNotes = document.getElementById('additional-notes');
    
    // Botones
    const saveRecipeBtn = document.getElementById('save-recipe-btn');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    
    // Tabs
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Lista de recetas
    const recipesList = document.getElementById('recipes-list');
    
    // Elementos de GitHub
    const githubStatus = document.getElementById('github-status');
    const githubStatusText = document.getElementById('github-status-text');
    const configureGithubBtn = document.getElementById('configure-github');
    const githubModal = document.getElementById('github-modal');
    const closeModal = document.querySelector('.close');
    const saveGithubConfigBtn = document.getElementById('save-github-config');
    const githubTokenInput = document.getElementById('github-token');
    const githubUsernameInput = document.getElementById('github-username');
    const githubRepoInput = document.getElementById('github-repo');
    const githubFileInput = document.getElementById('github-file');
    
    // Tipos de molienda según clicks
    const grindTypes = {
        0: 'Muy Fina',
        8: 'Fina', 
        15: 'Media',
        22: 'Gruesa',
        30: 'Muy Gruesa'
    };
    
    // Establecer fecha actual como valor por defecto
    const today = new Date();
    roastDate.value = today.toISOString().split('T')[0];
    
    // Cargar configuración de GitHub desde localStorage
    function loadGithubConfig() {
        const savedConfig = localStorage.getItem('githubConfig');
        if (savedConfig) {
            githubConfig = JSON.parse(savedConfig);
            updateGithubStatus();
        }
    }
    
    // Guardar configuración de GitHub en localStorage
    function saveGithubConfig() {
        localStorage.setItem('githubConfig', JSON.stringify(githubConfig));
        updateGithubStatus();
    }
    
    // Actualizar la interfaz con el estado de GitHub
    function updateGithubStatus() {
        if (githubConfig.token) {
            githubStatusText.textContent = `Conectado a GitHub: ${githubConfig.username}/${githubConfig.repo}`;
            githubStatus.classList.add('connected');
        } else {
            githubStatusText.textContent = 'No conectado a GitHub';
            githubStatus.classList.remove('connected');
        }
    }
    
    // Función para calcular y actualizar la interfaz
    function calculateEspresso() {
        // Obtener valores actuales
        const dose = parseFloat(doseSlider.value);
        const ratio = parseFloat(ratioSlider.value) / 10;
        const grind = parseInt(grindSlider.value);
        const temp = parseInt(tempSlider.value);
        const time = parseInt(timeSlider.value);
        
        // Actualizar valores mostrados
        doseValue.textContent = dose.toFixed(1) + ' g';
        ratioValue.textContent = '1:' + ratio.toFixed(1);
        
        // Determinar el tipo de molienda más cercano
        let closestGrindType = 'Media';
        let closestDiff = Infinity;
        
        for (const key in grindTypes) {
            const diff = Math.abs(grind - parseInt(key));
            if (diff < closestDiff) {
                closestDiff = diff;
                closestGrindType = grindTypes[key];
            }
        }
        
        grindValue.textContent = grind + ' clicks (' + closestGrindType + ')';
        tempValue.textContent = temp + '°C';
        timeValue.textContent = time + ' seg';
        
        // Calcular resultado
        const yield = dose * ratio;
        yieldValue.textContent = yield.toFixed(1);
        
        // Determinar tipo de espresso
        if (ratio < 1.8) {
            espressoType.textContent = 'Ristretto';
        } else if (ratio <= 2.2) {
            espressoType.textContent = 'Espresso';
        } else {
            espressoType.textContent = 'Lungo';
        }
    }
    
    // Función para cambiar de pestaña
    function changeTab(tabName) {
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        tabContents.forEach(content => {
            if (content.id === tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }
    
    // Guardar recetas en GitHub
    async function saveRecipesToGitHub(recipes) {
        if (!githubConfig.token) {
            console.error('Token de GitHub no configurado');
            return false;
        }
        
        try {
            const url = `https://api.github.com/repos/${githubConfig.username}/${githubConfig.repo}/contents/${githubConfig.file}`;
            
            // Primero, intentamos obtener el archivo existente para obtener su SHA
            let sha = null;
            try {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `token ${githubConfig.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    sha = data.sha;
                }
            } catch (e) {
                console.log('Archivo no existe o no se puede acceder, se creará uno nuevo');
            }
            
            // Preparar el contenido para GitHub
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(recipes, null, 2))));
            const message = `Actualización de recetas desde La-té Lab: ${new Date().toLocaleString()}`;
            
            const putResponse = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    content: content,
                    sha: sha
                })
            });
            
            if (putResponse.ok) {
                console.log('Recetas guardadas en GitHub correctamente');
                return true;
            } else {
                console.error('Error al guardar en GitHub:', await putResponse.text());
                return false;
            }
        } catch (error) {
            console.error('Error al guardar en GitHub:', error);
            return false;
        }
    }
    
    // Cargar recetas desde GitHub
    async function loadRecipesFromGitHub() {
        if (!githubConfig.token) {
            console.error('Token de GitHub no configurado');
            return null;
        }
        
        try {
            const url = `https://api.github.com/repos/${githubConfig.username}/${githubConfig.repo}/contents/${githubConfig.file}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const content = decodeURIComponent(escape(atob(data.content)));
                return JSON.parse(content);
            } else {
                console.error('Error al cargar desde GitHub:', await response.text());
                return null;
            }
        } catch (error) {
            console.error('Error al cargar desde GitHub:', error);
            return null;
        }
    }
    
    // Función para guardar la receta completa
    async function saveRecipe() {
        // Validar campos obligatorios
        if (!coffeeName.value.trim()) {
            alert('Por favor, ingresa el nombre del café');
            changeTab('coffee-data');
            return;
        }
        
        // Crear objeto con todos los datos
        const recipeData = {
            id: Date.now(),
            // Datos de la calculadora
            dose: parseFloat(doseSlider.value),
            ratio: parseFloat(ratioSlider.value) / 10,
            grind: parseInt(grindSlider.value),
            temp: parseInt(tempSlider.value),
            time: parseInt(timeSlider.value),
            yield: parseFloat(doseSlider.value) * (parseFloat(ratioSlider.value) / 10),
            espressoType: espressoType.textContent,
            
            // Datos del café
            coffeeName: coffeeName.value,
            coffeeVariety: coffeeVariety.value,
            coffeeOrigin: coffeeOrigin.value,
            coffeeAltitude: coffeeAltitude.value,
            coffeeProcess: coffeeProcess.value,
            roastDate: roastDate.value,
            roastType: roastType.value,
            image: previewImg.src || '',
            
            // Evaluación sensorial
            flavorNotes: flavorNotes.value,
            sweetness: parseInt(sweetness.value),
            acidity: parseInt(acidity.value),
            body: parseInt(body.value),
            balance: parseInt(balance.value),
            score: parseInt(score.value),
            additionalNotes: additionalNotes.value,
            
            // Metadata
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('es-ES')
        };
        
        // Guardar en localStorage
        let savedRecipes = JSON.parse(localStorage.getItem('flairRecipes')) || [];
        savedRecipes.push(recipeData);
        localStorage.setItem('flairRecipes', JSON.stringify(savedRecipes));
        
        // Guardar también en GitHub si está configurado
        if (githubConfig.token) {
            const success = await saveRecipesToGitHub(savedRecipes);
            if (success) {
                alert('Receta guardada correctamente en GitHub');
            } else {
                alert('Receta guardada localmente, pero error al guardar en GitHub');
            }
        } else {
            alert('Receta guardada localmente');
        }
        
        loadRecipes();
        changeTab('recipes');
    }
    
    // Función para cargar las recetas guardadas
    async function loadRecipes() {
        let savedRecipes = JSON.parse(localStorage.getItem('flairRecipes')) || [];
        
        // Intentar cargar desde GitHub si está configurado
        if (githubConfig.token) {
            const githubRecipes = await loadRecipesFromGitHub();
            if (githubRecipes && githubRecipes.length > 0) {
                savedRecipes = githubRecipes;
                localStorage.setItem('flairRecipes', JSON.stringify(savedRecipes));
            }
        }
        
        if (savedRecipes.length === 0) {
            recipesList.innerHTML = `
                <div class="no-recipes">
                    <p>No hay recetas guardadas todavía.</p>
                    <p>Usa la calculadora y guarda tu primera receta.</p>
                </div>
            `;
            return;
        }
        
        recipesList.innerHTML = '';
        
        savedRecipes.sort((a, b) => b.id - a.id).forEach(recipe => {
            const recipeEl = document.createElement('div');
            recipeEl.className = 'recipe-item';
            recipeEl.innerHTML = `
                <div class="recipe-header">
                    <div class="recipe-name">${recipe.coffeeName}</div>
                    <div class="recipe-date">${recipe.date}</div>
                </div>
                <div class="recipe-details">
                    <strong>Dosis:</strong> ${recipe.dose}g | <strong>Ratio:</strong> 1:${recipe.ratio.toFixed(1)}<br>
                    <strong>Molienda:</strong> ${recipe.grind} clicks | <strong>Temperatura:</strong> ${recipe.temp}°C<br>
                    <strong>Tiempo:</strong> ${recipe.time || 30} seg | <strong>Puntuación:</strong> ${recipe.score}/100
                </div>
                <div class="recipe-actions">
                    <button class="recipe-btn view-btn" data-id="${recipe.id}">Ver</button>
                    <button class="recipe-btn pdf-btn" data-id="${recipe.id}">PDF</button>
                    <button class="recipe-btn delete-btn" data-id="${recipe.id}">Eliminar</button>
                </div>
            `;
            recipesList.appendChild(recipeEl);
        });
        
        // Añadir event listeners a los botones
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const recipeId = parseInt(this.dataset.id);
                viewRecipe(recipeId);
            });
        });
        
        document.querySelectorAll('.pdf-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const recipeId = parseInt(this.dataset.id);
                generateRecipePdf(recipeId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const recipeId = parseInt(this.dataset.id);
                deleteRecipe(recipeId);
            });
        });
    }
    
    // Función para ver una receta
    function viewRecipe(recipeId) {
        const savedRecipes = JSON.parse(localStorage.getItem('flairRecipes')) || [];
        const recipe = savedRecipes.find(r => r.id === recipeId);
        
        if (!recipe) {
            alert('Receta no encontrada');
            return;
        }
        
        // Llenar los formularios con los datos de la receta
        doseSlider.value = recipe.dose;
        ratioSlider.value = recipe.ratio * 10;
        grindSlider.value = recipe.grind;
        tempSlider.value = recipe.temp;
        timeSlider.value = recipe.time || 30;
        
        coffeeName.value = recipe.coffeeName;
        coffeeVariety.value = recipe.coffeeVariety || '';
        coffeeOrigin.value = recipe.coffeeOrigin || '';
        coffeeAltitude.value = recipe.coffeeAltitude || '';
        coffeeProcess.value = recipe.coffeeProcess || '';
        roastDate.value = recipe.roastDate || '';
        roastType.value = recipe.roastType || '';
        
        if (recipe.image) {
            previewImg.src = recipe.image;
            imagePreview.style.display = 'block';
        }
        
        flavorNotes.value = recipe.flavorNotes || '';
        sweetness.value = recipe.sweetness || 5;
        acidity.value = recipe.acidity || 5;
        body.value = recipe.body || 5;
        balance.value = recipe.balance || 5;
        score.value = recipe.score || 80;
        additionalNotes.value = recipe.additionalNotes || '';
        
        // Recalcular
        calculateEspresso();
        
        // Cambiar a la pestaña de calculadora
        changeTab('calculator');
    }
    
    // Función para eliminar una receta
    async function deleteRecipe(recipeId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
            return;
        }
        
        let savedRecipes = JSON.parse(localStorage.getItem('flairRecipes')) || [];
        savedRecipes = savedRecipes.filter(r => r.id !== recipeId);
        localStorage.setItem('flairRecipes', JSON.stringify(savedRecipes));
        
        // Actualizar también en GitHub si está configurado
        if (githubConfig.token) {
            const success = await saveRecipesToGitHub(savedRecipes);
            if (!success) {
                alert('Receta eliminada localmente, pero error al actualizar GitHub');
            }
        }
        
        loadRecipes();
    }
    
    // Función para generar PDF de una receta
    function generateRecipePdf(recipeId) {
        const savedRecipes = JSON.parse(localStorage.getItem('flairRecipes')) || [];
        const recipe = savedRecipes.find(r => r.id === recipeId);
        
        if (!recipe) {
            alert('Receta no encontrada');
            return;
        }
        
        // Crear un nuevo documento PDF
        const doc = new jsPDF();
        
        // Añadir contenido al PDF
        doc.setFontSize(20);
        doc.setTextColor(125, 10, 10);
        doc.text('La-té Lab - Receta de Café', 105, 20, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(`Café: ${recipe.coffeeName}`, 20, 40);
        
        doc.setFontSize(12);
        doc.text(`Variedad: ${recipe.coffeeVariety || 'N/A'}`, 20, 50);
        doc.text(`Origen: ${recipe.coffeeOrigin || 'N/A'}`, 20, 60);
        doc.text(`Altura: ${recipe.coffeeAltitude || 'N/A'} msnm`, 20, 70);
        doc.text(`Procesamiento: ${recipe.coffeeProcess || 'N/A'}`, 20, 80);
        doc.text(`Tostado: ${recipe.roastType || 'N/A'} (${recipe.roastDate || 'N/A'})`, 20, 90);
        
        // Parámetros de extracción
        doc.setFontSize(14);
        doc.text('Parámetros de Extracción', 20, 110);
        
        doc.setFontSize(12);
        doc.text(`Dosis: ${recipe.dose}g`, 20, 120);
        doc.text(`Ratio: 1:${recipe.ratio.toFixed(1)} (${recipe.espressoType})`, 20, 130);
        doc.text(`Molienda: ${recipe.grind} clicks`, 20, 140);
        doc.text(`Temperatura: ${recipe.temp}°C`, 20, 150);
        doc.text(`Tiempo: ${recipe.time || 30} segundos`, 20, 160);
        doc.text(`Peso en taza: ${recipe.yield.toFixed(1)}g`, 20, 170);
        
        // Evaluación sensorial
        doc.setFontSize(14);
        doc.text('Evaluación Sensorial', 20, 190);
        
        doc.setFontSize(12);
        doc.text(`Notas de sabor: ${recipe.flavorNotes || 'N/A'}`, 20, 200);
        doc.text(`Dulzor: ${recipe.sweetness}/10`, 20, 210);
        doc.text(`Acidez: ${recipe.acidity}/10`, 20, 220);
        doc.text(`Cuerpo: ${recipe.body}/10`, 20, 230);
        doc.text(`Balance: ${recipe.balance}/10`, 20, 240);
        doc.text(`Puntuación: ${recipe.score}/100`, 20, 250);
        
        if (recipe.additionalNotes) {
            doc.text(`Comentarios: ${recipe.additionalNotes}`, 20, 260);
        }
        
        // Fecha
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 105, 280, { align: 'center' });
        
        // Guardar el PDF
        doc.save(`Receta_${recipe.coffeeName}_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`);
    }
    
    // Event listeners para los sliders
    doseSlider.addEventListener('input', calculateEspresso);
    ratioSlider.addEventListener('input', calculateEspresso);
    grindSlider.addEventListener('input', calculateEspresso);
    tempSlider.addEventListener('input', calculateEspresso);
    timeSlider.addEventListener('input', calculateEspresso);
    
    // Event listener para la carga de imagen
    imageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });
    
    // Event listener para guardar receta
    saveRecipeBtn.addEventListener('click', saveRecipe);
    
    // Event listener para generar PDF
    generatePdfBtn.addEventListener('click', function() {
        // Primero guardar la receta actual
        saveRecipe();
        
        // Luego generar PDF de la última receta guardada
        const savedRecipes = JSON.parse(localStorage.getItem('flairRecipes')) || [];
        if (savedRecipes.length > 0) {
            const lastRecipe = savedRecipes[savedRecipes.length - 1];
            generateRecipePdf(lastRecipe.id);
        }
    });
    
    // Event listeners para las pestañas
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            changeTab(this.dataset.tab);
        });
    });
    
    // Event listeners para la funcionalidad de GitHub
    configureGithubBtn.addEventListener('click', function() {
        githubTokenInput.value = githubConfig.token || '';
        githubUsernameInput.value = githubConfig.username;
        githubRepoInput.value = githubConfig.repo;
        githubFileInput.value = githubConfig.file;
        githubModal.style.display = 'block';
    });
    
    closeModal.addEventListener('click', function() {
        githubModal.style.display = 'none';
    });
    
    saveGithubConfigBtn.addEventListener('click', function() {
        githubConfig.token = githubTokenInput.value;
        githubConfig.username = githubUsernameInput.value;
        githubConfig.repo = githubRepoInput.value;
        githubConfig.file = githubFileInput.value;
        
        saveGithubConfig();
        githubModal.style.display = 'none';
        
        // Recargar las recetas desde GitHub después de configurar
        loadRecipes();
    });
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        if (event.target === githubModal) {
            githubModal.style.display = 'none';
        }
    });
    
    // Inicializar
    loadGithubConfig();
    calculateEspresso();
    loadRecipes();
});