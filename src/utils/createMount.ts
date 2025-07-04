import { FileItem } from "../types/builder";

export const createMount = (files: FileItem[]) => {
    const mountStructure: Record<string, any> = {};
    files.forEach((file) => {
        if(file.type === 'folder') {
            mountStructure[file.name] = {
                directory: file.children ? createMount(file.children) : {}
            };
        } else if(file.type === 'script') {
            return; // Skip scripts in mount structure
        } else {
            mountStructure[file.name] = {
                file: {
                    contents: file.code || ''
                }
            };
        }
    });
    return mountStructure;
};