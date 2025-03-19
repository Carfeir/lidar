import { X, Layers } from "lucide-react"; // Importa iconos de lucide-react

const TwoD = ({ setCurrentPage }) => {
  return (
    <>
      <div className="text-center">
        <p className="text-gray-100 mt-2">2D visualization will be displayed here</p>
      </div>
      {/* Botones de interacción */}
      <div className="absolute top-1 right-4 flex flex-col" style={{ zIndex: 150 }}> {/* Botones en la esquina inferior derecha */}

        <button
          className="flex items-center gap-2 bg-gray-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg mt-4"
          onClick={() => setCurrentPage('3d')} // Cambia a ThreeD
        >
          <X size={20} />
        </button>
      </div>

      <div className="absolute top-1 flex flex-col" style={{ zIndex: 150 }}> {/* Botones en la esquina inferior derecha */}

        <div
          className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg mt-4"
        >
          <Layers size={20} /> 2D View
        </div>
      </div>
    </>
  );
}

export default TwoD;