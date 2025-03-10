// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './index.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [copySuccess, setCopySuccess] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const API_KEY = import.meta.env.VITE_API_KEY;
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  useEffect(() => {
    setCharCount(inputValue.length);
  }, [inputValue]);

  const detectLanguage = (code) => {
    const languagePatterns = {
      python: /^(import|from|def|class|print)/m,
      javascript: /^(const|let|var|function|class|console)/m,
      java: /^(public|class|import|package)/m,
      cpp: /^(#include|using namespace|int main)/m,
      php: /^(<\?php|namespace|use|class)/m,
    };

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(code)) {
        return lang;
      }
    }
    return 'javascript'; // default
  };

  const formatCode = (code, lang) => {
    // Remove extra newlines at start and end
    code = code.trim();
    
    // Remove markdown code block syntax if present
    code = code.replace(/^```[\w-]*\n/, ''); // Remove opening ```language
    code = code.replace(/\n```$/, ''); // Remove closing ```
    code = code.replace(/^`{3}/, ''); // Remove opening ``` without language
    
    // Add proper indentation based on brackets and braces
    let indent = 0;
    const lines = code.split('\n');
    const formattedLines = lines.map(line => {
      line = line.trim();
      const prevIndent = indent;
      
      // Reduce indent for lines that start with closing brackets
      if (line.startsWith('}') || line.startsWith(')') || line.startsWith(']')) {
        indent--;
      }
      
      // Add proper indentation
      const formattedLine = '  '.repeat(Math.max(0, indent)) + line;
      
      // Increase indent for lines that end with opening brackets
      if (line.endsWith('{') || line.endsWith('(') || line.endsWith('[')) {
        indent++;
      }
      
      return formattedLine;
    });
    
    return formattedLines.join('\n');
  };

  const handleSubmit = async () => {
    if (inputValue.trim().length < 3) {
      setError('Please enter at least 3 characters to generate code.');
      return;
    }
    
    setLoading(true);
    setError('');
    setCopySuccess(false);
    
    try {
      const prompt = `Generate code for: ${inputValue}\nProvide ONLY the raw code without any markdown formatting, backticks, or language identifiers. Do not include any explanations or comments.`;
      
      const response = await axios.post(`${API_URL}?key=${API_KEY}`, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      });
      
      const code = response.data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
      const detectedLang = detectLanguage(code);
      const formattedCode = formatCode(code, detectedLang);
      setResponse(formattedCode);
      setLanguage(detectedLang);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'An error occurred. Please try again.');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy to clipboard. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-[#0a0f1a]">
      {/* Background Patterns */}
      <div className="dots-pattern"></div>
      <div className="grid-pattern-overlay"></div>
      
      {/* Header with enhanced glass effect */}
      <header className="relative glass-card border-b border-white/10 py-4 z-10">
        <div className="relative px-6">
          <h1 className="text-3xl font-bold text-center text-white/90 tracking-tight animate-float">AICodeView</h1>
          <p className="text-center text-gray-400/80 mt-1 text-sm tracking-wide">Generate code snippets using AI</p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 overflow-auto relative z-10 max-w-4xl mx-auto w-full">
        {/* Code Output Section */}
        <div className="flex-1 glass-card p-6 mb-4">
          {response ? (
            <div className="relative">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-white/90 tracking-tight flex items-center gap-2">
                  Generated Code
                  <span className="text-sm font-normal text-gray-400/80 tracking-wide">
                    (Press Ctrl + Enter to generate)
                  </span>
                </h2>
                <div className="flex items-center space-x-4">
                  <span className="glass-button text-white/90 text-sm px-3 py-1">
                    {language}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className={`glass-button flex items-center gap-2 ${
                      copySuccess ? 'bg-green-500/20 text-green-400' : 'text-white/90'
                    }`}
                    title="Copy code to clipboard"
                  >
                    {copySuccess ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden bg-gray-900/90 shadow-inner transition-all duration-300">
                <SyntaxHighlighter
                  language={language}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    fontSize: '14px',
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    minHeight: '200px',
                    fontFamily: "'Cascadia Code', monospace",
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    letterSpacing: '0.025em'
                  }}
                  className="syntax-highlighter"
                  wrapLines={true}
                  wrapLongLines={true}
                  showLineNumbers={true}
                  lineNumberStyle={{
                    minWidth: '3em',
                    paddingRight: '1em',
                    color: 'rgba(255, 255, 255, 0.2)',
                    textAlign: 'right',
                    userSelect: 'none'
                  }}
                  lineProps={{
                    style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' }
                  }}
                >
                  {response}
                </SyntaxHighlighter>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 relative space-y-4">
              <svg className="w-16 h-16 text-gray-700/30 animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              <div className="text-center">
                <p className="text-gray-400/70 text-lg tracking-wide">Generated code will appear here</p>
                <p className="text-gray-500/50 text-sm mt-1 tracking-wide">Describe what code you want to generate in the input below</p>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-xl relative overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-red-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400/90 text-center relative tracking-wide">{error}</p>
            </div>
          </div>
        )}

        {/* Footer Input Section */}
        <footer className="relative glass-card p-6">
          <div className="max-w-3xl mx-auto relative">
            <div className="flex flex-col gap-4">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Describe the code you want to generate..."
                  className="w-full h-32 bg-gray-900/90 text-white/90 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500/50 tracking-wide font-normal"
                  style={{ fontFamily: "'Cascadia Code', monospace" }}
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-4">
                  <span className="text-gray-500/50 text-sm tracking-wide">
                    {charCount} characters
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`glass-button flex items-center gap-2 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white/90" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App; 