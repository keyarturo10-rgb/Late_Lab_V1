// Inicialización de jsPDF
const { jsPDF } = window.jspdf;

// Variables globales para configuración de MEGA
let megaConfig = {
    email: null,
    password: null,
    filename: 'recipes.json',
    loggedIn: false,
    storage: null
};

// Función para inicializar los event listeners de MEGA
function initMegaListeners() {
    const configureMegaBtn = document.getElementById('configure-mega');
    const megaModal = document.getElementById('mega-modal');
    const closeModal = document.querySelector('.close');
    const saveMegaConfigBtn = document.getElementById('save-mega-config');
    const megaEmailInput = document.getElementById('mega-email');
    const megaPasswordInput = document.getElementById('mega-password');
    const megaFilenameInput = document.getElementById('mega-filename');
    
    if (configureMegaBtn && megaModal) {
        configureMegaBtn.addEventListener('click', function() {
            if (megaEmailInput && megaPasswordInput && megaFilenameInput) {
                megaEmailInput.value = megaConfig.email || '';
                megaPasswordInput.value = megaConfig.password || '';
                megaFilenameInput.value = megaConfig.filename;
                
                megaModal.style.display = 'block';
            }
        });
    }
    
    if (closeModal && megaModal) {
        closeModal.addEventListener('click', function() {
            megaModal.style.display = 'none';
        });
    }
    
    if (saveMegaConfigBtn) {
        saveMegaConfigBtn.addEventListener('click', function() {
            if (megaEmailInput && megaPasswordInput && megaFilenameInput) {
                megaConfig.email = megaEmailInput.value;
                megaConfig.password = megaPasswordInput.value;
                megaConfig.filename = megaFilenameInput.value;
                
                saveMegaConfig();
                
                if (megaModal) {
                    megaModal.style.display = 'none';
                }
                
                // Intentar iniciar sesión en MEGA
                loginToMega();
            }
        });
    }
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        const megaModal = document.getElementById('mega-modal');
        if (megaModal && event.target === megaModal) {
            megaModal.style.display = 'none';
        }
    });
}

// Cargar configuración de MEGA desde localStorage
function loadMegaConfig() {
    const savedConfig = localStorage.getItem('megaConfig');
    if (savedConfig) {
        megaConfig = JSON.parse(savedConfig);
        updateMegaStatus();
        
        // Intentar iniciar sesión automáticamente si hay credenciales
        if (megaConfig.email && megaConfig.password) {
            loginToMega();
        }
    }
}

// Guardar configuración de MEGA en localStorage
function saveMegaConfig() {
    localStorage.setItem('megaConfig', JSON.stringify(megaConfig));
    updateMegaStatus();
}

// Actualizar la interfaz con el estado de MEGA
function updateMegaStatus() {
    const megaStatusText = document.getElementById('mega-status-text');
    const megaStatus = document.getElementById('mega-status');
    const configureMegaBtn = document.getElementById('configure-mega');
    
    if (megaStatusText && megaStatus && configureMegaBtn) {
        if (megaConfig.loggedIn) {
            megaStatusText.textContent = `Conectado a MEGA: ${megaConfig.email}`;
            megaStatus.classList.add('connected');
            configureMegaBtn.textContent = 'Cerrar sesión';
            configureMegaBtn.removeEventListener('click', null);
            configureMegaBtn.addEventListener('click', signOutFromMega);
        } else {
            megaStatusText.textContent = 'No conectado a MEGA';
            megaStatus.classList.remove('connected');
            configureMegaBtn.textContent = 'Configurar MEGA';
            configureMegaBtn.removeEventListener('click', null);
            configureMegaBtn.addEventListener('click', function() {
                document.getElementById('mega-modal').style.display = 'block';
            });
        }
    }
}

// Iniciar sesión en MEGA
async function loginToMega() {
    if (!megaConfig.email || !megaConfig.password) {
        console.error('Credenciales de MEGA no configuradas');
        return false;
    }
    
    try {
        // Importar dinámicamente la biblioteca mega.js
        const { Storage } = await import('https://unpkg.com/megajs@1.0.1/dist/main.browser-es.mjs');
        
        // Crear instancia de Storage con las credenciales
        megaConfig.storage = new Storage({
            email: megaConfig.email,
            password: megaConfig.password,
            autologin: true,
            autoload: true
        });
        
        // Esperar a que la conexión esté lista
        await megaConfig.storage.ready;
        
        megaConfig.loggedIn = true;
        saveMegaConfig();
        
        console.log('Sesión iniciada en MEGA correctamente');
        
        // Recargar las recetas desde MEGA después de autenticar
        loadRecipes();
        
        return true;
    } catch (error) {
        console.error('Error al iniciar sesión en MEGA:', error);
        megaConfig.loggedIn = false;
        saveMegaConfig();
        
        // Mostrar error al usuario
        alert('Error al iniciar sesión en MEGA: ' + error.message);
        return false;
    }
}

// Cerrar sesión de MEGA
function signOutFromMega() {
    if (megaConfig.storage) {
        megaConfig.storage.close();
        megaConfig.storage = null;
    }
    
    megaConfig.loggedIn = false;
    saveMegaConfig();
    console.log('Sesión de MEGA cerrada');
}

