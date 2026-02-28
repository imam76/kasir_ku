import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction, TransactionItem } from '../types';

interface TransactionWithItems extends Transaction {
  items?: TransactionItem[];
}

export const useHistory = () => {
  const [transactions, setTransactions] = useState<TransactionWithItems[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
  }, []);

  const loadTransactionItems = useCallback(async (transactionId: string) => {
    const { data, error } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', transactionId);

    if (!error && data) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, items: data } : t
        )
      );
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadTransactions();
    };
    init();
  }, [loadTransactions]);

  const toggleExpand = (transactionId: string) => {
    if (expandedId === transactionId) {
      setExpandedId(null);
    } else {
      setExpandedId(transactionId);
      const transaction = transactions.find((t) => t.id === transactionId);
      if (transaction && !transaction.items) {
        loadTransactionItems(transactionId);
      }
    }
  };

  return {
    transactions,
    expandedId,
    toggleExpand,
  };
};
