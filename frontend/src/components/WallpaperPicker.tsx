import React, { useRef, useState } from 'react';

interface WallpaperPickerProps {
  currentWallpaper: string | null;
  onChange: (wallpaper: string | null) => void;
  onClose: () => void;
}

const WallpaperPicker: React.FC<WallpaperPickerProps> = ({ currentWallpaper, onChange, onClose }) => {
  const [preview, setPreview] = useState<string | null>(currentWallpaper);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL input
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setPreview(urlInput.trim());
    }
  };

  // Save wallpaper
  const handleSave = () => {
    if (preview) {
      onChange(preview);
      localStorage.setItem('chatWallpaper', preview);
      onClose();
    }
  };

  // Reset wallpaper
  const handleReset = () => {
    setPreview(null);
    onChange(null);
    localStorage.removeItem('chatWallpaper');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
        <h2 className="text-lg font-bold mb-4">Set Chat Wallpaper</h2>
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="mb-2"
          />
          <form onSubmit={handleUrlSubmit} className="flex gap-2 mb-2">
            <input
              type="url"
              placeholder="Paste image URL..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              className="flex-1 px-2 py-1 border rounded"
            />
            <button type="submit" className="px-3 py-1 bg-cosmic-purple text-white rounded hover:bg-cosmic-pink">Use</button>
          </form>
        </div>
        {preview && (
          <div className="mb-4">
            <img src={preview} alt="Wallpaper preview" className="rounded-lg max-h-40 w-full object-cover border" />
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!preview}
            className="px-4 py-2 bg-cosmic-purple text-white rounded hover:bg-cosmic-pink disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default WallpaperPicker; 