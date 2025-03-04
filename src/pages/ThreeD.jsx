// FIXME: boton annotations

import React, { useEffect, useRef, useState } from 'react';

// Componente principal para visualización 3D con Potree
const ThreeD = () => {
  // Referencias para el visor de Potree y el área de renderizado
  const viewerRef = useRef(null);
  const renderAreaRef = useRef(null);

  // Estados para manejar la carga de archivos y mensajes
  const [uploading, setUploading] = useState(false); // Indica si un archivo se está subiendo
  const [message, setMessage] = useState(''); // Mensaje de estado para el usuario
  const [isLoading, setIsLoading] = useState(false); // Controla la pantalla de carga

  // Función para mostrar un mensaje temporal
  const showMessage = (msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const cleanupPointClouds = (callback) => {
    const viewer = viewerRef.current;
    if (!viewer) {
      callback?.();
      return;
    }

    const totalPointClouds = document.querySelector('#pointclouds .jstree-children')?.children.length || 0;
    console.log('Total point clouds found:', totalPointClouds);

    if (totalPointClouds > 0) {
      const pointCloudList = document.querySelector('#pointclouds .jstree-children');
      if (pointCloudList && pointCloudList.children.length > 0) {
        const lastPointCloud = pointCloudList.lastElementChild;
        console.log('Removing last point cloud item from #pointclouds');
        lastPointCloud.remove();
      }
      showMessage('Old point clouds removed.');
    } else {
      showMessage('No point clouds to remove.');
    }
    callback?.();
  };

  // Carga una nube de puntos y usa el botón nativo para eliminar medidas después de la carga
  const loadPointCloudOnViewer = (url, isInitialLoad = false) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (!isInitialLoad) {
      setIsLoading(true);
      viewer.scene.pointclouds.forEach((layer) => {
        viewer.scene.scenePointCloud.remove(layer);
      });
      viewer.scene.pointclouds = [];
      viewer.scene.scene.children = []; // Limpia la escena completamente
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
          // Eliminar visualmente todos los <li> de #pointclouds excepto el último después de cargar
          const pointCloudList = document.querySelector('#pointclouds .jstree-children');
          if (pointCloudList) {
            const children = pointCloudList.children;
            console.log('Point clouds in list before cleanup:', children.length);
            while (children.length > 1) {
              console.log('Removing old point cloud item from #pointclouds');
              children[0].remove();
            }
          }

          // Simular clic en el botón nativo "Remove all measurements"
          const removeAllButton = document.querySelector('#tools img.button-icon[src*="reset_tools.svg"]');
          if (removeAllButton) {
            console.log('Triggering native remove all measurements button');
            removeAllButton.click();
          } else {
            console.log('Remove all measurements button not found');
          }

          showMessage('Point cloud loaded successfully!');
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error loading point cloud:', error);
        if (!isInitialLoad) {
          showMessage('Error loading point cloud');
          setIsLoading(false);
        }
      });
  };

  // Maneja la carga de un nuevo archivo
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

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
        showMessage('File uploaded successfully. Cleaning up...');
        if (viewerRef.current) {
          await new Promise((resolve) => cleanupPointClouds(resolve));
          loadPointCloudOnViewer('/pointcloud/metadata.json');
        }
      } else {
        const errorText = await response.text();
        showMessage(`Upload failed: ${errorText}`);
      }
    } catch (error) {
      showMessage(`Error during upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Configuración inicial del visor y carga de la nube inicial
  useEffect(() => {
    if (!renderAreaRef.current || viewerRef.current) return;

    const viewer = new Potree.Viewer(renderAreaRef.current);
    viewerRef.current = viewer;
    // Hacer que 'viewer' sea accesible globalmente para las herramientas de Potree
    window.viewer = viewer;

    // Configuración de calidad visual
    viewer.setEDLEnabled(true);
    viewer.setFOV(60);
    viewer.useHQ = true;

    // Optimización de rendimiento
    viewer.setPointBudget(3_000_000);
    viewer.setMinNodeSize(30);
    viewer.useDEMCollisions = true;
    viewer.useEDL = true;

    // Configuración de controles
    viewer.getControls().enabled = true;
    viewer.setDescription("");

    // Limpia el sidebar antes de cargar la GUI
    const sidebarContainer = document.getElementById("potree_sidebar_container");
    if (sidebarContainer) sidebarContainer.innerHTML = "";

    // Carga la GUI de Potree
    viewer.loadGUI(() => {
      viewer.setLanguage('en');
      $("#menu_appearance").next().show();
      $("#menu_tools").next().show();
      $("#menu_clipping").next().show();
    });

    loadPointCloudOnViewer('/pointcloud/metadata.json', true);

    // Forzar una actualización de la escena después de la carga inicial
    viewer.renderer.render(viewer.scene.scene, viewer.scene.getActiveCamera());

    // Observador para redimensionar el visor
    const resizeObserver = new ResizeObserver(() => {
      setIsLoading(true);
      clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(() => {
        setIsLoading(false);
        viewer.fitToScreen();
      }, 100);
    });
    resizeObserver.observe(renderAreaRef.current);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Contenedor de Potree */}
      <div className="potree_container"
        style={{ position: "absolute", width: '100%', height: '100%', left: '0px', top: '0px' }} >
        <div id="potree_render_area" ref={renderAreaRef}></div>
        <div id="potree_sidebar_container"></div>

        {/* Botones de interacción */}
        <div className="absolute bottom-4 right-4 flex space-x-2" style={{ zIndex: 150 }}>
          <input
            id="file-upload"
            type="file"
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