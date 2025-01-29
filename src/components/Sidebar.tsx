import { Upload, Box, Layers } from 'lucide-react';

interface SidebarProps {
  currentPage: 'upload' | '3d' | '2d';
  setCurrentPage: (page: 'upload' | '3d' | '2d') => void;
}

export function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const items = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: '3d', label: '3D View', icon: Box },
    { id: '2d', label: '2D View', icon: Layers },
  ] as const;

  return (
    <aside className="w-60 bg-gray-900 border-gray-800 shadow-lg">
      <nav className="p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center space-x-3 px-2 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-gray-200 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}