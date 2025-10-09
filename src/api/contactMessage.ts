import axiosClient from "./axiosClient";

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone:string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface ContactMessageListResult {
  success: boolean;
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  data: ContactMessage[];
}

/**
 * API methods for managing contact messages (admin side)
 */
export const contactMessagesApi = {
  /**
   * Fetch paginated contact messages
   * Example: contactMessagesApi.list(1, 10)
   */
  list: async (page = 1, limit = 10): Promise<ContactMessageListResult> => {
    try {
      const res = await axiosClient.get("contact-messages", {
        params: { page, limit },
      });
      return res.data;
    } catch (err) {
      console.error("[contactMessagesApi] LIST error", err);
      throw err;
    }
  },

  /**
   * Delete a contact message by ID
   */
  delete: async (
    id: number
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await axiosClient.delete(`contact-messages/${id}`);
      return res.data;
    } catch (err) {
      console.error("[contactMessagesApi] DELETE error", err);
      throw err;
    }
  },
};

export default contactMessagesApi;
