import { Form, Modal, Input, InputNumber } from 'antd';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useStockManagement } from '../hooks/useStockManagement';
import type { Product } from '../types';
import { formatCurrency, getStockStatusClass } from '../utils/formatters';
import { Controller } from 'react-hook-form';

export default function StockManagement() {
  const {
    products,
    editingId,
    control,
    handleSubmit,
    handleEdit,
    handleDelete,
    resetForm,
    errors,
  } = useStockManagement();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalCancel = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const handleAddProduct = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    handleEdit(product);
    setIsModalOpen(true);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Manajemen Stok</h2>
        <button
          onClick={handleAddProduct}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 transition-colors text-sm sm:text-base"
        >
          <Plus size={18} />
          <span className="hidden xs:inline sm:inline">Tambah Produk</span>
          <span className="xs:hidden sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Modal for Create/Update */}
      <Modal
        title={editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
        open={isModalOpen}
        onCancel={handleModalCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          onFinish={async () => {
            try {
              await handleSubmit();
              setIsModalOpen(false);
            } catch (error) {
              console.error('Failed to save product:', error);
            }
          }}
          className="mt-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item
              label="Nama Produk"
              validateStatus={errors.name ? 'error' : ''}
              help={errors.name?.message}
            >
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Nama produk harus diisi' }}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>

            <Form.Item
              label="SKU"
              validateStatus={errors.sku ? 'error' : ''}
              help={errors.sku?.message}
            >
              <Controller
                name="sku"
                control={control}
                rules={{ required: 'SKU harus diisi' }}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>

            <Form.Item
              label="Harga Beli"
              validateStatus={errors.purchase_price ? 'error' : ''}
              help={errors.purchase_price?.message}
            >
              <Controller
                name="purchase_price"
                control={control}
                rules={{
                  required: 'Harga beli harus diisi',
                  min: { value: 0, message: 'Harga beli harus lebih dari 0' },
                }}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    className="w-full"
                    placeholder="Masukkan harga beli"
                    step={0.01}
                    min={0}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Harga Jual"
              validateStatus={errors.selling_price ? 'error' : ''}
              help={errors.selling_price?.message}
            >
              <Controller
                name="selling_price"
                control={control}
                rules={{
                  required: 'Harga jual harus diisi',
                  min: { value: 0, message: 'Harga jual harus lebih dari 0' },
                }}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    className="w-full"
                    placeholder="Masukkan harga jual"
                    step={0.01}
                    min={0}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Stok"
              validateStatus={errors.stock ? 'error' : ''}
              help={errors.stock?.message}
            >
              <Controller
                name="stock"
                control={control}
                rules={{
                  required: 'Stok harus diisi',
                  min: { value: 0, message: 'Stok harus lebih dari atau sama dengan 0' },
                }}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    className="w-full"
                    placeholder="Masukkan stok"
                    min={0}
                  />
                )}
              />
            </Form.Item>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleModalCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
            >
              Simpan
            </button>
          </div>
        </Form>
      </Modal>

      {/* Desktop & Tablet Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Produk
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Beli
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Jual
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                const margin = product.selling_price - product.purchase_price;
                const marginPercent = product.purchase_price > 0
                  ? ((margin / product.purchase_price) * 100).toFixed(1)
                  : '0';

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {formatCurrency(product.purchase_price)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {formatCurrency(product.selling_price)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded font-semibold ${margin > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        Rp {formatCurrency(margin)} ({marginPercent}%)
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded ${getStockStatusClass(product.stock)}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Belum ada produk. Tambahkan produk pertama Anda!
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {products.length === 0 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 text-center py-8 text-gray-500 text-sm">
            Belum ada produk. Tambahkan produk pertama Anda!
          </div>
        )}
        {products.map((product) => {
          const margin = product.selling_price - product.purchase_price;
          const marginPercent = product.purchase_price > 0
            ? ((margin / product.purchase_price) * 100).toFixed(1)
            : '0';

          return (
            <div key={product.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStockStatusClass(product.stock)}`}>
                    Stok: {product.stock}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 mb-0.5">Harga Beli</p>
                  <p className="font-semibold text-gray-900">Rp {formatCurrency(product.purchase_price)}</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 mb-0.5">Harga Jual</p>
                  <p className="font-semibold text-gray-900">Rp {formatCurrency(product.selling_price)}</p>
                </div>
                <div className={`rounded p-2 ${margin > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`mb-0.5 ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>Margin</p>
                  <p className={`font-semibold ${margin > 0 ? 'text-green-800' : 'text-red-800'}`}>
                    {marginPercent}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}