// Guardar recetas en MEGA
async function saveRecipesToMega(recipes) {
    if (!megaConfig.loggedIn || !megaConfig.storage) {
        console.error('No autenticado con MEGA');
        return false;
    }
    
    try {
        // Convertir las recetas a JSON
        const content = JSON.stringify(recipes, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        
        // Buscar el archivo existente
        let existingFile = null;
        try {
            existingFile = await findFileInMega(megaConfig.filename);
        } catch (error) {
            console.log('Archivo no encontrado, se creará uno nuevo');
        }
        
        if (existingFile) {
            // Actualizar archivo existente
            await existingFile.upload(blob, { name: megaConfig.filename });
            console.log('Recetas actualizadas en MEGA correctamente');
        } else {
            // Crear nuevo archivo
            await megaConfig.storage.upload(blob, megaConfig.filename);
            console.log('Recetas guardadas en MEGA correctamente');
        }
        
        return true;
    } catch (error) {
        console.error('Error al guardar en MEGA:', error);
        return false;
    }
}

// Buscar archivo en MEGA
async function findFileInMega(filename) {
    if (!megaConfig.loggedIn || !megaConfig.storage) {
        throw new Error('No autenticado con MEGA');
    }
    
    // Buscar el archivo en la raíz
    const files = megaConfig.storage.root.children;
    for (const file of files) {
        if (file.name === filename) {
            return file;
        }
    }
    
    // Si no se encuentra, buscar recursivamente
    return await findFileRecursive(megaConfig.storage.root, filename);
}

// Búsqueda recursiva de archivos en MEGA
async function findFileRecursive(folder, filename) {
    if (!folder.directory) {
        return null;
    }
    
    // Asegurarse de que los hijos estén cargados
    if (!folder.children) {
        await folder.loadChildren();
    }
    
    for (const file of folder.children) {
        if (file.name === filename) {
            return file;
        }
        
        if (file.directory) {
            const found = await findFileRecursive(file, filename);
            if (found) {
                return found;
            }
        }
    }
    
    return null;
}

// Cargar recetas desde MEGA
async function loadRecipesFromMega() {
    if (!megaConfig.loggedIn || !megaConfig.storage) {
        console.error('No autenticado con MEGA');
        return null;
    }
    
    try {
        // Buscar el archivo
        const file = await findFileInMega(megaConfig.filename);
        if (!file) {
            console.log('Archivo no encontrado en MEGA');
            return null;
        }
        
        // Descargar el contenido del archivo
        const buffer = await file.downloadBuffer();
        const content = buffer.toString('utf8');
        
        // Parsear el JSON
        const recipes = JSON.parse(content);
        console.log('Recetas cargadas desde MEGA correctamente');
        
        return recipes;
    } catch (error) {
        console.error('Error al cargar desde MEGA:', error);
        return null;
    }
}

// Función para mostrar el modal de confirmación
function showConfirmModal() {
    const confirmModal = document.getElementById('confirm-modal');
    if (confirmModal) {
        confirmModal.style.display = 'block';
    }
}

// Función para ocultar el modal de confirmación
function hideConfirmModal() {
    const confirmModal = document.getElementById('confirm-modal');
    if (confirmModal) {
        confirmModal.style.display = 'none';
    }
}

// Función para eliminar todas las recetas
async function deleteAllRecipes() {
    // Eliminar del localStorage
    localStorage.removeItem('flairRecipes');
    
    // También eliminar del archivo en MEGA si está configurado
    if (megaConfig.loggedIn) {
        try {
            const file = await findFileInMega(megaConfig.filename);
            if (file) {
                await file.delete();
                console.log('Archivo eliminado de MEGA correctamente');
            }
        } catch (error) {
            console.error('Error al eliminar archivo de MEGA:', error);
        }
    }
    
    // Recargar la lista de recetas
    loadRecipes();
    hideConfirmModal();
    alert('Todas las recetas han sido eliminadas');
}

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
    
    // Botones para eliminar todas las recetas
    const deleteAllBtn = document.getElementById('delete-all-recipes');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    
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
    
    // Inicializar event listeners para MEGA
    initMegaListeners();
    
    // Cargar configuración de MEGA
    loadMegaConfig();
    
    // Event listeners para eliminar todas las recetas
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', showConfirmModal);
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteAllRecipes);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideConfirmModal);
    }
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        const confirmModal = document.getElementById('confirm-modal');
        if (confirmModal && event.target === confirmModal) {
            hideConfirmModal();
        }
    });
    
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
        
        // Guardar también en MEGA si está configurado
        if (megaConfig.loggedIn) {
            const success = await saveRecipesToMega(savedRecipes);
            if (success) {
                alert('Receta guardada correctamente en MEGA');
            } else {
                alert('Receta guardada localmente, pero error al guardar en MEGA');
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
        
        // Intentar cargar desde MEGA si está configurado
        if (megaConfig.loggedIn) {
            const megaRecipes = await loadRecipesFromMega();
            if (megaRecipes && megaRecipes.length > 0) {
                savedRecipes = megaRecipes;
                localStorage.setItem('flairRecipes', JSON.stringify(savedRecipes));
            }
        }
        
        // Mostrar u ocultar el botón de eliminar todas las recetas
        const dangerZone = document.querySelector('.danger-zone');
        
        if (savedRecipes.length === 0) {
            recipesList.innerHTML = `
                <div class="no-recipes">
                    <p>No hay recetas guardadas todavía.</p>
                    <p>Usa la calculadora y guarda tu primera receta.</p>
                </div>
            `;
            
            // Ocultar el botón de eliminar todas las recetas si no hay recetas
            if (dangerZone) {
                dangerZone.style.display = 'none';
            }
            return;
        }
        
        // Mostrar el botón de eliminar todas las recetas si hay recetas
        if (dangerZone) {
            dangerZone.style.display = 'block';
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
        
        // Actualizar también en MEGA si está configurado
        if (megaConfig.loggedIn) {
            const success = await saveRecipesToMega(savedRecipes);
            if (!success) {
                alert('Receta eliminada localmente, pero error al actualizar MEGA');
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
    
    // Inicializar
    calculateEspresso();
    loadRecipes();
});