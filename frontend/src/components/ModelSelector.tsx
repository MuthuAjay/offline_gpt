import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        console.log('Fetching models...');
        const response = await fetchModels();
        console.log('Models received:', response);
        setModels(response.models);
        
        // If no model is selected and we have models, select the first one
        if (!selectedModel && response.models.length > 0) {
          console.log('Selecting first model:', response.models[0].name);
          onSelectModel(response.models[0].name);
        }
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load models. Make sure Ollama is running.');
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, [selectedModel, onSelectModel]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading models...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  if (models.length === 0) {
    return <div className="text-sm text-yellow-500">No models available. Please pull a model in Ollama.</div>;
  }

  return (
    <div className="flex items-center">
      <label htmlFor="model-select" className="mr-2 text-sm font-medium">
        Model:
      </label>
      <select
        id="model-select"
        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm"
        value={selectedModel}
        onChange={(e) => onSelectModel(e.target.value)}
      >
        {models.map((model) => (
          <option key={model.name} value={model.name}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector; 