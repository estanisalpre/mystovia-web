import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Eye, Search } from 'lucide-react';
import ItemFormModal from './ItemFormModal';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

interface GameItem {
  itemId: number | string;
  count: number;
  name: string;
}

interface MarketItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: 'set_with_weapon' | 'set_without_weapon' | 'item';
  is_active: boolean;
  stock: number;
  featured: boolean;
  items_json: GameItem[];
  weapon_options?: { itemId: number; name: string; imageUrl?: string }[] | null;
  created_at: string;
  updated_at: string;
}

export default function AdminMarketplace() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, categoryFilter, statusFilter]);

  const loadItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/marketplace/items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setItems(data.items);
      } else if (response.status === 403) {
        alert('Access denied. Admin privileges required.');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error loading items:', error);
      alert('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(item => item.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(item => !item.is_active);
    }

    setFilteredItems(filtered);
  };

  const toggleItemStatus = async (itemId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/marketplace/items/${itemId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        loadItems();
      } else {
        alert(data.error || 'Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to toggle status');
    }
  };

  const deleteItem = async (itemId: number) => {
    if (!confirm('¿Estás seguro que queres eliminarlo? Esta acción no puede deshacerse.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/marketplace/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        loadItems();
      } else {
        alert(data.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const openEditForm = (item: MarketItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingItem(null);
    loadItems();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Items Management</h1>
          <p className="text-gray-400">Create, edit, and manage marketplace items</p>
        </div>

        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
        >
          <Plus size={20} />
          Create New Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="set_with_weapon">Sets con Arma</option>
            <option value="set_without_weapon">Sets sin Arma</option>
            <option value="item">Items</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Cargando items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-xl">Items no encontrados</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Nombre</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Categoría</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Precio</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Stock</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Características</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Estado</th>
                  <th className="text-right px-6 py-4 text-gray-400 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-t border-gray-700 ${
                      index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Eye size={16} className="text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{item.name}</p>
                          <p className="text-gray-500 text-sm truncate max-w-xs">
                            {item.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded capitalize">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      ${Number(item.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {item.stock === -1 ? 'Unlimited' : item.stock}
                    </td>
                    <td className="px-6 py-4">
                      {item.featured ? (
                        <span className="text-yellow-500">★ Yes</span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleItemStatus(item.id)}
                        className="flex items-center gap-2"
                      >
                        {item.is_active ? (
                          <>
                            <ToggleRight size={20} className="text-green-500" />
                            <span className="text-green-500">Activo</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={20} className="text-red-500" />
                            <span className="text-red-500">Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(item)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          title="Editar este elemento"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          title="Eliminar este elemento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      <ItemFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
