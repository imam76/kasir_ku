import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction, TransactionItem } from '../types';

interface TransactionWithItems extends Transaction {
  items?: TransactionItem[];
}

export const useHistory = () => {
  const [transactions, setTransactions] = useState<TransactionWithItems[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
  };

  const loadTransactionItems = async (transactionId: string) => {
    const { data, error } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', transactionId);

    if (!error && data) {
      setTransactions(
        transactions.map((t) =>
          t.id === transactionId ? { ...t, items: data } : t
        )
      );
    }
  };

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
