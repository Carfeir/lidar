import express from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import cors from 'cors';

// Configuración del servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Obtén el directorio actual de la forma adecuada para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Verifica si estamos en un sistema operativo Windows
const isWindows = os.platform() === 'win32';

// Configura la ruta del ejecutable de PotreeConverter
const potreePath = isWindows
    ? 'PotreeConverter.exe'
    : path.join(__dirname, 'bin/linux/PotreeConverter');

console.log(`Using PotreeConverter path: ${potreePath}`);

// Configura CORS
app.use(cors());

// Configura multer para manejar las subidas de archivos (almacenamiento en memoria)
const storage = multer.memoryStorage(); // Usar almacenamiento en memoria
const upload = multer({ storage });

// Configura la carpeta 'public' para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de subida de archivos
app.post('/upload', upload.single('file'), handleFileUpload);

// Función para manejar la subida de archivos
function handleFileUpload(req, res) {
    if (!req.file) {
        return res.status(400).send('No files were uploaded.');
    }

    const fileBuffer = req.file.buffer;
    const outputDir = path.join(__dirname, 'public', 'pointcloud');

    // Crear archivo temporal para la conversión
    const tempFilePath = createTempFile(fileBuffer);

    // Comando de PotreeConverter
    const potreeCmd = `${potreePath} ${tempFilePath} -o ${outputDir} -l 5`;

    console.log(`Running PotreeConverter with command: ${potreeCmd}`);

    // Ejecutar el proceso de conversión
    exec(potreeCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Exec error: ${error.message}`);
            cleanUpTempFile(tempFilePath);
            return res.status(500).send(`Error converting file: ${error.message}`);
        }

        // Mostrar salida del proceso
        if (stdout) {
            console.log(`Conversion output: ${stdout}`);
        }
        if (stderr) {
            console.error(`Conversion error output: ${stderr}`);
        }

        // Limpiar archivo temporal
        cleanUpTempFile(tempFilePath);

        res.send('File processed successfully with PotreeConverter');
    });
}

// Función para crear un archivo temporal y guardarlo en disco
function createTempFile(fileBuffer) {
    const tempFilePath = path.join(os.tmpdir(), `tempfile_${Date.now()}.las`);
    fs.writeFileSync(tempFilePath, fileBuffer);
    console.log(`Temporary file created: ${tempFilePath}`);
    return tempFilePath;
}

// Función para limpiar el archivo temporal
function cleanUpTempFile(tempFilePath) {
    try {
        fs.unlinkSync(tempFilePath); // Eliminar el archivo temporal
        console.log(`Temporary file deleted: ${tempFilePath}`);
    } catch (err) {
        console.error(`Error deleting temporary file: ${err.message}`);
    }
}

// Inicia el servidor en el puerto especificado
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Listening for file uploads at http://localhost:${PORT}/upload`);
});
