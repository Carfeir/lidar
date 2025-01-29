import React, { useState } from 'react';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    console.log('Files selected:', selectedFiles);  // Mensaje de consola para ver los archivos seleccionados
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("Please select a file first!");
      console.log('No file selected');  // Mensaje de consola cuando no se selecciona un archivo
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('file', file);
      console.log('Appending file to formData:', file.name);  // Mensaje de consola al agregar archivos al FormData
    });

    setUploading(true);
    setMessage('');
    console.log('Starting upload process...');  // Mensaje de consola cuando comienza la subida

    try {
      const response = await fetch('http://localhost:5173/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage('File uploaded successfully. Processing with PotreeConverter...');
        console.log('File uploaded successfully');  // Mensaje de consola si la carga fue exitosa
      } else {
        const errorText = await response.text();
        setMessage(`Upload failed: ${errorText}`);
        console.log('Upload failed:', errorText);  // Mensaje de consola si hubo un error en la carga
      }
    } catch (error) {
      setMessage(`Error during upload: ${error.message}`);
      console.log('Error during upload:', error.message);  // Mensaje de consola si hubo un error en el proceso de subida
    } finally {
      setUploading(false);
      console.log('Upload process finished');  // Mensaje de consola al finalizar el proceso de subida
    }
  };

  return (
    <>
      <div className="text-center">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
          <label htmlFor="file-upload" className="cursor-pointer">
            <div>
              <p className="text-gray-500">Click Here or Drag and drop your files here</p>
            </div>
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <button
          onClick={handleUpload}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          disabled={uploading || files.length === 0}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        {message && <p className="mt-4">{message}</p>}
      </div>
    </>
  );
};

export default Upload;
