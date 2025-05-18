import React from 'react';

interface SearchToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

const SearchToggle: React.FC<SearchToggleProps> = ({ enabled, onToggle }) => {
  return (
    <div className="flex items-center mr-2">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition duration-150 ${
          enabled 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        title={enabled ? "Disable web search" : "Enable web search"}
        aria-label={enabled ? "Disable web search" : "Enable web search"}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
        <span className="text-xs font-medium">
          {enabled ? "Web Search" : "Web Search"}
        </span>
        <div className={`relative ml-1 w-8 h-4 transition-colors duration-200 ease-in-out rounded-full ${
          enabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}>
          <span
            className={`absolute left-0 top-0 bg-white dark:bg-gray-200 w-4 h-4 rounded-full transform transition-transform duration-200 shadow-sm ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
      </button>
    </div>
  );
};

export default SearchToggle;