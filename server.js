import express from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';  // Importa fileURLToPath
import { dirname } from 'path';  // Importa dirname
import fs from 'fs';
import cors from 'cors';

// Inicia el servidor express
const app = express();
// Establece el puerto de la aplicación
const PORT = process.env.PORT || 3000;

// Obtén el directorio actual de la forma adecuada para módulos ES
// Para obtener el directorio actual utilizando fileURLToPath y dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWindows = os.platform() === "win32";
const potreePath = isWindows
    ? "PotreeConverter.exe"
    : path.join(__dirname, "bin/linux/PotreeConverter");

console.log(`Using PotreeConverter path: ${potreePath}`);

app.use(cors());

// Verificamos si no estamos en un sistema Windows
if (!isWindows) {
    // Comando para verificar si el archivo PotreeConverter tiene permisos de ejecución
    const checkPermissionCmd = `test -x ${potreePath}`;

    // Ejecutamos el comando para comprobar los permisos de ejecución del archivo
    exec(checkPermissionCmd, (error, stdout, stderr) => {
        // Si el comando falla (es decir, no tiene permisos de ejecución), ejecutamos el bloque de código dentro de 'if (error)'
        if (error) {
            // Mostramos en consola que el archivo no tiene permisos de ejecución
            console.log(`No execute permission, setting chmod for ${potreePath}`);

            // Comando para dar permisos de ejecución al archivo PotreeConverter
            const chmodCmd = `chmod +x ${potreePath}`;

            // Ejecutamos el comando chmod para agregar los permisos de ejecución
            exec(chmodCmd, (error, stdout, stderr) => {
                // Si ocurre un error al intentar cambiar los permisos, mostramos el mensaje de error
                if (error) {
                    console.error(`Error setting executable permission: ${error.message}`);
                    return; // Salimos de la función si hubo un error al cambiar los permisos
                }

                // Si hay algún error estándar en el comando chmod, lo mostramos
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    return;
                }

                // Si todo salió bien, mostramos la salida estándar del comando chmod
                console.log(`stdout: ${stdout}`);
            });
        } else {
            // Si el archivo ya tiene permisos de ejecución, mostramos un mensaje confirmando esto
            console.log(`${potreePath} already has execute permissions.`);
        }
    });
}


// Configura multer para manejar las subidas de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // Almacena temporalmente en un directorio 'uploads'
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));

// Ruta para verificar la existencia del archivo
app.get('/checkFileExists', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'pointcloud', 'metadata.json');
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('Error accessing file:', err);
            res.status(404).json({
                exists: false,
                error: {
                    message: 'File not found',
                    details: err.message
                }
            });
        } else {
            res.json({ exists: true });
        }
    });
});


app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No files were uploaded.');
    }

    const tempFilePath = req.file.path;
    const outputDir = path.join(__dirname, 'public', 'pointcloud');

    // Muestra en consola el archivo recibido y el directorio de salida
    console.log(`File uploaded: ${tempFilePath}`);
    console.log(`Output directory: ${outputDir}`);

    // Comando de PotreeConverter
    // const potreeCmd = `PotreeConverter.exe "${tempFilePath}" -o "${outputDir}" -l 5 --output-format POTREE --generate-page cloud --material ELEVATION`;
    const potreeCmd = `${potreePath} ${tempFilePath} -o ${outputDir} -l 5`;

    // Muestra el comando en consola
    console.log(`Running PotreeConverter with command: ${potreeCmd}`);

    // Ejecuta el comando
    exec(potreeCmd, (error, stdout, stderr) => {
        if (error) {
            // Si hay un error en la ejecución, lo mostramos en consola
            console.error(`exec error: ${error.message}`);
            console.error(`exec code: ${error.code}`);
            return res.status(500).send(`Error converting file: ${error.message}`);
        }

        // Si hay salida estándar, la mostramos en consola
        if (stdout) {
            console.log(`Conversion output: ${stdout}`);
        }

        // Si hay salida de error, la mostramos en consola
        if (stderr) {
            console.error(`Conversion error output: ${stderr}`);
        }

        res.send('File processed successfully with PotreeConverter');
    });
});

// Inicia el servidor en el puerto especificado
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Listening for file uploads at http://localhost:${PORT}/upload`);
});
