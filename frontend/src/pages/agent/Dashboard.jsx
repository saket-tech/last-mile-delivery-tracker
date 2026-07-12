import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AgentDashboard = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/agent/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Agent Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <span className={`px-3 py-1 rounded text-white ${user?.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}>
              {user?.isAvailable ? 'Available' : 'Unavailable'}
            </span>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {selectedOrder ? (
            <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} refresh={fetchOrders} />
          ) : (
            <OrdersList orders={orders} onSelectOrder={setSelectedOrder} onToggleAvailability={async () => {
              try {
                await api.post('/agent/toggle-availability');
                window.location.reload();
              } catch (error) {
                alert('Failed to toggle availability');
              }
            }} />
          )}
        </div>
      </div>
    </div>
  );
};

const OrdersList = ({ orders, onSelectOrder, onToggleAvailability }) => {
  const [location, setLocation] = useState({ latitude: '', longitude: '', zone: '', area: '' });
  const [loading, setLoading] = useState(false);

  const handleUpdateLocation = async () => {
    setLoading(true);
    try {
      await api.post('/agent/update-location', location);
      toast.success('Location updated successfully!');
      setLocation({ latitude: '', longitude: '', zone: '', area: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Assigned Orders</h2>
        <button
          onClick={onToggleAvailability}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          Toggle Availability
        </button>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Update Current Location</h3>
        <p className="text-sm text-gray-500 mb-2">Enter either coordinates OR zone/area (not both required)</p>
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            step="any"
            placeholder="Latitude (optional)"
            value={location.latitude}
            onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude (optional)"
            value={location.longitude}
            onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Zone Name (optional)"
            value={location.zone}
            onChange={(e) => setLocation({ ...location, zone: e.target.value })}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Area Name (optional)"
            value={location.area}
            onChange={(e) => setLocation({ ...location, area: e.target.value })}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
        </div>
        <button
          onClick={handleUpdateLocation}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Location'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Order #</th>
              <th className="text-left p-2">Customer</th>
              <th className="text-left p-2">Pickup</th>
              <th className="text-left p-2">Drop</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b">
                <td className="p-2">{order.orderNumber}</td>
                <td className="p-2">{order.customer?.name}</td>
                <td className="p-2">{order.pickupAddress}</td>
                <td className="p-2">{order.dropAddress}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-white ${
                    order.status === 'Delivered' ? 'bg-green-500' :
                    order.status === 'Failed' ? 'bg-red-500' :
                    order.status === 'Pending' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OrderDetail = ({ order, onBack, refresh }) => {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async () => {
    if (!status) {
      toast.error('Please select a status');
      return;
    }
    setLoading(true);
    try {
      await api.post('/agent/update-status', {
        orderId: order._id,
        status,
        notes
      });
      toast.success('Status updated successfully!');
      refresh();
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-blue-500 hover:underline">← Back to Orders</button>
      
      <h2 className="text-xl font-bold mb-4">Order {order.orderNumber}</h2>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Pickup</h3>
          <p>{order.pickupAddress}</p>
          <p className="text-sm text-gray-600">{order.pickupArea?.name} - {order.pickupZone?.name}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Drop</h3>
          <p>{order.dropAddress}</p>
          <p className="text-sm text-gray-600">{order.dropArea?.name} - {order.dropZone?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Dimensions</p>
          <p className="font-semibold">{order.dimensions.length}×{order.dimensions.breadth}×{order.dimensions.height} cm</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Weight</p>
          <p className="font-semibold">{order.actualWeight} kg</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Type</p>
          <p className="font-semibold">{order.orderType}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Payment</p>
          <p className="font-semibold">{order.paymentType}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Current Status</h3>
        <span className={`px-3 py-1 rounded text-white ${
          order.status === 'Delivered' ? 'bg-green-500' :
          order.status === 'Failed' ? 'bg-red-500' :
          order.status === 'Pending' ? 'bg-yellow-500' : 'bg-blue-500'
        }`}>
          {order.status}
        </span>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
        <h3 className="font-semibold mb-2">Update Status</h3>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full mb-2 px-3 py-2 border rounded-lg"
        >
          <option value="">Select new status</option>
          <option value="Picked Up">Picked Up</option>
          <option value="In Transit">In Transit</option>
          <option value="Out For Delivery">Out For Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Failed">Failed</option>
        </select>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes (optional)"
          className="w-full mb-2 px-3 py-2 border rounded-lg"
          rows="2"
        />
        <button
          onClick={handleStatusUpdate}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Tracking Timeline</h3>
        {order.trackingHistory && order.trackingHistory.length > 0 ? (
          <div className="border-l-2 border-blue-500 pl-4 ml-2">
            {order.trackingHistory.map((track, idx) => (
              <div key={track._id || idx} className="mb-4 relative">
                <div className="absolute -left-6 w-4 h-4 bg-blue-500 rounded-full"></div>
                <p className="font-semibold">{track.status}</p>
                <p className="text-sm text-gray-600">
                  {track.timestamp ? new Date(track.timestamp).toLocaleString() : 
                   track.createdAt ? new Date(track.createdAt).toLocaleString() : 
                   'Invalid Date'}
                </p>
                <p className="text-sm text-gray-500">
                  By: {track.actor?.name || track.actor?.email || 'System'} ({track.actorRole || 'System'})
                </p>
                {track.notes && <p className="text-sm text-gray-500 italic">{track.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No tracking history available</p>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;
