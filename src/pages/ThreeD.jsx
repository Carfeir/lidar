// FIXME: boton annotations - Indica que hay un problema o funcionalidad incompleta con el botón de anotaciones de Potree que necesita ser resuelto.

import React, { useEffect, useRef, useState } from 'react'; // Importa React y los hooks necesarios para manejar estado, efectos y referencias.
import { Upload, Download, Box } from "lucide-react"; // Importa iconos de lucide-react

// Componente principal para visualización 3D con Potree
const ThreeD = ({ setCurrentPage }) => {
  // Referencias para elementos del DOM y el visor de Potree
  const viewerRef = useRef(null); // Referencia al objeto Potree.Viewer para controlar el visor
  const renderAreaRef = useRef(null); // Referencia al contenedor DOM donde se renderiza la nube de puntos
  const sidebarRef = useRef(null); // Referencia al contenedor del sidebar de Potree

  // Estados para gestionar la interfaz y el proceso de carga
  const [uploading, setUploading] = useState(false); // Indica si se está subiendo un archivo
  const [message, setMessage] = useState(''); // Almacena mensajes temporales para mostrar al usuario
  const [isLoading, setIsLoading] = useState(false); // Controla la visibilidad de la pantalla de carga

  // Muestra un mensaje temporal al usuario y lo elimina después de un tiempo
  const showMessage = (msg, duration = 3000) => {
    setMessage(msg); // Establece el mensaje en el estado
    setTimeout(() => setMessage(''), duration); // Lo borra después de 'duration' milisegundos (por defecto 3 segundos)
  };

  // Limpia las nubes de puntos antiguas del árbol de la interfaz (jstree)
  const cleanupPointClouds = (callback) => {
    const viewer = viewerRef.current; // Obtiene el visor actual
    if (!viewer) { // Si no hay visor, ejecuta el callback y termina
      callback?.();
      return;
    }

    // Cuenta las nubes de puntos en el árbol de la interfaz
    const totalPointClouds = document.querySelector('#pointclouds .jstree-children')?.children.length || 0;
    console.log('Total point clouds found:', totalPointClouds); // Log para depuración

    if (totalPointClouds > 0) { // Si hay nubes de puntos
      const pointCloudList = document.querySelector('#pointclouds .jstree-children');
      if (pointCloudList && pointCloudList.children.length > 0) { // Verifica que la lista exista y tenga elementos
        const lastPointCloud = pointCloudList.lastElementChild; // Obtiene el último elemento
        console.log('Removing last point cloud item from #pointclouds'); // Log para depuración
        lastPointCloud.remove(); // Elimina el último elemento del DOM
      }
      showMessage('Old point clouds removed.'); // Notifica al usuario
    } else {
      showMessage('No point clouds to remove.'); // Notifica si no hay nada que limpiar
    }
    callback?.(); // Ejecuta el callback opcional
  };

  // Carga una nube de puntos en el visor y maneja la limpieza de medidas
  const loadPointCloudOnViewer = async (url, isInitialLoad = false) => {
    const viewer = viewerRef.current; // Obtiene el visor
    if (!viewer) { // Si no hay visor, muestra un mensaje y termina
      showMessage("Viewer not initialized", 5000);
      return;
    }

    try {
      if (!isInitialLoad) { // Si no es la carga inicial, limpia la escena
        setIsLoading(true); // Muestra la pantalla de carga
        viewer.scene.pointclouds.forEach((layer) => viewer.scene.scenePointCloud.remove(layer)); // Elimina capas existentes
        viewer.scene.pointclouds = []; // Reinicia el array de nubes de puntos
        viewer.scene.scene.children = []; // Limpia todos los objetos de la escena
      }

      // Carga la nube de puntos desde la URL proporcionada
      const e = await Potree.loadPointCloud(url, isInitialLoad ? 'pointcloud' : 'new_pointcloud');
      const pointcloud = e.pointcloud; // Obtiene la nube de puntos cargada
      const material = pointcloud.material; // Accede al material de la nube
      material.activeAttributeName = "rgba"; // Usa colores RGBA para la visualización
      material.minSize = 2; // Tamaño mínimo de los puntos
      material.pointSizeType = Potree.PointSizeType.ADAPTIVE; // Tamaño adaptativo de los puntos

      viewer.scene.addPointCloud(pointcloud); // Añade la nube a la escena
      viewer.fitToScreen(); // Ajusta la cámara para que la nube sea completamente visible

      if (!isInitialLoad) { // Si no es la carga inicial, realiza tareas adicionales
        const pointCloudList = document.querySelector('#pointclouds .jstree-children');
        if (pointCloudList) { // Limpia la lista de nubes en el árbol, dejando solo la última
          while (pointCloudList.children.length > 1) {
            pointCloudList.children[0].remove();
          }
        }

        // Simula un clic en el botón nativo de Potree para eliminar todas las medidas
        const removeAllButton = document.querySelector('#tools img.button-icon[src*="reset_tools.svg"]');
        if (removeAllButton) {
          console.log('Triggering native remove all measurements button'); // Log para depuración
          removeAllButton.click(); // Ejecuta el clic
        } else {
          console.log('Remove all measurements button not found'); // Log si no se encuentra el botón
        }

        showMessage('Point cloud loaded successfully!'); // Notifica al usuario
        setIsLoading(false); // Oculta la pantalla de carga
      }
    } catch (error) { // Maneja errores durante la carga
      console.error('Error loading point cloud:', error); // Log del error
      if (!isInitialLoad) {
        showMessage(`Error loading point cloud: ${error.message}`, 5000); // Muestra el error al usuario
        setIsLoading(false); // Oculta la pantalla de carga
      }
    }
  };

  // Maneja la subida de un nuevo archivo al servidor
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0]; // Obtiene el archivo seleccionado
    if (!selectedFile) return; // Termina si no hay archivo

    setMessage('Uploading file...'); // Notifica que la subida ha comenzado
    setUploading(true); // Activa el estado de subida

    try {
      const formData = new FormData(); // Crea un objeto FormData para enviar el archivo
      formData.append('file', selectedFile); // Añade el archivo al formulario

      // Envía el archivo al servidor mediante una solicitud POST
      const response = await fetch('http://localhost:5173/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) { // Si la subida es exitosa
        showMessage('File uploaded successfully. Cleaning up...'); // Notifica al usuario
        if (viewerRef.current) { // Si hay un visor
          await new Promise((resolve) => cleanupPointClouds(resolve)); // Limpia las nubes antiguas
          loadPointCloudOnViewer('/pointcloud/metadata.json'); // Carga la nueva nube
        }
      } else { // Si la subida falla
        const errorText = await response.text(); // Obtiene el mensaje de error del servidor
        showMessage(`Upload failed: ${errorText}`); // Muestra el error al usuario
      }
    } catch (error) { // Maneja errores de red u otros
      showMessage(`Error during upload: ${error.message}`); // Muestra el error al usuario
    } finally {
      setUploading(false); // Desactiva el estado de subida, ocurra lo que ocurra
    }
  };

  // Inicializa el visor de Potree con configuraciones básicas
  const initializeViewer = (renderArea) => {
    const viewer = new Potree.Viewer(renderArea); // Crea una nueva instancia del visor
    viewer.setEDLEnabled(true); // Activa el Eye-Dome Lighting para mejor contraste
    viewer.setFOV(60); // Establece el campo de visión en 60 grados
    viewer.useHQ = true; // Usa alta calidad en el renderizado
    viewer.setPointBudget(3_000_000); // Limita el número de puntos renderizados para optimizar rendimiento
    viewer.setMinNodeSize(30); // Tamaño mínimo de los nodos del octree
    viewer.useDEMCollisions = true; // Activa colisiones con el modelo de elevación digital
    viewer.useEDL = true; // Activa EDL (redundante con setEDLEnabled, revisar)
    viewer.getControls().enabled = true; // Habilita los controles de navegación
    viewer.setDescription(""); // Establece una descripción vacía
    return viewer; // Devuelve el visor configurado
  };

  // Configura la interfaz gráfica de usuario (GUI) de Potree
  const setupGUI = (viewer) => {
    if (sidebarRef.current) sidebarRef.current.innerHTML = ""; // Limpia el contenedor del sidebar
    viewer.loadGUI(() => { // Carga la GUI de Potree
      viewer.setLanguage('en'); // Establece el idioma en inglés
      // Muestra los menús de apariencia, herramientas y recorte en el sidebar
      const menuAppearance = sidebarRef.current.querySelector("#menu_appearance");
      const menuTools = sidebarRef.current.querySelector("#menu_tools");
      const menuClipping = sidebarRef.current.querySelector("#menu_clipping");
      if (menuAppearance) menuAppearance.nextElementSibling.style.display = "block";
      if (menuTools) menuTools.nextElementSibling.style.display = "block";
      if (menuClipping) menuClipping.nextElementSibling.style.display = "block";
    });
  };

  // Configura un observador para redimensionar el visor automáticamente
  const setupResizeObserver = (viewer, setIsLoading) => {
    const resizeObserver = new ResizeObserver(() => { // Crea un observador de tamaño
      setIsLoading(true); // Muestra la pantalla de carga durante el redimensionamiento
      clearTimeout(window.resizeTimeout); // Limpia cualquier timeout anterior
      window.resizeTimeout = setTimeout(() => { // Debounce manual para evitar renders excesivos
        setIsLoading(false); // Oculta la pantalla de carga
        viewer.fitToScreen(); // Ajusta la cámara al nuevo tamaño
      }, 100); // Espera 100ms antes de ajustar
    });
    resizeObserver.observe(renderAreaRef.current); // Observa el contenedor de renderizado
  };

  // Efecto para configurar el visor y cargar la nube inicial
  useEffect(() => {
    if (!renderAreaRef.current || viewerRef.current) return; // Evita ejecutar si el área no está lista o el visor ya existe

    const viewer = initializeViewer(renderAreaRef.current); // Inicializa el visor
    viewerRef.current = viewer; // Almacena el visor en la referencia
    window.viewer = viewer; // Hace el visor accesible globalmente (necesario para algunas herramientas de Potree)

    setupGUI(viewer); // Configura la GUI

    loadPointCloudOnViewer('/pointcloud/metadata.json', true); // Carga la nube inicial

    viewer.renderer.render(viewer.scene.scene, viewer.scene.getActiveCamera()); // Forzar renderizado inicial

    setupResizeObserver(viewer, setIsLoading); // Configura el observador de redimensionamiento
  }, []); // Dependencias vacías: solo se ejecuta al montar el componente

  // Renderizado del componente
  return (
    <>
      <div className="absolute top-1 flex flex-col" style={{ zIndex: 150 }}> {/* Botones en la esquina inferior derecha */}
        <div
          className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg mt-4"
        >
          <Box size={20} /> 3D View
        </div>
      </div>
      <div className="relative w-full h-full"> {/* Contenedor principal con posicionamiento relativo */}
        {/* Contenedor de Potree */}
        <div
          className="potree_container"
          style={{ position: "absolute", width: '100%', height: '100%', left: '0px', top: '0px' }} // Ocupa todo el espacio disponible
        >
          <div id="potree_render_area" ref={renderAreaRef}></div> {/* Área donde se renderiza la nube de puntos */}
          <div id="potree_sidebar_container" ref={sidebarRef}></div> {/* Contenedor del sidebar de Potree */}



          {/* Botones de interacción */}
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2" style={{ zIndex: 150 }}> {/* Botones en la esquina inferior derecha */}
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange} // Maneja la selección de archivos
              style={{ display: 'none' }} // Oculta el input nativo
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <Upload size={20} /> Cargar Archivo
            </label>

            <button
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg mt-4"
              onClick={() => setCurrentPage('2d')} // Cambia a TwoD
            >
              <Download size={20} /> Exportar Volumen
            </button>
          </div>

          {/* Mensaje de estado */}
          {message && ( // Muestra el mensaje si existe
            <div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg"
              style={{ zIndex: 150 }} // Centrado en la parte inferior
            >
              {message}
            </div>
          )}

          {/* Pantalla de carga */}
          {isLoading && ( // Muestra la pantalla de carga si está activa
            <div
              className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75"
              style={{ zIndex: 200 }} // Cubre toda la pantalla
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-t-4 border-t-blue-500 border-gray-300 rounded-full animate-spin" /> {/* Spinner */}
                <p className="mt-4 text-white">Cargando...</p> {/* Texto de carga */}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ThreeD; // Exporta el componente para su uso en otras partes de la aplicación