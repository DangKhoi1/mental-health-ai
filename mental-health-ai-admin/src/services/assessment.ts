import { apiClient } from './client';

interface AssessmentTemplatePayload {
  title: string;
  typeCode: string;
  description?: string;
  isActive?: boolean;
}

interface AssessmentQuestionOptionPayload {
  id: string;
  optionText: string;
  score: number;
}

interface AssessmentQuestionPayload {
  templateId?: string;
  content?: string;
  order?: number;
  options?: AssessmentQuestionOptionPayload[];
}

export const assessmentService = {
  async getAssessmentTemplates() {
    const res = await apiClient.get('/assessments/admin/templates');
    return res.data;
  },

  async getAssessmentTemplateById(id: string) {
    const res = await apiClient.get(`/assessments/templates/${id}`);
    return res.data;
  },

  async createAssessmentTemplate(data: AssessmentTemplatePayload) {
    const res = await apiClient.post('/assessments/templates', data);
    return res.data;
  },

  async updateAssessmentTemplate(id: string, data: Partial<AssessmentTemplatePayload>) {
    const res = await apiClient.patch(`/assessments/templates/${id}`, data);
    return res.data;
  },

  async deleteAssessmentTemplate(id: string) {
    const res = await apiClient.delete(`/assessments/templates/${id}`);
    return res.data;
  },

  async createAssessmentQuestion(data: AssessmentQuestionPayload) {
    const res = await apiClient.post('/assessments/questions', data);
    return res.data;
  },

  async updateAssessmentQuestion(id: string, data: AssessmentQuestionPayload) {
    const res = await apiClient.patch(`/assessments/questions/${id}`, data);
    return res.data;
  },

  async deleteAssessmentQuestion(id: string) {
    const res = await apiClient.delete(`/assessments/questions/${id}`);
    return res.data;
  },
};