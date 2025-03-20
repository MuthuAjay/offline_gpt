import React, { useState, useEffect, useRef } from 'react';
import { fetchModels } from '../services/api';

interface ModelDetails {
  // Define specific properties if known
  parameters?: Record<string, any>;
  architecture?: string;
  // Add other known properties
}

interface Model {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: ModelDetails;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  // Add default model option if needed
  defaultModel?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  onModelChange,
  defaultModel
}) => {
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        const response = await fetchModels();
        const modelList = response.models.map((model: any) => 
          model.model || model.name || 'Unknown'
        );
        
        setModels(modelList);
        
        if ((!selectedModel || selectedModel === '') && modelList.length > 0) {
          const modelToSelect = defaultModel && modelList.includes(defaultModel)
            ? defaultModel
            : modelList[0];
          onModelChange(modelToSelect);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        setError('Failed to load models');
        setIsLoading(false);
      }
    };

    loadModels();
  }, [selectedModel, onModelChange, defaultModel]);

  const handleSelectModel = (model: string) => {
    onModelChange(model);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 bg-white border border-neutral-200 rounded-md shadow-sm min-w-[180px] text-sm text-neutral-800 hover:border-neutral-300 focus:outline-none"
        disabled={isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center">
          <span className={`block truncate ${selectedModel ? 'font-medium' : 'text-neutral-500'}`}>
            {isLoading 
              ? 'Loading models...' 
              : selectedModel || 'Select model'
            }
          </span>
        </span>
        <span className="ml-2 pointer-events-none">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-neutral-200">
          <ul 
            className="max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
            role="listbox"
          >
            {error ? (
              <li className="text-red-500 px-3 py-2 text-sm">
                {error}
                <button
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    fetchModels()
                      .then(response => {
                        const modelList = response.models.map((model: any) => 
                          model.model || model.name || 'Unknown'
                        );
                        setModels(modelList);
                        setIsLoading(false);
                      })
                      .catch(err => {
                        console.error('Error retrying model fetch:', err);
                        setError('Failed to load models');
                        setIsLoading(false);
                      });
                  }}
                  className="ml-2 text-primary hover:text-primary-dark text-xs font-medium"
                >
                  Retry
                </button>
              </li>
            ) : isLoading ? (
              <li className="text-neutral-500 px-3 py-2 text-sm flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading models...
              </li>
            ) : models.length === 0 ? (
              <li className="text-neutral-500 px-3 py-2 text-sm">
                No models available
              </li>
            ) : (
              models.map((model) => (
                <li 
                  key={model}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-neutral-100 ${
                    model === selectedModel ? 'bg-neutral-50 text-primary' : 'text-neutral-900'
                  }`}
                  onClick={() => handleSelectModel(model)}
                  role="option"
                  aria-selected={model === selectedModel}
                >
                  <span className={`block truncate ${model === selectedModel ? 'font-medium' : 'font-normal'}`}>
                    {model}
                  </span>
                  
                  {model === selectedModel && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;