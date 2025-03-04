import React, { useEffect, useRef, useState } from 'react';

const ThreeD = () => {
  const viewerRef = useRef(null);
  const renderAreaRef = useRef(null);
  const [files, setFile] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para la pantalla de carga

  const loadPointCloud = (url, isInitialLoad = false) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (!isInitialLoad) {
      setIsLoading(true);
      // Limpiar las nubes de puntos existentes solo si no es la carga inicial
      viewer.scene.pointclouds.forEach((layer) => {
        viewer.scene.scenePointCloud.remove(layer);
      });
      viewer.scene.pointclouds = [];
    }

    Potree.loadPointCloud(url, isInitialLoad ? 'pointcloud' : 'new_pointcloud')
      .then((e) => {
        const pointcloud = e.pointcloud;
        const material = pointcloud.material;
        material.activeAttributeName = "rgba";
        material.minSize = 2;
        material.pointSizeType = Potree.PointSizeType.ADAPTIVE;

        viewer.scene.addPointCloud(pointcloud);
        viewer.fitToScreen();

        if (!isInitialLoad) {
          setMessage('Point cloud loaded successfully!');
          setTimeout(() => setMessage(''), 3000);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error loading point cloud:', error);
        if (!isInitialLoad) {
          setMessage('Error loading point cloud');
          setTimeout(() => setMessage(''), 3000);
          setIsLoading(false);
        }
      });
  };

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
          setMessage('File uploaded successfully. Loading point cloud...');
          if (viewerRef.current) {
            loadPointCloud('/pointcloud/metadata.json');
          }
        } else {
          const errorText = await response.text();
          setMessage(`Upload failed: ${errorText}`);
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (error) {
        setMessage(`Error during upload: ${error.message}`);
        setTimeout(() => setMessage(''), 3000);
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
    });

    // Carga inicial de la nube de puntos
    loadPointCloud('/pointcloud/metadata.json', true);

    // Observador de redimensionamiento
    const resizeObserver = new ResizeObserver((entries) => {
      setIsLoading(true); // Mostrar pantalla de carga
      clearTimeout(window.resizeTimeout); // Limpiar timeout previo
      window.resizeTimeout = setTimeout(() => {
        setIsLoading(false); // Ocultar pantalla de carga después de 300ms
        viewer.fitToScreen(); // Ajustar la vista al nuevo tamaño
      }, 50); // Duración de la transición
    });

    resizeObserver.observe(renderAreaRef.current);
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

        {/* Pantalla de carga */}
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75"
            style={{ zIndex: 200 }}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-4 border-t-blue-500 border-gray-300 rounded-full animate-spin" />
              <p className="mt-4 text-white">Cargando...</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ThreeD;