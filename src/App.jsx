import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import Upload from './pages/Upload';
import ThreeD from './pages/ThreeD';
import TwoD from './pages/TwoD';

function App() {
  const [currentPage, setCurrentPage] = useState('upload');

  return (
    <div className="bg-gray-900 text-white h-screen flex overflow-hidden text-sm">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main className="flex-1 flex justify-center items-center">
        <div className="bg-gray-800 shadow-lg overflow-auto w-full h-full flex items-center justify-center">
          {currentPage === 'upload' && <Upload />}
          {currentPage === '3d' && <ThreeD />}
          {currentPage === '2d' && <TwoD />}
        </div>
      </main>
    </div>
  );
}

export default App;