import React, { useEffect, useRef } from 'react';

const ThreeD = () => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return; // Evita múltiples inicializaciones

    // Limpiar el sidebar antes de cargar la GUI
    const sidebarContainer = document.getElementById("potree_sidebar_container");
    if (sidebarContainer) sidebarContainer.innerHTML = "";

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

    // Cargar la GUI y asegurarse de que no se duplique
    viewer.loadGUI(() => {
      const existingMenu = document.querySelector("#potree_sidebar_container .potree_menu");
      if (!existingMenu) { // Solo modifica si no existe el menú
        viewer.setLanguage('en');
        $("#menu_appearance").next().show();
        $("#menu_tools").next().show();
        $("#menu_clipping").next().show();
      }
    });

    // Carga de la nube de puntos
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
    <div className="potree_container" ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <div id="potree_render_area" style={{ zIndex: 1, pointerEvents: 'none' }}></div>
      <div id="potree_sidebar_container" style={{ zIndex: 100 }}></div>
    </div>
  );
};

export default ThreeD;
