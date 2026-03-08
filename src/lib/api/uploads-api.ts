import { axiosClient } from './axios-client';
import { 
  UploadedFileInfo, 
  PresignedUrlResponse, 
  UploadOptions, 
  DeleteFileResponse 
} from '@/types/upload';

export class UploadsApi {
  /**
   * Upload a single file to the server
   */
  async uploadSingle(
    file: File, 
    options: UploadOptions = {}
  ): Promise<UploadedFileInfo> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    const config: any = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: options.signal,
    };

    // Add progress tracking if callback is provided
    if (options.onProgress) {
      config.onUploadProgress = (progressEvent: any) => {
        const progress = {
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
        };
        options.onProgress!(progress);
      };
    }

    try {
      const response = await axiosClient.post('/uploads/single', formData, config);
      // Extract the actual file data from the wrapped response
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Upload cancelled');
      }
      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  }

  /**
   * Upload multiple files to the server
   */
  async uploadMultiple(
    files: File[], 
    options: UploadOptions = {}
  ): Promise<UploadedFileInfo[]> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    const config: any = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: options.signal,
    };

    // Add progress tracking if callback is provided
    if (options.onProgress) {
      config.onUploadProgress = (progressEvent: any) => {
        const progress = {
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
        };
        options.onProgress!(progress);
      };
    }

    try {
      const response = await axiosClient.post('/uploads/multiple', formData, config);
      // Extract the actual file data from the wrapped response
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Upload cancelled');
      }
      throw new Error(error.response?.data?.message || 'Failed to upload files');
    }
  }

  /**
   * Upload a file from URL to the server
   */
  async uploadFromUrl(
    url: string,
    filename?: string,
    options: UploadOptions = {}
  ): Promise<UploadedFileInfo> {
    const requestData = {
      url,
      fileName: filename,
      folder: options.folder,
    };

    const config: any = {
      signal: options.signal,
    };

    // Add progress tracking if callback is provided
    if (options.onProgress) {
      config.onUploadProgress = (progressEvent: any) => {
        const progress = {
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
        };
        options.onProgress!(progress);
      };
    }

    try {
      const response = await axiosClient.post('/uploads/from-url', requestData, config);
      // Extract the actual file data from the wrapped response
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Upload cancelled');
      }
      throw new Error(error.response?.data?.message || 'Failed to upload file from URL');
    }
  }

  /**
   * Generate a presigned URL for direct S3 upload
   */
  async generatePresignedUrl(
    fileName: string,
    contentType: string,
    folder?: string
  ): Promise<PresignedUrlResponse> {
    try {
      const response = await axiosClient.post('/uploads/presigned-url', {
        fileName,
        contentType,
        folder,
      });
      // Extract the actual data from the wrapped response
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate presigned URL');
    }
  }

  /**
   * Upload file directly to S3 using presigned URL
   */
  async uploadWithPresignedUrl(
    file: File,
    presignedUrl: string,
    options: Pick<UploadOptions, 'onProgress' | 'signal'> = {}
  ): Promise<void> {
    const config: any = {
      headers: {
        'Content-Type': file.type,
      },
      signal: options.signal,
    };

    // Add progress tracking if callback is provided
    if (options.onProgress) {
      config.onUploadProgress = (progressEvent: any) => {
        const progress = {
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
        };
        options.onProgress!(progress);
      };
    }

    try {
      await axiosClient.put(presignedUrl, file, config);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Upload cancelled');
      }
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Delete a file by its key
   */
  async deleteFile(key: string): Promise<DeleteFileResponse> {
    try {
      const response = await axiosClient.delete(`/uploads/${encodeURIComponent(key)}`);
      // Extract the actual data from the wrapped response
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete file');
    }
  }
}

// Export a singleton instance
export const uploadsApi = new UploadsApi(); 