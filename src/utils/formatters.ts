export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('id-ID');
};

export const getStockStatusClass = (stock: number): string => {
  return stock < 10
    ? 'bg-red-100 text-red-800'
    : 'bg-green-100 text-green-800';
};
