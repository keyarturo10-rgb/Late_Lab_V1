# La-té Lab - Laboratorio de café espresso

Una aplicación web para calcular y guardar recetas de café espresso, específicamente diseñada para Flair Classic.

## Características

- Calculadora de parámetros de espresso (dosis, ratio, molienda, temperatura, tiempo)
- Gestión de datos de café de especialidad
- Evaluación sensorial SCA
- Almacenamiento de recetas en Dropbox
- Generación de PDFs de recetas

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript vanilla
- jsPDF para generación de PDFs
- HTML2Canvas para captura de pantalla
- API de Dropbox para almacenamiento

## Uso

1. Abre `index.html` en tu navegador
2. Configura Dropbox en la pestaña de configuración
3. Comienza a crear y guardar tus recetas de café

## Estructura de archivos

- `index.html` - Archivo principal
- `style.css` - Estilos de la aplicación
- `script.js` - Lógica de la aplicación

## Configuración de Dropbox

Para usar la función de almacenamiento en la nube:
1. Ve a [Dropbox Developers](https://www.dropbox.com/developers/apps)
2. Crea una nueva aplicación con "Scoped access"
3. Configura los permisos de archivo (files.metadata.read y files.content.write)
4. Copia la App Key y pégala en la configuración de la app

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.