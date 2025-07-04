import { Folder } from 'lucide-react';
import { Step, stepType } from '../types/builder';
import { FileItem } from '../types/builder';

export const generateInitialFiles = (steps: Step[]): FileItem[] => {
  const fileMap = new Map<string, FileItem>();
  const rootFiles: FileItem[] = [];

  // Helper function to create folder structure
  const createFolder = (folderPath: string): FileItem => {
    if (fileMap.has(folderPath)) {
      return fileMap.get(folderPath)!;
    }

    const folderName = folderPath.split('/').pop() || folderPath;
    const folder: FileItem = {
      id: `folder-${folderPath}`,
      name: folderName,
      type: 'folder',
      children: [],
      path: folderPath
    };

    fileMap.set(folderPath, folder);
    return folder;
  };

  // Helper function to ensure parent folders exist
  const ensureParentFolders = (filePath: string): FileItem | null => {
    const pathParts = filePath.split('/');
    if (pathParts.length <= 1) return null; // File is in root

    let currentPath = '';
    let parentFolder: FileItem | null = null;

    for (let i = 0; i < pathParts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];
      
      let folder = fileMap.get(currentPath);
      if (!folder) {
        folder = createFolder(currentPath);
        
        // Add to parent folder or root
        if (parentFolder) {
          parentFolder.children!.push(folder);
        } else {
          rootFiles.push(folder);
        }
      }
      
      parentFolder = folder;
    }

    return parentFolder;
  };

  // Process each step and create file items
  steps.forEach((step) => {
    // Skip non-file creation steps
    if (step.type !== stepType.createFile && 
        step.type !== stepType.createFolder &&
        step.type === stepType.runScript) {
      return;
    }

    // Extract filename from step name (remove "Create " prefix if present)
    let fullPath = step.name
      .replace(/^Create and run\s+/, '')
      .replace(/^Create\s+/, '');
    
    // If step has a script, we might want to extract the actual filename
    if (step.script && fullPath.includes('Create')) {
      // Try to extract filename from script command
      const scriptMatch = step.script.match(/(?:node|python|ts-node)\s+(.+)/);
      if (scriptMatch) {
        fullPath = scriptMatch[1];
      }
    }

    // Extract just the filename from the full path
    const fileName = fullPath.split('/').pop() || fullPath;
    const isFile = fileName.includes('.');
    // Determine file type
    let fileType: 'file' | 'folder' | 'script';
    if (step.type === stepType.createFolder) {
      fileType = 'folder';
    } else if (step.type === stepType.createFile) {
      fileType = 'file';
    } else {
      fileType = 'script'; // For runScript steps
    }

    // Create the file item
    const fileItem: FileItem = {
      //id: `file-${step.id}`,
      id: fullPath, // Use full path as ID for uniqueness
      name: fileName, // Use just the filename, not the full path
      type: fileType,
      code: step.code,
      path: fullPath // Keep the full path in the path property
    };

    // Add children array if it's a folder
    if (fileType === 'folder') {
      fileItem.children = [];
    }

    // Ensure parent folders exist and add file to appropriate location
    const parentFolder = ensureParentFolders(fullPath);

    if (parentFolder && fileType !== 'folder' && isFile) {
      // Add to parent folder
      parentFolder.children!.push(fileItem);
    } else if (parentFolder && fileType === 'folder') {
      // Add to parent folder
      parentFolder.children!.push(fileItem);
    } else {
      // Add to root
      if (fileType !== 'folder' && isFile) {
        rootFiles.push(fileItem);
      }
      else if (fileType === 'folder') {
        // If it's a folder, add it to rootFiles directly
        rootFiles.push(fileItem);
      }
    }

    // Store in map for quick lookup using full path
    fileMap.set(fullPath, fileItem);

    // If the file has been created then it means that the step is completed
    step.completed = true;
    step.active = false;
  });

  // Sort files and folders (folders first, then files, alphabetically)
  const sortFileItems = (items: FileItem[]): FileItem[] => {
    return items.sort((a, b) => {
      // Folders first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (b.type === 'folder' && a.type !== 'folder') return 1;
      
      // Then alphabetically
      return a.name.localeCompare(b.name);
    }).map(item => {
      // Recursively sort children
      if (item.children) {
        item.children = sortFileItems(item.children);
      }
      return item;
    });
  };

  return sortFileItems(rootFiles);
};