import { useCallback, useEffect, useState } from "react";
import contactMessagesApi from "../api/contactMessage";
import type {
  ContactMessage,
  ContactMessageListResult,
} from "../api/contactMessage";

export default function useContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch paginated contact messages
   */
  const fetch = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const res: ContactMessageListResult = await contactMessagesApi.list(
        page,
        limit
      );
      setMessages(res.data || []);
      setCount(res.totalRecords || 0);
      setTotalPages(res.totalPages || 0);
      setCurrentPage(res.currentPage || 1);
      setPerPage(res.perPage || limit);
      return res;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a message by ID
   */
  const remove = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await contactMessagesApi.delete(id);
        // Optimistic refresh
        await fetch(currentPage, perPage);
        return res;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetch, currentPage, perPage]
  );

  // Initial load
  useEffect(() => {
    fetch(currentPage, perPage);
  }, [fetch]);

  return {
    messages,
    count,
    totalPages,
    currentPage,
    perPage,
    loading,
    error,
    fetch,
    remove,
    setCurrentPage,
    setPerPage,
  };
}
