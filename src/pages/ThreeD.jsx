import React, { useEffect, useRef, useState } from 'react';

const ThreeD = () => {
  const viewerRef = useRef(null);
  const renderAreaRef = useRef(null);
  const [files, setFile] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
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
          window.location.reload();
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
    if (!renderAreaRef.current || viewerRef.current) return;

    const viewer = new Potree.Viewer(renderAreaRef.current); // Usar renderAreaRef en lugar de containerRef
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
      viewer.toggleSidebar();
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
      .catch(error => console.error('Error loading point cloud:', error));
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Contenedor de Potree */}
      <div className="potree_container"
        style={{ position: "absolute", width: '100%', height: '100%', left: '0px', top: '0px' }} >
        <div id="potree_render_area" ref={renderAreaRef} style={{ backgroundImage: "url('/potree/build/potree/resources/images/background.jpg')" }}></div>
        <div id="potree_sidebar_container"></div>

        {/* Botón para seleccionar y cargar archivos */}
        <div className="absolute top-4 right-4" style={{ zIndex: 150 }}>
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
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg" style={{ zIndex: 150 }}>
            {message}
          </div>
        )}
      </div>

    </div>
  );
};

export default ThreeD;