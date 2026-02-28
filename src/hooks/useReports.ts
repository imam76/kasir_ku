import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Transaction, StockPurchase } from '../types';

interface SalesReportData {
  transactions: Transaction[];
  totalRevenue: number;
  totalProfit: number;
  totalItems: number;
  averageTransaction: number;
}

interface PurchaseReportData {
  purchases: StockPurchase[];
  totalCost: number;
  totalQuantity: number;
  uniqueProducts: number;
  averageCostPerUnit: number;
}

export const useSalesReport = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['salesReport', startDate, endDate],
    queryFn: async (): Promise<SalesReportData> => {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      // Add date filters if provided
      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transactions = (data as Transaction[]) || [];
      const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);

      // Get transaction items to calculate profit
      const transactionIds = transactions.map((t) => t.id);
      let profitQuery = supabase
        .from('transaction_items')
        .select('profit')
        .in('transaction_id', transactionIds.length > 0 ? transactionIds : ['null']);

      if (startDate) {
        profitQuery = profitQuery.gte('created_at', `${startDate}T00:00:00`);
      }
      if (endDate) {
        profitQuery = profitQuery.lte('created_at', `${endDate}T23:59:59`);
      }

      const { data: profitData } = await profitQuery;
      const totalProfit = profitData?.reduce((sum, item) => sum + (item.profit || 0), 0) || 0;

      // Get total items count
      let itemsQuery = supabase
        .from('transaction_items')
        .select('quantity', { count: 'exact' })
        .in(
          'transaction_id',
          transactionIds.length > 0 ? transactionIds : ['null']
        );

      if (startDate) {
        itemsQuery = itemsQuery.gte('created_at', `${startDate}T00:00:00`);
      }
      if (endDate) {
        itemsQuery = itemsQuery.lte('created_at', `${endDate}T23:59:59`);
      }

      const { data: itemsData } = await itemsQuery;
      const totalItems = itemsData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      return {
        transactions,
        totalRevenue,
        totalProfit,
        totalItems,
        averageTransaction:
          transactions.length > 0 ? totalRevenue / transactions.length : 0,
      };
    },
  });
};

export const usePurchaseReport = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['purchaseReport', startDate, endDate],
    queryFn: async (): Promise<PurchaseReportData> => {
      let query = supabase
        .from('stock_purchases')
        .select('*')
        .order('created_at', { ascending: false });

      // Add date filters if provided
      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const purchases = (data as StockPurchase[]) || [];
      const totalCost = purchases.reduce((sum, p) => sum + p.total_cost, 0);
      const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);
      const uniqueProducts = new Set(purchases.map((p) => p.product_id)).size;
      const averageCostPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;

      return {
        purchases,
        totalCost,
        totalQuantity,
        uniqueProducts,
        averageCostPerUnit,
      };
    },
  });
};

