export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'script';
  code?: string;
  children?: FileItem[];
  path: string;
}

export enum stepType {
  createFile,
  createFolder,
  editFile,
  deleteFile,
  runScript
}

export interface Step {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  active: boolean;
  code?: string;
  script?: string;
  type: stepType;
}

export interface BuilderState {
  prompt: string;
  currentStep: number;
  files: FileItem[];
  selectedFile: string | null;
  isGenerating: boolean;
}