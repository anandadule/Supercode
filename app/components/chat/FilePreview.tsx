import React from 'react';
import { imageEditDialogOpen, editingImageData } from '~/lib/stores/imageGeneration';

interface FilePreviewProps {
  files: File[];
  imageDataList: string[];
  onRemove: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ files, imageDataList, onRemove }) => {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-row overflow-x-auto mx-2 -mt-1 p-2 bg-bolt-elements-background-depth-3 border border-b-none border-bolt-elements-borderColor rounded-lg rounded-b-none">
      {files.map((file, index) => (
        <div key={file.name + file.size} className="mr-2 relative">
          {imageDataList[index] && (
            <div className="relative">
              <img src={imageDataList[index]} alt={file.name} className="max-h-20 rounded-lg" />
              <div className="absolute top-0 left-0 right-0 flex justify-between p-0.5">
                <button
                  onClick={() => {
                    editingImageData.set(imageDataList[index]);
                    imageEditDialogOpen.set(true);
                  }}
                  className="z-10 bg-accent-500/70 hover:bg-accent-500 rounded-full w-5 h-5 shadow-md transition-colors flex items-center justify-center"
                  title="Edit with AI"
                >
                  <div className="i-ph:pencil-simple w-3 h-3 text-white" />
                </button>
                <button
                  onClick={() => onRemove(index)}
                  className="z-10 bg-black/70 hover:bg-black rounded-full w-5 h-5 shadow-md transition-colors flex items-center justify-center"
                >
                  <div className="i-ph:x w-3 h-3 text-gray-200" />
                </button>
              </div>
              <div className="absolute bottom-0 w-full h-5 flex items-center px-2 rounded-b-lg text-bolt-elements-textTertiary font-thin text-xs bg-bolt-elements-background-depth-2">
                <span className="truncate">{file.name}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
