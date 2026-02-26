import { useState, useEffect } from 'react';
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Transaction, TransactionItem } from '../types';

interface TransactionWithItems extends Transaction {
  items?: TransactionItem[];
}

export default function History() {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Receipt size={32} className="text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h2>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
          >
            <div
              onClick={() => toggleExpand(transaction.id)}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">
                      {transaction.transaction_number}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDate(transaction.created_at)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="font-bold text-gray-800">
                        Rp {transaction.total_amount.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bayar</p>
                      <p className="font-semibold text-gray-700">
                        Rp {transaction.payment_amount.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Kembali</p>
                      <p className="font-semibold text-gray-700">
                        Rp {transaction.change_amount.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  {expandedId === transaction.id ? (
                    <ChevronUp className="text-gray-400" />
                  ) : (
                    <ChevronDown className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {expandedId === transaction.id && transaction.items && (
              <div className="border-t bg-gray-50 p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Detail Item:</h4>
                <div className="space-y-2">
                  {transaction.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-white p-3 rounded border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{item.product_name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-bold text-gray-800">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Belum ada transaksi</p>
          </div>
        )}
      </div>
    </div>
  );
}
