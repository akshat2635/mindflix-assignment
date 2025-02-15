import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Search, Image as ImageIcon, Loader2 } from 'lucide-react';

function App() {
  const [query, setQuery] = useState('');
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl('');
    document.getElementById('fileInput').value = ''; // Reset file input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query && !image) {
      setError('Please provide either a search query or an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (query) formData.append('query', query);
      if (image) formData.append('image', image);
      for (let pair of formData.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }
      const response = await axios.post('http://127.0.0.1:5000/search', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response.data.results)
      setResults(response.data.results);
    } catch (err) {
      setError('An error occurred while processing your request');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-700">
          <h1 className="text-3xl font-bold text-gray-100 mb-6 text-center">
            Image Search
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Search Query Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Query
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100 placeholder-gray-400"
                    placeholder="Enter your search query..."
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-lg bg-gray-700">
                  <div className="space-y-1 text-center">
                    {previewUrl ? (
                      <div>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="mx-auto h-32 w-auto object-contain mb-4"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="my-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-500 transition"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-300">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input
                          id="fileInput"
                          type="file"
                          className="sr-only"
                          onChange={handleImageChange}
                          accept="image/*"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm mt-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Search
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, index) => (
              <div key={index} className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700">
                <img
                  src={result.image}
                  alt={result.caption || 'Search result'}
                  className="w-full h-48 object-cover"
                />
                {result.caption && (
                  <div className="p-4">
                    <p className="text-sm text-gray-300">{result.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;