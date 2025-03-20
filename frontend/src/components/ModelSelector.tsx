import React, { useState, useEffect } from 'react';
import { fetchModels } from '../services/api';

interface Model {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: any;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  onModelChange 
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchModels();
        console.log('API Response:', response); // Debug log
        
        // Check if response exists and has models property
        if (!response || !response.models) {
          console.error('Invalid response format:', response);
          throw new Error('Invalid response format from server');
        }
        
        // Transform the response if needed
        const modelList = response.models.map(model => ({
          name: model.name || model.model || 'Unknown Model',
          model: model.model || model.name || 'unknown',
          modified_at: model.modified_at || '',
          size: model.size || 0,
          digest: model.digest || '',
          details: model.details || {}
        }));
        
        console.log('Transformed models:', modelList); // Debug log
        setModels(modelList);
      } catch (error) {
        console.error('Error loading models:', error);
        setError(error instanceof Error ? error.message : 'Failed to load models');
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  return (
    <div className="relative">
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 cursor-pointer"
        disabled={loading}
      >
        <option value="">Select a model</option>
        {models.map((model) => (
          <option key={model.name} value={model.name}>
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

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg">
          <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;