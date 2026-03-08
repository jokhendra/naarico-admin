import { 
  UploadedFileInfo, 
  PresignedUrlResponse, 
  UploadOptions, 
  UploadValidationOptions, 
  ValidationResult, 
  DeleteFileResponse,
  UploadProgress 
} from '@/types/upload';
import { uploadsApi } from '@/lib/api/uploads-api';

class UploadService {
  /**
   * Upload a single file with validation and progress tracking
   */
  async uploadSingleFile(
    file: File, 
    options: UploadOptions = {}
  ): Promise<UploadedFileInfo> {
    // Validate file before upload
    const validation = this.validateFile(file, {
      maxSizeMB: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      ...options
    });

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    return await uploadsApi.uploadSingle(file, options);
  }

  /**
   * Upload multiple files with validation and progress tracking
   */
  async uploadMultipleFiles(
    files: File[], 
    options: UploadOptions = {}
  ): Promise<UploadedFileInfo[]> {
    // Validate all files before upload
    const invalidFiles: string[] = [];
    
    files.forEach(file => {
      const validation = this.validateFile(file, {
        maxSizeMB: 10,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        ...options
      });
      
      if (!validation.isValid) {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    });

    if (invalidFiles.length > 0) {
      throw new Error(`Invalid files detected:\n${invalidFiles.join('\n')}`);
    }

    return await uploadsApi.uploadMultiple(files, options);
  }

  /**
   * Generate presigned URL for direct S3 upload
   */
  async generatePresignedUrl(
    fileName: string,
    contentType: string,
    folder?: string
  ): Promise<PresignedUrlResponse> {
    return await uploadsApi.generatePresignedUrl(fileName, contentType, folder);
  }

  /**
   * Upload file using presigned URL
   */
  async uploadWithPresignedUrl(
    file: File,
    presignedUrl: string,
    options: Pick<UploadOptions, 'onProgress' | 'signal'> = {}
  ): Promise<void> {
    return await uploadsApi.uploadWithPresignedUrl(file, presignedUrl, options);
  }

  /**
   * Delete a file by its key
   */
  async deleteFile(key: string): Promise<DeleteFileResponse> {
    return await uploadsApi.deleteFile(key);
  }

  /**
   * Upload file from URL
   */
  async uploadFromUrl(
    url: string, 
    filename?: string, 
    options: UploadOptions = {}
  ): Promise<UploadedFileInfo> {
    return await uploadsApi.uploadFromUrl(url, filename, options);
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, options: UploadValidationOptions = {}): ValidationResult {
    const { 
      maxSizeMB = 10, 
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] 
    } = options;

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size must be less than ${maxSizeMB}MB`
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate multiple files
   */
  validateFiles(files: File[], options: UploadValidationOptions = {}): {
    validFiles: File[];
    invalidFiles: string[];
  } {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach(file => {
      const validation = this.validateFile(file, options);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    });

    return { validFiles, invalidFiles };
  }

  /**
   * Get human-readable file size
   */
  getReadableFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file is an image
   */
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Check if file is a document
   */
  isDocumentFile(file: File): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ];
    return documentTypes.includes(file.type);
  }

  /**
   * Get upload options for different file types
   */
  getUploadOptionsForType(type: 'image' | 'document' | 'avatar' | 'general'): UploadValidationOptions {
    switch (type) {
      case 'image':
        return {
          maxSizeMB: 15,
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        };
      case 'document':
        return {
          maxSizeMB: 25,
          allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/csv'
          ]
        };
      case 'avatar':
        return {
          maxSizeMB: 3,
          allowedTypes: ['image/jpeg', 'image/png']
        };
      default:
        return {
          maxSizeMB: 10,
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        };
    }
  }

  /**
   * Batch upload files with progress tracking
   */
  async uploadBatch(
    files: File[],
    options: UploadOptions & { batchSize?: number } = {}
  ): Promise<UploadedFileInfo[]> {
    const { batchSize = 3, ...uploadOptions } = options;
    const results: UploadedFileInfo[] = [];
    
    // Process files in batches to avoid overwhelming the server
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map(file => this.uploadSingleFile(file, uploadOptions));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error(`Error uploading batch ${i / batchSize + 1}:`, error);
        throw error;
      }
    }

    return results;
  }
}

// Export singleton instance
export const uploadService = new UploadService(); 