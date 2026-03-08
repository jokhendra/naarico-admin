import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { uploadService } from '@/services/uploadService';
import { 
  UploadedFileInfo, 
  UploadState, 
  UseFileUploadOptions,
  UploadOptions,
  UploadProgress 
} from '@/types/upload';

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    folder = 'uploads',
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    multiple = false,
    onSuccess,
    onError,
    showToasts = true,
  } = options;

  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    uploadedFiles: [],
    error: null,
  });

  const updateState = useCallback((updates: Partial<UploadState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = (error: any) => {
    const errorMessage = error.message || 'Upload failed';
    updateState({ 
      error: errorMessage, 
      isUploading: false, 
      progress: 0 
    });
    
    if (showToasts) toast.error(errorMessage);
    onError?.(errorMessage);
  };

  const uploadFiles = async (files: File[]): Promise<void> => {
    try {
      updateState({ isUploading: true, error: null });
      
      // Validate file count for single upload mode
      if (!multiple && files.length > 1) {
        const error = 'Only one file is allowed';
        updateState({ error });
        if (showToasts) toast.error(error);
        onError?.(error);
        return;
      }

      const onProgress = (progress: UploadProgress) => {
        updateState({ progress: progress.percentage });
      };

      const uploadedFiles = multiple ? await Promise.all(
        files.map(file => uploadService.uploadSingleFile(file, { folder, onProgress }))
      ) : [await uploadService.uploadSingleFile(files[0], { folder, onProgress })];

      const newState = {
        isUploading: false,
        progress: 100,
        uploadedFiles: [...state.uploadedFiles, ...uploadedFiles],
        error: null
      };
      
      updateState(newState);
      
      if (onSuccess) {
        onSuccess(uploadedFiles);
      }
      
      if (showToasts) {
        toast.success('Files uploaded successfully');
      }
    } catch (error) {
      handleError(error);
    }
  };

  const uploadFromUrl = async (url: string, filename?: string): Promise<void> => {
    try {
      updateState({ isUploading: true, error: null });
      
      const onProgress = (progress: UploadProgress) => {
        updateState({ progress: progress.percentage });
      };

      const uploadedFile = await uploadService.uploadFromUrl(url, filename, {
        folder,
        onProgress
      });

      const newState = {
        isUploading: false,
        progress: 100,
        uploadedFiles: [...state.uploadedFiles, uploadedFile],
        error: null
      };
      
      updateState(newState);
      
      if (onSuccess) {
        onSuccess([uploadedFile]);
      }
      
      if (showToasts) {
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      handleError(error);
    }
  };

  const removeFile = useCallback(async (fileToRemove: UploadedFileInfo) => {
    try {
      await uploadService.deleteFile(fileToRemove.key);
      
      updateState({
        uploadedFiles: state.uploadedFiles.filter(file => file.key !== fileToRemove.key)
      });

      if (showToasts) {
        toast.success('File removed successfully');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to remove file';
      if (showToasts) toast.error(errorMessage);
      onError?.(errorMessage);
    }
  }, [state.uploadedFiles, showToasts, onError, updateState]);

  const clearFiles = useCallback(() => {
    updateState({ 
      uploadedFiles: [], 
      error: null, 
      progress: 0 
    });
  }, [updateState]);

  const validateFiles = useCallback((files: File[]) => {
    const validationOptions = {
      maxSizeMB,
      allowedTypes
    };

    return uploadService.validateFiles(files, validationOptions);
  }, [maxSizeMB, allowedTypes]);

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      uploadedFiles: [],
      error: null,
    });
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    uploadFiles,
    uploadFromUrl,
    removeFile,
    clearFiles,
    validateFiles,
    reset,
    
    // Utilities
    getReadableFileSize: uploadService.getReadableFileSize,
    isImageFile: uploadService.isImageFile,
    isDocumentFile: uploadService.isDocumentFile,
  };
} 