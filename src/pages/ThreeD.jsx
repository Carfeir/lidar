import React, { useState, useEffect, useRef } from 'react';
import { ViewHelper } from 'three/examples/jsm/Addons.js';

const ThreeD = () => {
  // Estados para diferentes partes del proceso de carga
  const [isLoadingScene, setIsLoadingScene] = useState(true);
  const [isLoadingPointCloud, setIsLoadingPointCloud] = useState(true);
  const containerRef = useRef(null);
  const viewerRef = useRef(null); // Ref para mantener una referencia al viewer

  useEffect(() => {
    if (containerRef.current) {
      // Inicialización de la escena
      setIsLoadingScene(true);
      const viewer = new Potree.Viewer(containerRef.current);
      viewerRef.current = viewer; // Guardamos una referencia al viewer

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
      viewer.setLanguage('en');

      // Esperar a que la GUI esté lista antes de interactuar con los menús
      viewer.loadGUI(() => {
        $("#menu_appearance").next().show();
        $("#menu_tools").next().show();
        $("#menu_clipping").next().show();

        // viewer.toggleSidebar();

        setIsLoadingScene(false); // La escena está cargada
      });

      // Carga de la nube de puntos
      Potree.loadPointCloud('/pointcloud/metadata.json', 'pointcloud').then(e => {
        const pointcloud = e.pointcloud;
        const material = pointcloud.material;

        material.activeAttributeName = "rgba";
        material.minSize = 2;
        material.pointSizeType = Potree.PointSizeType.ADAPTIVE;

        viewer.scene.addPointCloud(pointcloud);
        viewer.fitToScreen();

        setIsLoadingPointCloud(false); // La nube de puntos está cargada
      }).catch(error => {
        console.error('Error loading point cloud:', error);
        setIsLoadingPointCloud(false); // En caso de error, asumimos que el proceso de carga ha terminado
      });
    }
  }, []);

  // Determinar si la carga total ha finalizado
  const isLoading = isLoadingScene || isLoadingPointCloud;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div className="potree_container" ref={containerRef} style={{
        position: 'absolute',
        width: 'calc(100% - 200px)',
        height: '100%',
        left: '200px',  // Assuming sidebar width is 200px. Adjust as needed
        top: 0,
        display: 'flex',  // Establecer flex para que los hijos estén alineados
      }}>
        <div id="potree_render_area" style={{
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none' // ✅ Permite que el sidebar reciba clics
        }}></div>

        <div id="potree_sidebar_container" style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '500px',
          height: '100%',
          zIndex: 100,  // ✅ Asegurar que el sidebar esté por encima
        }}></div>

      </div>
    </div>
  );
};

export default ThreeD;