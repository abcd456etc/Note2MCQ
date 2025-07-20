
import React, { useState, useCallback } from 'react';
import { extractTextFromImage } from '../services/geminiService';
import { ImageIcon, LoaderIcon, TextIcon, XIcon, PlusIcon } from './Icons';

interface NoteUploaderProps {
  onAddNote: (title: string, content: string, type: 'text' | 'image') => void;
  onClose: () => void;
}

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        mimeType: file.type,
        base64Image: await base64EncodedDataPromise,
    };
};

export const NoteUploader: React.FC<NoteUploaderProps> = ({ onAddNote, onClose }) => {
  const [uploadType, setUploadType] = useState<'text' | 'image' | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return;
    setIsLoading(true);
    setError('');
    setImageFile(file);
    setNoteTitle(file.name.split('.').slice(0, -1).join('.') || "Untitled Image");

    try {
        const { mimeType, base64Image } = await fileToGenerativePart(file);
        const extractedText = await extractTextFromImage(mimeType, base64Image);
        setNoteContent(extractedText);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
        setError("Title is required.");
        return;
    }
    if (uploadType === 'text' && !noteContent.trim()) {
        setError("Content is required.");
        return;
    }
    if (uploadType === 'image' && !noteContent.trim()) {
        setError("Could not extract text from image or image not provided.");
        return;
    }
    setError('');
    onAddNote(noteTitle, noteContent, uploadType!);
  };

  if (!uploadType) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full relative transform transition-all duration-300 scale-100">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-center mb-6 text-white">Add a New Note</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setUploadType('text')} className="flex flex-col items-center justify-center p-6 bg-slate-700 hover:bg-indigo-600 rounded-lg transition-all duration-200 aspect-square">
              <TextIcon className="w-12 h-12 mb-2 text-indigo-300" />
              <span className="font-semibold">Add Text</span>
            </button>
            <button onClick={() => setUploadType('image')} className="flex flex-col items-center justify-center p-6 bg-slate-700 hover:bg-indigo-600 rounded-lg transition-all duration-200 aspect-square">
              <ImageIcon className="w-12 h-12 mb-2 text-indigo-300" />
              <span className="font-semibold">Upload Image</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-lg w-full relative transform transition-all duration-300 scale-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <XIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-white">
          {uploadType === 'text' ? 'Add New Text Note' : 'Upload Image Note'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              id="title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="e.g., Chapter 1: Photosynthesis"
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>
          {uploadType === 'text' ? (
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-300 mb-1">Content</label>
              <textarea
                id="content"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={8}
                placeholder="Paste or type your notes here..."
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
            </div>
          ) : (
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-slate-300 mb-1">Image File</label>
              <input
                type="file"
                id="image"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
              {imageFile && <p className="text-sm text-slate-400 mt-2">Selected: {imageFile.name}</p>}
               {isLoading && (
                    <div className="flex items-center space-x-2 text-slate-300 mt-2">
                        <LoaderIcon className="w-5 h-5 animate-spin" />
                        <span>Extracting text from image...</span>
                    </div>
                )}
              {noteContent && !isLoading && (
                 <div className="mt-4">
                    <p className="text-sm font-medium text-slate-300 mb-1">Extracted Text (Editable)</p>
                     <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        rows={6}
                        className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm"
                     />
                 </div>
              )}
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md flex items-center transition-colors">
                {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin mr-2" /> : <PlusIcon className="w-5 h-5 mr-2" />}
                Add Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
