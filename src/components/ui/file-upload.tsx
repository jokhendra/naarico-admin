import React, { useCallback, useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Upload, File, Image, AlertCircle, Star, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/hooks/useFileUpload';
import { 
  FileUploadProps,
  UploadedFileInfo 
} from '@/types/upload';

// Custom Progress component since it's not available
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={cn("w-full bg-gray-200 rounded-full h-2", className)}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

export function FileUpload({ 
  className,
  accept,
  disabled = false,
  placeholder = "Drag & drop files here or click to browse",
  dragText = "Drop files here",
  browseText = "Browse Files",
  showProgress = true,
  showFileList = true,
  showUrlInput = true,
  onFilesChange,
  value = [],
  ...uploadOptions
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);



  const {
    isUploading,
    progress,
    uploadedFiles,
    error,
    uploadFiles,
    uploadFromUrl,
    removeFile,
    validateFiles,
    getReadableFileSize,
    isImageFile,
  } = useFileUpload({
    onSuccess: uploadOptions.onSuccess, // Pass the onSuccess callback directly
    ...uploadOptions,
  });

  // Use controlled value if provided, otherwise use internal state
  const currentFiles = useMemo(() => {
    if (value !== undefined) {
      // Controlled mode: use value prop only
      return value.filter(file => file && file.key && file.url);
    }
    
    // Uncontrolled mode: use internal state
    return uploadedFiles.filter(file => file && file.key && file.url);
  }, [value, uploadedFiles]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    uploadFiles(fileArray);
  }, [uploadFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  const handleBrowseClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelect]);

  const handleAddFromUrl = useCallback(async () => {
    if (!urlInput.trim() || isAddingUrl) return;
    
    setIsAddingUrl(true);
    try {
      await uploadFromUrl(urlInput.trim());
      setUrlInput('');
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsAddingUrl(false);
    }
  }, [urlInput, uploadFromUrl, isAddingUrl]);

  const handleRemoveFile = useCallback((file: UploadedFileInfo) => {
    if (disabled) return;
    
    if (value && value.length > 0) {
      // Controlled mode - call parent handler
      const newFiles = value.filter(f => f.key !== file.key);
      onFilesChange?.(newFiles);
    } else {
      // Uncontrolled mode - use hook handler
      removeFile(file);
    }
  }, [disabled, value, onFilesChange, removeFile]);

  const handleSetPrimary = useCallback((targetFile: UploadedFileInfo) => {
    if (disabled || !onFilesChange) return;
    
    // Move the selected file to the beginning of the array
    const otherFiles = currentFiles.filter(f => f.key !== targetFile.key);
    const newFiles = [targetFile, ...otherFiles];
    onFilesChange(newFiles);
  }, [disabled, currentFiles, onFilesChange]);

  const isFileImage = useCallback((file: UploadedFileInfo | File | null): boolean => {
    if (!file) {
      return false;
    }

    if ('mimetype' in file && file.mimetype) {
      return file.mimetype.startsWith('image/');
    }

    if ('url' in file) {
      const isImageByUrl = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url);
      return isImageByUrl;
    }

    if ('name' in file) {
      const isImageByFilename = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
      return isImageByFilename;
    }

    return false;
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragOver && !disabled
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={uploadOptions.multiple}
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            {isDragOver ? dragText : placeholder}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleBrowseClick}
            disabled={disabled || isUploading}
          >
            {browseText}
          </Button>
        </div>
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="flex space-x-2">
          <Input
            type="url"
            placeholder="Or enter image URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={disabled || isUploading || isAddingUrl}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddFromUrl();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleAddFromUrl}
            disabled={disabled || !urlInput.trim() || isUploading || isAddingUrl}
          >
            Add
          </Button>
        </div>
      )}

      {/* Progress Bar */}
      {showProgress && (isUploading || isAddingUrl) && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{isAddingUrl ? 'Adding from URL...' : 'Uploading...'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* File List - Grid Layout */}
      {showFileList && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Product Images ({currentFiles.length})
          </h4>
          {currentFiles.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-200 rounded-lg">
              No images uploaded yet
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentFiles.map((file, index) => (
                <div
                  key={file.key}
                  className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Primary Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Primary
                    </div>
                  )}
                  
                  {/* Image Preview */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {(() => {
                      const isImage = isFileImage(file);
                      return isImage ? (
                        <img
                          src={file.url}
                          alt={file.originalName || 'Product image'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Show fallback icon on error
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                          onLoad={() => {
                          }}
                        />
                      ) : (
                        <File className="h-8 w-8 text-gray-400" />
                      );
                    })()}
                    {/* Fallback icon (hidden by default) */}
                    <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.originalName || 'Product image'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {file.size && typeof file.size === 'number' ? getReadableFileSize(file.size) : 'Unknown size'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    {index !== 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetPrimary(file)}
                        disabled={disabled}
                        className="bg-white text-gray-900 hover:bg-gray-100"
                        title="Set as primary image"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // You can add edit functionality here
                      }}
                      disabled={disabled}
                      className="bg-white text-gray-900 hover:bg-gray-100"
                      title="Edit image"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveFile(file)}
                      disabled={disabled}
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 