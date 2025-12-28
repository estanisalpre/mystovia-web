import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Package, DollarSign, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3301';

interface Order {
  id: number;
  account_id: number;
  player_id: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'approved' | 'delivered' | 'cancelled' | 'refunded';
  payment_method: string;
  payment_id: string | null;
  created_at: string;
  delivered_at: string | null;
  account_email: string;
  player_name: string;
  total_items: number;
}

interface Stats {
  total_orders: number;
  total_revenue: number;
  pending_count: number;
  approved_count: number;
  delivered_count: number;
  cancelled_count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-500 bg-yellow-500/10', icon: Clock },
  processing: { label: 'Procesando', color: 'text-blue-500 bg-blue-500/10', icon: Package },
  approved: { label: 'Aprobado', color: 'text-green-500 bg-green-500/10', icon: CheckCircle },
  delivered: { label: 'Entregado', color: 'text-emerald-500 bg-emerald-500/10', icon: Truck },
  cancelled: { label: 'Cancelado', color: 'text-red-500 bg-red-500/10', icon: XCircle },
  refunded: { label: 'Reembolsado', color: 'text-purple-500 bg-purple-500/10', icon: DollarSign }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, [pagination.page, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`${API_URL}/api/admin/marketplace/orders?${params}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setPagination(data.pagination);
        setStats(data.stats);
      } else if (response.status === 403) {
        alert('Acceso denegado. Se requieren privilegios de administrador.');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadOrders();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Órdenes</h1>
        <p className="text-gray-400">Gestiona las órdenes del marketplace</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Órdenes</p>
                <p className="text-white text-xl font-bold">{stats.total_orders}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign size={20} className="text-green-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Ingresos Totales</p>
                <p className="text-white text-xl font-bold">{formatCurrency(stats.total_revenue || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock size={20} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pendientes</p>
                <p className="text-white text-xl font-bold">{stats.pending_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Truck size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Entregados</p>
                <p className="text-white text-xl font-bold">{stats.delivered_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por email, personaje u orden #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobado</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Cargando órdenes...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-lg">
          <Package size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-xl">No se encontraron órdenes</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Orden #</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Usuario</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Personaje</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Monto</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Estado</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Fecha</th>
                  <th className="text-right px-6 py-4 text-gray-400 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  const statusInfo = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr
                      key={order.id}
                      className={`border-t border-gray-700 ${
                        index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'
                      } hover:bg-gray-700/50 transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-white font-mono">#{order.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">{order.account_email || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-yellow-500 font-semibold">{order.player_name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-400 font-semibold">
                          {formatCurrency(Number(order.total_amount))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">{formatDate(order.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} órdenes
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`w-10 h-10 rounded transition-colors ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative w-full max-w-lg bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-6 mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Orden #{selectedOrder.id}</h3>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{selectedOrder.account_email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Personaje:</span>
                <span className="text-yellow-500 font-semibold">{selectedOrder.player_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Monto:</span>
                <span className="text-green-400 font-semibold">{formatCurrency(Number(selectedOrder.total_amount))}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Items:</span>
                <span className="text-white">{selectedOrder.total_items}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Estado:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status]?.color || ''}`}>
                  {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Método de pago:</span>
                <span className="text-white">{selectedOrder.payment_method || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">ID de pago:</span>
                <span className="text-white font-mono text-sm">{selectedOrder.payment_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Creada:</span>
                <span className="text-white">{formatDate(selectedOrder.created_at)}</span>
              </div>
              {selectedOrder.delivered_at && (
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Entregada:</span>
                  <span className="text-white">{formatDate(selectedOrder.delivered_at)}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
