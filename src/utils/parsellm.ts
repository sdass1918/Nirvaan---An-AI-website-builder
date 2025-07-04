import { Step, stepType } from '../types/builder';

export const parseBoltArtifactRobust = (boltArtifactContent: string, existingSteps: Step[] = []): Step[] => {
  const steps: Step[] = [...existingSteps]; // Start with existing steps
  const processedFiles = new Map<string, number>(); // Track processed files with their step IDs
  
  // First, populate processedFiles with existing steps that have file paths
  existingSteps.forEach(step => {
    if (step.type === stepType.createFile || step.type === stepType.editFile) {
      // Try to extract file path from step name or description
      const filePath = extractFilePathFromStep(step);
      if (filePath) {
        processedFiles.set(filePath, step.id);
      }
    }
  });
  
  let stepId = Math.max(...existingSteps.map(s => s.id), 0) + 1; // Start from max existing ID + 1

  // Split the content into chunks and process them sequentially
  const chunks = splitIntoChunks(boltArtifactContent);
  
  chunks.forEach(chunk => {
    if (chunk.type === 'boltAction') {
      const step = processBoltAction(chunk as any, stepId, processedFiles, steps);
      if (step) {
        steps.push(step);
        stepId++;
      }
    } else if (chunk.type === 'text') {
      // Process text content that might contain instructions or scripts
      const textSteps = processTextContent(chunk.content, stepId, processedFiles);
      textSteps.forEach(step => {
        steps.push(step);
        stepId++;
      });
    }
  });

  return steps;
};

// Helper function to extract file path from existing step
function extractFilePathFromStep(step: Step): string | null {
  // Try to extract from step name first
  if (step.name) {
    // Look for patterns like "Create filename.ext" or "Edit filename.ext"
    const nameMatch = step.name.match(/(?:Create|Edit|Delete)\s+(.+)$/);
    if (nameMatch) {
      return nameMatch[1];
    }
  }
  
  // Try to extract from description
  if (step.description) {
    const descMatch = step.description.match(/(?:Create|Edit|Delete)\s+(?:the\s+)?(?:file\s+)?(.+)$/);
    if (descMatch) {
      return descMatch[1];
    }
  }
  
  return null;
}

// Helper function to split content into chunks
function splitIntoChunks(content: string): Array<{type: 'boltAction' | 'text', content: string, attributes?: string}> {
  const chunks: Array<{type: 'boltAction' | 'text', content: string, attributes?: string}> = [];
  
  // Regex to find boltAction tags and capture everything
  const boltActionRegex = /<boltAction\s+([^>]+)>([\s\S]*?)<\/boltAction>/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = boltActionRegex.exec(content)) !== null) {
    const [fullMatch, attributes, actionContent] = match;
    const startIndex = match.index;
    
    // Add text content before this boltAction (if any)
    if (startIndex > lastIndex) {
      const textContent = content.substring(lastIndex, startIndex).trim();
      if (textContent) {
        chunks.push({
          type: 'text',
          content: textContent
        });
      }
    }
    
    // Add the boltAction
    chunks.push({
      type: 'boltAction',
      content: actionContent,
      attributes: attributes
    });
    
    lastIndex = startIndex + fullMatch.length;
  }
  
  // Add any remaining text after the last boltAction
  if (lastIndex < content.length) {
    const textContent = content.substring(lastIndex).trim();
    if (textContent) {
      chunks.push({
        type: 'text',
        content: textContent
      });
    }
  }
  
  return chunks;
}

