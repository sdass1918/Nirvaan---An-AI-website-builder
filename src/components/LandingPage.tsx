import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Code, Zap, ArrowRight } from "lucide-react";

const LandingPage: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate("/build", { state: { prompt: prompt.trim() } });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl">
              <Code className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
            Nirvaan
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            Transform your ideas into beautiful websites with AI
          </p>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Describe your website vision, and watch as our AI creates a
            complete, production-ready website with code you can customize.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <Sparkles className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              AI-Powered
            </h3>
            <p className="text-gray-400">
              Advanced AI understands your vision and creates tailored websites
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <Code className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Full Code Access
            </h3>
            <p className="text-gray-400">
              Get complete source code with modern frameworks and best practices
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <Zap className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Lightning Fast
            </h3>
            <p className="text-gray-400">
              From idea to working website in minutes, not hours
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2">
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your website idea... (e.g., 'A modern portfolio for a photographer')"
                  className="flex-1 bg-transparent text-white placeholder-gray-400 border-none outline-none px-4 py-3 text-lg"
                  required
                />
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                >
                  Create Website
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </form>
          <p className="text-gray-500 text-sm mt-4">
            ✨ Try: "A minimalist blog for a tech startup" or "An e-commerce
            store for handmade jewelry"
          </p>
        </div>

        {/* Examples */}
        <div className="mt-16">
          <h3 className="text-2xl font-semibold text-white mb-8">
            Popular Website Types
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Portfolio Website",
              "Business Landing Page",
              "E-commerce Store",
              "Blog Platform",
              "Restaurant Menu",
              "Real Estate Showcase",
              "SaaS Product Page",
              "Photography Gallery",
            ].map((example) => (
              <button
                key={example}
                onClick={() =>
                  setPrompt(`Create a modern ${example.toLowerCase()}`)
                }
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 text-white transition-all duration-300 text-left"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
