import api from '../../../services/api';
import { ApiResponse } from '../../../types/auth';
import { CreateReportRequest, ReportDto } from '../../../types/report';

export const reportApi = {
  submitReport: async (request: CreateReportRequest): Promise<ReportDto> => {
    const res = await api.post<ApiResponse<ReportDto>>('/reports', request);
    return res.data.data;
  },
};

export default reportApi;