// Helper function to clean code content
function cleanCodeContent(content: string): string {
  // Remove markdown code block markers
  let cleanContent = content.trim();
  
  // Remove opening code block markers (```language)
  cleanContent = cleanContent.replace(/^```[\w]*\n?/gm, '');
  
  // Remove closing code block markers
  cleanContent = cleanContent.replace(/\n?```$/gm, '');
  
  // Remove any remaining ``` that might be in the middle
  cleanContent = cleanContent.replace(/```/g, '');
  
  return cleanContent.trim();
}

// Process boltAction chunks
function processBoltAction(
  chunk: {type: 'boltAction', content: string, attributes?: string}, 
  stepId: number,
  processedFiles: Map<string, number>,
  existingSteps: Step[]
): Step | null {
  if (!chunk.attributes) return null;
  
  // Parse attributes
  const typeMatch = chunk.attributes.match(/type="([^"]+)"/);
  const filePathMatch = chunk.attributes.match(/filePath="([^"]+)"/);
  const nameMatch = chunk.attributes.match(/name="([^"]+)"/);
  
  if (!typeMatch) return null;
  
  const actionType = typeMatch[1];
  const filePath = filePathMatch ? filePathMatch[1] : '';
  const actionName = nameMatch ? nameMatch[1] : null;
  
  // Clean up the content and remove markdown markers
  const cleanContent = cleanCodeContent(chunk.content);
  
  // Check if this is a file operation and if we've already processed this file
  if (actionType === 'file' && filePath && processedFiles.has(filePath)) {
    const existingStepId = processedFiles.get(filePath);
    const existingStepIndex = existingSteps.findIndex(step => step.id === existingStepId);
    
    if (existingStepIndex !== -1) {
      // Update existing step with new content
      console.log(`Updating existing file: ${filePath}`);
      existingSteps[existingStepIndex] = {
        ...existingSteps[existingStepIndex],
        code: cleanContent || existingSteps[existingStepIndex].code,
        // Keep the existing name and description unless we have new ones
        name: actionName || existingSteps[existingStepIndex].name,
        description: existingSteps[existingStepIndex].description
      };
      return null; // Don't create a new step
    }
  }
  
  // Determine step type and generate appropriate name/description
  let type: stepType;
  let name: string;
  let description: string;
  
  switch (actionType) {
    case 'file':
      type = stepType.createFile;
      name = actionName || `Create ${filePath}`;
      description = getFileDescription(filePath);
      // Mark this file as processed
      if (filePath) {
        processedFiles.set(filePath, stepId);
      }
      break;
    case 'folder':
      type = stepType.createFolder;
      name = actionName || `Create ${filePath}`;
      description = `Create the folder ${filePath}`;
      break;
    case 'edit':
      type = stepType.editFile;
      name = actionName || `Edit ${filePath}`;
      description = `Edit the file ${filePath}`;
      break;
    case 'delete':
      type = stepType.deleteFile;
      name = actionName || `Delete ${filePath}`;
      description = `Delete the file ${filePath}`;
      break;
    case 'script':
    case 'shell':
    case 'terminal':
      type = stepType.runScript;
      name = actionName || `Run ${filePath || 'script'}`;
      description = `Execute the script: ${filePath || 'terminal command'}`;
      break;
    default:
      type = stepType.createFile;
      name = actionName || `Create ${filePath}`;
      description = `Create the file ${filePath}`;
      if (filePath) {
        processedFiles.set(filePath, stepId);
      }
  }

  return {
    id: stepId,
    name,
    description,
    completed: false,
    active: true,
    type,
    code: type !== stepType.runScript ? cleanContent || undefined : undefined,
    script: type === stepType.runScript ? cleanContent : undefined
  };
}

// Process text content that might contain instructions or shell commands
function processTextContent(
  textContent: string, 
  startStepId: number,
  processedFiles: Map<string, number>
): Step[] {
  const steps: Step[] = [];
  let stepId = startStepId;
  
  // Look for shell commands (lines starting with $, npm, yarn, etc.)
  const shellCommandRegex = /^(\$\s*|npm\s+|yarn\s+|npx\s+|cd\s+|mkdir\s+|touch\s+|git\s+|docker\s+|python\s+|node\s+|cargo\s+|go\s+|rustc\s+)(.+)$/gm;
  
  // Look for code blocks (```...```)
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
  
  // Look for inline shell commands in backticks with shell indicators
  const inlineShellRegex = /`(\$\s*|npm\s+|yarn\s+|npx\s+|cd\s+|mkdir\s+|touch\s+|git\s+)([^`]+)`/g;
  
  let processedContent = textContent;
  
  // Process code blocks first
  let codeMatch;
  while ((codeMatch = codeBlockRegex.exec(textContent)) !== null) {
    const [fullMatch, language, code] = codeMatch;
    const cleanCode = cleanCodeContent(code);
    
    if (isShellCode(cleanCode, language)) {
      steps.push({
        id: stepId++,
        name: `Run shell commands`,
        description: `Execute shell commands`,
        completed: false,
        active: true,
        type: stepType.runScript,
        script: cleanCode
      });
    } else if (language && cleanCode) {
      // This might be a file creation with specified language
      steps.push({
        id: stepId++,
        name: `Create ${language} file`,
        description: `Create a ${language} file`,
        completed: false,
        active: true,
        type: stepType.createFile,
        code: cleanCode
      });
    }
    
    // Remove this code block from further processing
    processedContent = processedContent.replace(fullMatch, '');
  }
  
  // Process shell commands
  let shellMatch;
  while ((shellMatch = shellCommandRegex.exec(processedContent)) !== null) {
    const [fullMatch, prefix, command] = shellMatch;
    const fullCommand = prefix + command;
    
    steps.push({
      id: stepId++,
      name: `Run: ${command.length > 30 ? command.substring(0, 30) + '...' : command}`,
      description: `Execute shell command: ${fullCommand}`,
      completed: false,
      active: true,
      type: stepType.runScript,
      script: fullCommand
    });
  }
  
  // Process inline shell commands
  let inlineMatch;
  while ((inlineMatch = inlineShellRegex.exec(processedContent)) !== null) {
    const [fullMatch, prefix, command] = inlineMatch;
    const fullCommand = prefix + command;
    
    steps.push({
      id: stepId++,
      name: `Run: ${command.length > 30 ? command.substring(0, 30) + '...' : command}`,
      description: `Execute shell command: ${fullCommand}`,
      completed: false,
      active: true,
      type: stepType.runScript,
      script: fullCommand
    });
  }
  
  return steps;
}

// Helper function to determine if code is shell/terminal code
function isShellCode(code: string, language?: string): boolean {
  if (language) {
    return ['bash', 'sh', 'shell', 'terminal', 'zsh', 'fish', 'powershell', 'cmd'].includes(language.toLowerCase());
  }
  
  // Check if code contains shell-like commands
  const shellIndicators = [
    /^\$\s+/m,
    /^npm\s+/m,
    /^yarn\s+/m,
    /^npx\s+/m,
    /^cd\s+/m,
    /^mkdir\s+/m,
    /^touch\s+/m,
    /^git\s+/m,
    /^docker\s+/m,
    /^curl\s+/m,
    /^wget\s+/m,
    /^sudo\s+/m,
    /^chmod\s+/m,
    /^chown\s+/m
  ];
  
  return shellIndicators.some(regex => regex.test(code));
}

// Helper function to get file description based on extension
function getFileDescription(filePath: string): string {
  const fileExtension = filePath.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'tsx':
    case 'jsx':
      return `Create the React component ${filePath}`;
    case 'ts':
      return `Create the TypeScript file ${filePath}`;
    case 'js':
      return `Create the JavaScript file ${filePath}`;
    case 'css':
      return `Create the CSS stylesheet ${filePath}`;
    case 'scss':
    case 'sass':
      return `Create the Sass stylesheet ${filePath}`;
    case 'html':
      return `Create the HTML file ${filePath}`;
    case 'json':
      return `Create the JSON configuration file ${filePath}`;
    case 'md':
      return `Create the Markdown file ${filePath}`;
    case 'yml':
    case 'yaml':
      return `Create the YAML configuration file ${filePath}`;
    case 'xml':
      return `Create the XML file ${filePath}`;
    case 'sql':
      return `Create the SQL file ${filePath}`;
    case 'py':
      return `Create the Python file ${filePath}`;
    case 'java':
      return `Create the Java file ${filePath}`;
    case 'cpp':
    case 'c':
      return `Create the C/C++ file ${filePath}`;
    case 'rs':
      return `Create the Rust file ${filePath}`;
    case 'go':
      return `Create the Go file ${filePath}`;
    default:
      return `Create the file ${filePath}`;
  }
}

// Example usage and test function
export const testParseBoltArtifact = (content: string, existingSteps?: Step[]): void => {
  console.log('Parsing content:', content);
  console.log('Existing steps:', existingSteps);
  const steps = parseBoltArtifactRobust(content, existingSteps);
  console.log('Generated steps:', steps);
};

// Simplified version for backward compatibility
export const parseBoltArtifact = (content: string, existingSteps?: Step[]): Step[] => {
  return parseBoltArtifactRobust(content, existingSteps);
};