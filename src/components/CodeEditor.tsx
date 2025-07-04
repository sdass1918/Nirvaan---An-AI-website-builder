import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Save, Download, Eye, Code, Settings } from "lucide-react";
import { FileItem } from "../types/builder";

interface CodeEditorProps {
  file: FileItem | null;
  onFileUpdate: (fileId: string, content: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file, onFileUpdate }) => {
  const [editorContent, setEditorContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (file?.code) {
      setEditorContent(file.code);
      setHasUnsavedChanges(false);
    }
  }, [file]);

  const getLanguage = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "html":
      case "htm":
        return "html";
      case "css":
        return "css";
      case "js":
        return "javascript";
      case "jsx":
        return "javascript";
      case "ts":
        return "typescript";
      case "tsx":
        return "typescript";
      case "json":
        return "json";
      case "md":
        return "markdown";
      default:
        return "plaintext";
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value);
      setHasUnsavedChanges(value !== file?.code);
    }
  };

  const handleSave = () => {
    if (file && hasUnsavedChanges) {
      onFileUpdate(file.id, editorContent);
      setHasUnsavedChanges(false);
    }
  };

  const handleDownload = () => {
    if (file) {
      const blob = new Blob([editorContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!file) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No File Selected</h3>
          <p>Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-y-scroll">
      {/* Editor Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">{file.name}</span>
              {hasUnsavedChanges && (
                <div
                  className="w-2 h-2 bg-orange-400 rounded-full"
                  title="Unsaved changes"
                />
              )}
            </div>
            <div className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
              {getLanguage(file.name).toUpperCase()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* <button className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
              <Eye className="h-4 w-4" />
              Preview
            </button> */}

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          language={getLanguage(file.name)}
          value={editorContent}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "JetBrains Mono, Fira Code, Monaco, monospace",
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            minimap: { enabled: true },
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: "on",
            lineHeight: 1.6,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: "on",
            quickSuggestions: true,
            parameterHints: { enabled: true },
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      {/* Editor Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Lines: {editorContent.split("\n").length}</span>
            <span>Characters: {editorContent.length}</span>
            <span>Language: {getLanguage(file.name)}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges ? (
              <span className="text-orange-400">● Unsaved changes</span>
            ) : (
              <span className="text-green-400">● Saved</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
