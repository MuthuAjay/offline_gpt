import React, { useEffect, useState, useCallback } from 'react';
import { ModelInfo } from '../types';
import { fetchModels } from '../services/api';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelectModel }) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use useCallback to prevent unnecessary re-renders
  const loadModels = useCallback(async (selectFirstModel = true) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchModels();
      setModels(response.models);
      
      // Sort models alphabetically for better UX
      const sortedModels = [...response.models].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      setModels(sortedModels);
      
      // If no model is selected and we have models and selectFirstModel is true, select the first one
      if (!selectedModel && sortedModels.length > 0 && selectFirstModel) {
        onSelectModel(sortedModels[0].name);
      }
      
      return true;
    } catch (err) {
      console.error('Error loading models:', err);
      setError('Failed to load models. Make sure Ollama is running.');
      return false;
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedModel, onSelectModel]);

  // Load models on component mount
  useEffect(() => {
    loadModels();
    
    // Set up polling to refresh models every 30 seconds
    const intervalId = setInterval(() => {
      loadModels(false); // Don't auto-select first model on refresh
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [loadModels]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    await loadModels(false);
  };

  // Render loading state
  if (loading && models.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading models...</div>
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Render error state
  if (error && models.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-sm text-red-500 dark:text-red-400">{error}</div>
        <button 
          onClick={handleRefresh}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
          disabled={isRefreshing}
          aria-label="Retry loading models"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render empty state
  if (models.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-sm text-yellow-500 dark:text-yellow-400">
          No models available. Please pull a model in Ollama.
        </div>
        <button 
          onClick={handleRefresh}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
          disabled={isRefreshing}
          aria-label="Refresh models"
        >
          Refresh
        </button>
      </div>
    );
  }

  // Render selector
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="model-select" className="text-sm font-medium dark:text-gray-300">
        Model:
      </label>
      <div className="relative">
        <select
          id="model-select"
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
          aria-label="Select AI model"
        >
          {models.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <button
        onClick={handleRefresh}
        className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
        disabled={isRefreshing || loading}
        aria-label="Refresh models list"
        title="Refresh models"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};

export default ModelSelector;