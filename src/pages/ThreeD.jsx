import React, { useEffect, useRef, useState } from 'react';

const ThreeD = () => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [files, setFile] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0]; // Solo cargamos un archivo
    if (selectedFile) {
      setFile(selectedFile);
      setMessage('Uploading file...');
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch('http://localhost:5173/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          setMessage('File uploaded successfully. Processing...');
          // Aquí agregas la lógica para recargar la nube de puntos o el proceso de conversión.
          window.location.reload(); // Recarga la página
        } else {
          const errorText = await response.text();
          setMessage(`Upload failed: ${errorText}`);
        }
      } catch (error) {
        setMessage(`Error during upload: ${error.message}`);
      } finally {
        setUploading(false);
      }
    }
  };

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    // Inicialización de la escena
    const viewer = new Potree.Viewer(containerRef.current);
    viewerRef.current = viewer;

    // Calidad visual
    viewer.setEDLEnabled(true);
    viewer.setFOV(60);
    viewer.useHQ = true;

    // Optimización de rendimiento
    viewer.setPointBudget(3_000_000);
    viewer.setMinNodeSize(30);
    viewer.useDEMCollisions = true;
    viewer.useEDL = true;

    // Controles de navegación
    viewer.getControls().enabled = true;
    viewer.setDescription("");

    // Limpiar el sidebar antes de cargar la GUI
    const sidebarContainer = document.getElementById("potree_sidebar_container");
    if (sidebarContainer) sidebarContainer.innerHTML = "";

    // Cargar la GUI y evitar duplicados
    viewer.loadGUI(() => {
      viewer.setLanguage('en');
      $("#menu_appearance").next().show();
      $("#menu_tools").next().show();
      $("#menu_clipping").next().show();

      const containerIds = ["tools", "clipping_tools", "navigation"];
      const defaultStyles = {
        display: "flex",
        flexWrap: "wrap",
        gap: "0px"
      };

      containerIds.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
          Object.assign(container.style, defaultStyles);
        }
      });
    });

    // Cargar la nube de puntos por defecto
    Potree.loadPointCloud('/pointcloud/metadata.json', 'pointcloud')
      .then(e => {
        const pointcloud = e.pointcloud;
        const material = pointcloud.material;

        material.activeAttributeName = "rgba";
        material.minSize = 2;
        material.pointSizeType = Potree.PointSizeType.ADAPTIVE;

        viewer.scene.addPointCloud(pointcloud);
        viewer.fitToScreen();
      })
      .catch(error => {
        console.error('Error loading point cloud:', error);
      });

  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Contenedor de Potree */}
      <div className="potree_container" ref={containerRef} style={{ position: "relative", width: '100%', height: '100%' }}>
        <div id="potree_render_area" style={{ zIndex: 1, pointerEvents: 'none' }}></div>
        <div id="potree_sidebar_container" style={{ zIndex: 100 }}></div>
      </div>

      {/* Botón para seleccionar y cargar archivos */}
      <div className="absolute top-4 right-4">
        <input
          id="file-upload"
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          Cargar Archivo
        </label>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg">
          {message}
        </div>
      )}
    </div>
  );
};

export default ThreeD;
