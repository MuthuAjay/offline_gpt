import React, { useState, useEffect } from 'react';
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
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsRetrying(false);
      
      console.log('Fetching models...');
      const response = await fetchModels();
      console.log('Raw API Response:', response);
      
      if (!response || !response.models) {
        throw new Error('Invalid response from server');
      }

      const modelList = response.models.map((model: any) => ({
        name: model.name || model.model || 'Unknown Model',
        model: model.model || model.name || `unknown-${Math.random().toString(36).substring(2, 9)}`,
        modified_at: model.modified_at || new Date().toISOString(),
        size: typeof model.size === 'number' ? model.size : 0,
        digest: model.digest || '',
        details: model.details || {}
      }));
      
      console.log('Processed models:', modelList);
      setModels(modelList);
      
      if ((!selectedModel || selectedModel === '') && modelList.length > 0) {
        const modelToSelect = defaultModel && modelList.find(m => m.model === defaultModel || m.name === defaultModel)
          ? defaultModel
          : modelList[0].model;
        onModelChange(modelToSelect);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          setError('Connection is taking longer than expected. Please check your network and try again.');
        } else if (error.message.includes('Network error')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(error.message);
        }
      } else {
        setError('An unexpected error occurred while loading models.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    loadModels();
  };

  return (
    <div className="w-full">
      <div className="relative">
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className={`w-full appearance-none bg-white dark:bg-gray-700 border ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 ${
            loading ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'
          }`}
          disabled={loading}
          aria-label="Select a model"
        >
          <option value="">Select a model</option>
          {models.map((model) => (
            <option key={`${model.model}-${model.digest}`} value={model.model}>
              {model.name}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>

        {/* Loading indicator next to select instead of overlaying */}
        {loading && (
          <div className="absolute right-8 inset-y-0 flex items-center">
            <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Error state with retry button */}
      {error && (
        <div className="mt-1 flex items-center text-xs text-red-600 dark:text-red-400">
          <span>{error}</span>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Retry loading models"
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}
      
      {/* No models available message */}
      {!loading && !error && models.length === 0 && (
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          No models available. Please check your connection or try again later.
        </div>
      )}
    </div>
  );
};

export default ModelSelector;