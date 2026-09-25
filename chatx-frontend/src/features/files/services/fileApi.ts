import api from '../../../services/api';
import { ApiResponse } from '../../../types/auth';

export interface FileUploadResponse {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export const fileApi = {
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post<ApiResponse<FileUploadResponse>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.data;
  },
};

export default fileApi;
