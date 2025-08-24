# La-té Lab

Una aplicación web para calcular y registrar recetas de espresso para la prensa Flair Classic.

## Características

- Calculadora de parámetros de extracción (dosis, ratio, molienda, temperatura, tiempo)
- Registro de datos de café de especialidad
- Evaluación sensorial según estándares SCA
- Base de datos de recetas guardadas
- Almacenamiento en GitHub con token personal
- Generación de PDFs para compartir recetas
- Diseño responsive para móviles y desktop
- Logo minimalista abstracto inspirado en Julien Gachadoat

## Tecnologías utilizadas

- HTML5, CSS3, JavaScript vanilla
- jsPDF para generación de PDFs
- GitHub API para almacenamiento
- Google Fonts (Montserrat)
- LocalStorage para persistencia de datos offline

## Cómo usar

1. Abre la aplicación en tu navegador
2. Configura tu token de GitHub en la barra superior
3. Navega entre las pestañas para:
   - Calcular parámetros de extracción
   - Registrar datos del café
   - Realizar evaluación sensorial
   - Ver recetas guardadas
4. Guarda tus recetas completas con el botón "Guardar Receta Completa"
5. Genera PDFs para compartir o imprimir tus recetas

## Configuración de GitHub (2025)

Para usar el almacenamiento en GitHub:

1. Inicia sesión en tu cuenta de GitHub
2. Ve a Settings > Developer settings > Personal access tokens
3. Haz clic en "Generate new token"
4. Selecciona el alcance "repo" para dar acceso a repositorios
5. Copia el token generado (comienza con `ghp_`)
6. En La-té Lab, haz clic en "Configurar GitHub" y pega tu token
7. Asegúrate de que el nombre de usuario y repositorio sean correctos

## Instalación y Despliegue

### Método 1: GitHub Pages (Recomendado)

1. Crear un nuevo repositorio en GitHub llamado `Late_Lab_V1`
2. Subir todos los archivos al repositorio
3. Ir a Settings > Pages
4. Seleccionar la rama `main` y la carpeta `/root`
5. Guardar los cambios
6. La aplicación estará disponible en `https://keyarturo10-rgb.github.io/Late_Lab_V1/`

### Método 2: Alojamiento local

1. Descargar todos los archivos
2. Abrir `index.html` en cualquier navegador moderno

## Estructura del proyecto
