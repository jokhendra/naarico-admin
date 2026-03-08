export interface UploadedFileInfo {
  key: string;
  url: string;
  originalName: string;
  mimetype?: string;
  size: number;
}

export interface PresignedUrlResponse {
  key: string;
  uploadUrl: string;
  publicUrl: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export interface UploadValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface DeleteFileResponse {
  success: boolean;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  uploadedFiles: UploadedFileInfo[];
  error: string | null;
}

export interface UseFileUploadOptions {
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  onSuccess?: (files: UploadedFileInfo[]) => void;
  onError?: (error: string) => void;
  showToasts?: boolean;
}

export interface FileUploadProps extends UseFileUploadOptions {
  className?: string;
  accept?: string;
  disabled?: boolean;
  placeholder?: string;
  dragText?: string;
  browseText?: string;
  showProgress?: boolean;
  showFileList?: boolean;
  showUrlInput?: boolean;
  onFilesChange?: (files: UploadedFileInfo[]) => void;
  value?: UploadedFileInfo[];
} 