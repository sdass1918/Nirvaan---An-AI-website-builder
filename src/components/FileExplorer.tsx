import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Code, 
  Image, 
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { FileItem } from '../types/builder';

interface FileExplorerProps {
  files: FileItem[];
  selectedFile: string | null;
  onFileSelect: (fileId: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFile, onFileSelect }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['assets']));

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const getFileIcon = (fileName: string, type: string) => {
    if (type === 'folder') {
      return expandedFolders.has(fileName) ? FolderOpen : Folder;
    }
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return Code;
      case 'css':
        return Settings;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return Code;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return Image;
      default:
        return FileText;
    }
  };

  const renderFileTree = (files: FileItem[], depth = 0) => {
    return files.map((file) => {
      const Icon = getFileIcon(file.name, file.type);
      const isExpanded = expandedFolders.has(file.id);
      const isSelected = selectedFile === file.id;

      return (
        <div key={file.id}>
          <div
            className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-700 cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'
            }`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => {
              if (file.type === 'folder') {
                toggleFolder(file.id);
              } else {
                onFileSelect(file.id);
              }
            }}
          >
            {file.type === 'folder' && (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            )}
            <Icon className={`h-4 w-4 flex-shrink-0 ${
              file.type === 'folder' ? 'text-blue-400' : 
              file.name.endsWith('.html') ? 'text-orange-400' :
              file.name.endsWith('.css') ? 'text-blue-300' :
              file.name.endsWith('.js') ? 'text-yellow-400' :
              'text-gray-400'
            }`} />
            <span className="truncate">{file.name}</span>
          </div>
          {file.type === 'folder' && isExpanded && file.children && (
            <div>
              {renderFileTree(file.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-semibold">Project Files</h3>
        <p className="text-gray-400 text-sm mt-1">Click files to edit them</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {files.length > 0 ? (
          <div className="py-2">
            {renderFileTree(files)}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Files will appear here...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Ready to edit</span>
          </div>
          <p>Select a file to start editing</p>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;