/*
* Parse the input string to steps
* Eg Input - 
* ```\n\nindex.html:\n```
* \n<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/vite.svg\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title data-default>Vite + React + TS</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>\n\n

* \n\nindex.js:\n```\n// run `node index.js` in the terminal\n\nconsole.log(`Hello Node.js v${process.versions.node}!`);\n\n```

* Eg Output -
* [{
*   id: 1,
*   name: 'index.html',
*   description: 'index.html',
*   completed: false,
*   active: true,
*   code: '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <link rel="icon" type="image/svg+xml" href="/vite.svg" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title data-default>Vite + React + TS</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n\n',
*   type: 'stepType.createFile'
* }, {
*   id: 2,
*   name: 'index.js',
*   description: 'index.js',
*   completed: false,
*   active: true,
*   code: '// run `node index.js` in the terminal\n\nconsole.log(`Hello Node.js v${process.versions.node}!`);\n\n',
*   script: 'node index.js',
*   type: 'stepType.createFile && stepType.runScript'
* }]
* 
* The input might have multiple steps, so we need to parse it and return an array of steps and it might also have some code that needs to be run in the terminal.
* The input might also contain some strings in between so they need to be ignored.
*/

import { Step, stepType } from '../types/builder';
export function parseSteps(input: string): Step[] {
  const steps: Step[] = [];
  let stepId = 1;

  // Split input by file blocks - look for pattern: filename.ext:
  const fileBlocks = input.split(/(?=\n[^\n]*\.[a-zA-Z]+:\s*\n)/);
  
  for (const block of fileBlocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;
    
    // Extract filename from the first line
    const lines = trimmedBlock.split('\n');
    const firstLine = lines[0];
    
    // Match filename pattern
    const filenameMatch = firstLine.match(/^([^\n:]+\.(html|js|ts|jsx|tsx|css|json|md|txt|py|java|cpp|c|php|rb|go|rs|swift|kt|scala|sh|bat|yml|yaml|xml|sql)):\s*$/);
    
    if (filenameMatch) {
      const filename = filenameMatch[1].trim();
      const extension = filenameMatch[2];
      
      // Get all lines after the filename line
      let codeLines = lines.slice(1);
      
      // Remove leading/trailing ``` if present
      if (codeLines.length > 0 && codeLines[0].trim() === '```') {
        codeLines = codeLines.slice(1);
      }
      if (codeLines.length > 0 && codeLines[codeLines.length - 1].trim() === '```') {
        codeLines = codeLines.slice(0, -1);
      }
      
      // Join all code lines
      const code = codeLines.join('\n').trim();
      
      if (code) {
        let script: string | undefined;
        let stepTypes = stepType.createFile;
        
        // Check for script commands in comments
        if (code.includes('// run `') || code.includes('# run ')) {
          const scriptMatch = code.match(/\/\/ run `([^`]+)`|# run ([^\n]+)/);
          if (scriptMatch) {
            script = scriptMatch[1] || scriptMatch[2];
            stepTypes = stepType.createFile | stepType.runScript;
          }
        } else if (extension === 'js' && !filename.includes('config') && !filename.includes('package')) {
          // Default script for JS files (unless they're config files)
          script = `node ${filename}`;
          stepTypes = stepType.createFile | stepType.runScript;
        } else if (extension === 'py') {
          // Default script for Python files
          script = `python ${filename}`;
          stepTypes = stepType.createFile | stepType.runScript;
        } else if (extension === 'ts' && !filename.includes('config') && !filename.includes('vite')) {
          // Default script for TypeScript files (excluding config files)
          script = `ts-node ${filename}`;
          stepTypes = stepType.createFile | stepType.runScript;
        }

        // Create descriptive name based on step type
        let stepName: string;
        let stepDescription: string;
        
        if (stepTypes === (stepType.createFile | stepType.runScript)) {
          stepName = `Create and run ${filename}`;
          stepDescription = `Create ${filename} and execute it`;
        } else {
          stepName = `Create ${filename}`;
          stepDescription = `Create ${filename}`;
        }

        const step: Step = {
          id: stepId++,
          name: stepName,
          description: stepDescription,
          completed: false,
          active: true,
          code: code,
          type: stepTypes
        };

        if (script) {
          step.script = script;
        }

        steps.push(step);
      }
    }
  }

  return steps;
}