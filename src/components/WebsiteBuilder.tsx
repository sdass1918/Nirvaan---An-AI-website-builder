import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import StepsPanel from "./StepsPanel";
import FileExplorer from "./FileExplorer";
import CodeEditor from "./CodeEditor";
import { FileItem, Step } from "../types/builder";
import axios from "axios";
import { parseSteps } from "../utils/parse";
import { generateInitialFiles } from "../utils/generateFiles";
import { useWebContainer } from "../hooks/useWebContainer";
import { createMount } from "../utils/createMount";
import { parseBoltArtifactRobust } from "../utils/parsellm";
import { PreviewFrame } from "./PreviewPanel";
import { Divide } from "lucide-react";

const WebsiteBuilder: React.FC = () => {
  const [userPrompt, setuserPrompt] = useState<string>("");

  const webContainer = useWebContainer();
  const location = useLocation();
  const prompt = location.state?.prompt || "A modern website";

  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [llmMessages, setLlmMessages] = useState<
    { role: "user" | "model"; content: string }[]
  >([]); // Adjust type as needed
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasLoadedFromChat, setHasLoadedFromChat] = useState(false);

  //const steps: Step[] = [];
  const [stepsState, setStepsState] = useState<Step[]>([]);

  const init = async () => {
    if (isInitialized) return; // Prevent multiple calls
    setIsInitialized(true);
    // Await the axios POST request and remove unused destructuring
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/template`,
      {
        prompt: prompt,
      }
    );
    const { prompts, uiPrompts } = response.data;
    const parsedSteps = parseSteps(uiPrompts[0]);
    setStepsState(
      parsedSteps.map((step) => ({
        ...step,
        completed: false,
        active: true,
      }))
    );
    const stepsResponse = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/chat`,
      {
        messages: [...prompts, prompt].map((content) => ({
          role: "user",
          content,
        })),
      }
    );

    // const stepsResponse = await axios.post(`http://localhost:3000/chat`, {
    //   contents: [
    //     ...[...prompts, prompt].map((content) => ({
    //       role: "user",
    //       parts: [{ text: content }],
    //     })),
    //   ],
    // });

    setStepsState((currentSteps) => {
      const newSteps = parseBoltArtifactRobust(
        stepsResponse.data,
        currentSteps
      );
      return newSteps.map((step) => ({
        ...step,
        completed: step.completed || false,
        active: step.active !== false, // Preserve existing active state
      }));
      //setIsGenerating(false);
    });
    setHasLoadedFromChat(true);

    setLlmMessages(
      [...prompts, prompt].map((content) => ({
        role: "user",
        content,
      }))
    );

    setLlmMessages((x) => [
      ...x,
      { role: "model", content: stepsResponse.data.response },
    ]);
  };

  useEffect(() => {
    init();
    //setIsGenerating(false);
  }, [prompt]);

  useEffect(() => {
    if (!hasLoadedFromChat) return;
    const initialFiles = generateInitialFiles(stepsState);
    setFiles(initialFiles);
    setIsGenerating(false);
    setSelectedFile(initialFiles.length > 0 ? initialFiles[0].id : null);
  }, [stepsState]);

  useEffect(() => {
    async function mountFiles(mountStructure: {}) {
      await webContainer?.mount(mountStructure);
    }
    const currentFiles = files;
    const mountStructure = createMount(currentFiles);
    console.log(mountStructure);
    mountFiles(mountStructure ? mountStructure : {});
  }, [files, webContainer]);

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
  };

  const handleFileUpdate = (fileId: string, content: string) => {
    setFiles((prev) =>
      prev.map((file) => (file.id === fileId ? { ...file, content } : file))
    );
  };

  const getSelectedFileContent = () => {
    const findFile = (files: FileItem[]): FileItem | null => {
      for (const file of files) {
        if (file.id === selectedFile) return file;
        if (file.children) {
          const found = findFile(file.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findFile(files);
  };

  const selectedFileData = getSelectedFileContent();

  return (
    <div className="h-screen flex bg-gray-900">
      {/* Steps Panel */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex-shrink-0 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <StepsPanel
            steps={stepsState}
            currentStep={currentStep}
            prompt={prompt}
            isGenerating={isGenerating}
            LlmMessages={llmMessages}
          />
        </div>
        <div className="p-4 bg-gray-700 border-t border-gray-600">
          {isGenerating ? (
            <>
              <span className="text-blue-400 font-medium">Generating...</span>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-col">
              <textarea
                placeholder="Describe what you'd like to change..."
                className="mb-2 w-full text-sm px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-snug"
                value={userPrompt}
                onChange={(e) => setuserPrompt(e.target.value)}
                rows={2}
              />
            </div>
          )}
          <button
            onClick={async () => {
              setIsGenerating(true);
              const newMessage = {
                role: "user" as "user",
                content: userPrompt,
              };

              const stepsResponse = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/chat`,
                {
                  // Map each message from your existing format to the Generative AI API's format
                  messages: [...llmMessages, newMessage]
                    .filter((msg) => msg.content && msg.content.trim() !== "")
                    .map((msg) => ({
                      role: msg.role, // Use the existing role ("user" or "assistant")
                      parts: [
                        {
                          text: msg.content, // Wrap the content string in a 'text' property within a 'parts' array
                        },
                      ],
                    })),
                }
              );

              // const stepsResponse = await axios.post(
              //   `http://localhost:3000/chat`,
              //   {
              //     contents: [...LlmMessages, newMessage].map((msg) => ({
              //       role: msg.role === "assistant" ? "model" : msg.role,
              //       parts: [{ text: msg.content }],
              //     })),
              //   }
              // );

              setLlmMessages((prevMessages) => [...prevMessages, newMessage]);

              setStepsState((currentSteps) => {
                const newSteps = parseBoltArtifactRobust(
                  stepsResponse.data,
                  currentSteps
                );
                return newSteps.map((step) => ({
                  ...step,
                  completed: step.completed || false,
                  active: step.active !== false,
                }));
              });
              setIsGenerating(false);
              setuserPrompt("");
            }}
            className="bg-gray-500 text-white text-sm px-4 py-1 rounded-md hover:bg-green-600"
          >
            Reimagine
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* File Explorer */}
        <div className="w-80 bg-gray-850 border-r border-gray-700 flex-shrink-0">
          <FileExplorer
            files={files}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Code Editor */}
        {/* <div className="flex-1">
          <CodeEditor file={selectedFileData} onFileUpdate={handleFileUpdate} />
        </div> */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex">
            {/* Code Editor */}
            {!showPreview && (
              <div className="w-full">
                <CodeEditor
                  file={selectedFileData}
                  onFileUpdate={handleFileUpdate}
                />
              </div>
            )}

            {/* Preview Panel */}
            {showPreview && (
              <div className="w-full bg-gray-900">
                <PreviewFrame files={files} webContainer={webContainer} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilder;
