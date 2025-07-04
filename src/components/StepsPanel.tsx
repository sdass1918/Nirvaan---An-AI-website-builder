import React, { useState } from "react";
import { CheckCircle, Circle, Loader, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Step } from "../types/builder";

interface StepsPanelProps {
  steps: Step[];
  currentStep: number;
  prompt: string;
  isGenerating: boolean;
  LlmMessages: { role: "user" | "model"; content: string }[];
}

const StepsPanel: React.FC<StepsPanelProps> = ({
  steps,
  currentStep,
  prompt,
  isGenerating,
  LlmMessages,
}) => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white">Nirvaan</h2>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Building:</h3>
          <p className="text-white text-sm">{prompt}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-6">
          Generation Progress
        </h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : step.active ? (
                  <Loader className="h-5 w-5 text-blue-400 animate-spin" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <h4
                  className={`font-medium ${
                    step.completed
                      ? "text-green-400"
                      : step.active
                      ? "text-blue-400"
                      : "text-gray-400"
                  }`}
                >
                  {step.name}
                </h4>
                <p className="text-gray-500 text-sm mt-1">{step.description}</p>
                {step.active && isGenerating && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-blue-400 h-1 rounded-full animate-pulse"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Status */}

        {/* <p className="text-gray-400 text-sm">
            {isGenerating ? (
              "Your website is being crafted with precision..."
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Describe what you'd like to change..."
                  className="text-sm px-3 py-1 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userPrompt}
                  onChange={(e) => setuserPrompt(e.target.value)}
                />
                <button className="bg-blue-600 text-white text-sm px-4 py-1 rounded-md hover:bg-blue-700">
                  Update
                </button>
              </div>
            )}
          </p> */}
      </div>
    </div>
  );
};

export default StepsPanel;
