import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction, TransactionItem } from '../types';

interface TransactionWithItems extends Transaction {
  items?: TransactionItem[];
}

export const useHistory = () => {
  const [transactions, setTransactions] = useState<TransactionWithItems[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, items:transaction_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const toggleExpand = (transactionId: string) => {
    setExpandedId(expandedId === transactionId ? null : transactionId);
  };

  return {
    transactions,
    expandedId,
    isLoading,
    toggleExpand,
  };
};
