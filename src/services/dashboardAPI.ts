/**
 * API client for simplified dashboard endpoints
 */
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5000';

export interface DashboardConfig {
    dashboardId: string;
    datasetId: string;
    datasetName: string;
    metadata: {
        rowCount: number;
        columnCount: number;
        chartCount: number;
    };
    charts: any[];
    kpis: any[];
    layout: {
        sections: any[];
    };
    data: any[];
}

export const dashboardAPI = {
    /**
     * Upload and clean dataset, returns dashboardId
     */
    async uploadAndClean(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_BASE}/clean_data`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        return response.data;
    },

    /**
     * Get auto-generated dashboard
     */
    async getDashboard(datasetId: string): Promise<DashboardConfig> {
        const response = await axios.get(`${API_BASE}/api/dashboard/${datasetId}`);
        if (response.data.success) {
            return response.data.dashboard;
        }
        throw new Error(response.data.error || "Failed to fetch dashboard");
    },

    /**
     * Perform NLP query on dataset
     */
    async nlpQuery(datasetId: string, query: string) {
        const response = await axios.post(`${API_BASE}/nlp_query`, {
            filename: datasetId,
            query: query
        });
        return response.data;
    },

    /**
     * Get AI-generated insights for a dataset
     */
    async getInsights(datasetId: string) {
        const response = await axios.get(`${API_BASE}/api/insights/${datasetId}`);
        return response.data;
    }
};
