import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('place-order');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/customer/orders');
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

  const handleProfileEdit = () => {
    setProfileData({ name: user.name, email: user.email, phone: user.phone });
    setActiveTab('profile');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/customer/profile', profileData);
      toast.success('Profile updated successfully');
      updateUser(profileData);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Customer Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('place-order')}
            className={`px-4 py-2 rounded ${activeTab === 'place-order' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            Place Order
          </button>
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`px-4 py-2 rounded ${activeTab === 'my-orders' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            My Orders
          </button>
          <button
            onClick={handleProfileEdit}
            className={`px-4 py-2 rounded ${activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            Profile
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'place-order' && <PlaceOrderForm refresh={fetchOrders} />}
          {activeTab === 'my-orders' && (
            selectedOrder ? (
              <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />
            ) : (
              <OrdersList orders={orders} onSelectOrder={setSelectedOrder} />
            )
          )}
          {activeTab === 'profile' && (
            <ProfileEdit profileData={profileData} setProfileData={setProfileData} onUpdate={handleUpdateProfile} />
          )}
        </div>
      </div>
    </div>
  );
};

const PlaceOrderForm = ({ refresh }) => {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    dropAddress: '',
    dimensions: { length: '', breadth: '', height: '' },
    actualWeight: '',
    orderType: 'B2C',
    paymentType: 'Prepaid'
  });
  const [calculation, setCalculation] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePreview = async () => {
    try {
      const response = await api.post('/customer/preview-charge', formData);
      setCalculation(response.data);
      setShowPreview(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Calculation failed');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/customer/orders', formData);
      toast.success('Order placed successfully!');
      setFormData({
        pickupAddress: '',
        dropAddress: '',
        dimensions: { length: '', breadth: '', height: '' },
        actualWeight: '',
        orderType: 'B2C',
        paymentType: 'Prepaid'
      });
      setCalculation(null);
      setShowPreview(false);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Place New Order</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 mb-2">Pickup Address</label>
          <input
            type="text"
            value={formData.pickupAddress}
            onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Enter pickup address with area name"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Drop Address</label>
          <input
            type="text"
            value={formData.dropAddress}
            onChange={(e) => setFormData({ ...formData, dropAddress: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Enter drop address with area name"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 mb-2">Length (cm)</label>
          <input
            type="number"
            value={formData.dimensions.length}
            onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: e.target.value } })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Breadth (cm)</label>
          <input
            type="number"
            value={formData.dimensions.breadth}
            onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, breadth: e.target.value } })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Height (cm)</label>
          <input
            type="number"
            value={formData.dimensions.height}
            onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, height: e.target.value } })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 mb-2">Actual Weight (kg)</label>
          <input
            type="number"
            value={formData.actualWeight}
            onChange={(e) => setFormData({ ...formData, actualWeight: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Order Type</label>
          <select
            value={formData.orderType}
            onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="B2C">B2C</option>
            <option value="B2B">B2B</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Payment Type</label>
          <select
            value={formData.paymentType}
            onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="Prepaid">Prepaid</option>
            <option value="COD">COD</option>
          </select>
        </div>
      </div>

      <button
        onClick={handlePreview}
        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 mr-4"
      >
        Calculate Charge
      </button>

      {showPreview && calculation && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-bold mb-4">Charge Calculation</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Pickup:</strong> {calculation.pickupAreaName} ({calculation.pickupZoneName})</p>
            <p><strong>Drop:</strong> {calculation.dropAreaName} ({calculation.dropZoneName})</p>
            <p><strong>Volumetric Weight:</strong> {calculation.volumetricWeight} kg</p>
            <p><strong>Billable Weight:</strong> {calculation.billableWeight} kg</p>
            <p><strong>Zone Type:</strong> {calculation.isIntraZone ? 'Intra Zone' : 'Inter Zone'}</p>
            <p><strong>Rate:</strong> ${calculation.rate}/kg</p>
            <p><strong>Base Charge:</strong> ${calculation.baseCharge}</p>
            <p><strong>COD Surcharge:</strong> ${calculation.codSurcharge}</p>
            <p className="text-lg font-bold"><strong>Total Charge:</strong> ${calculation.totalCharge}</p>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Calculation Steps:</h4>
            {Object.values(calculation.calculation).map((step, idx) => (
              <p key={idx} className="text-sm text-gray-600">{step}</p>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Confirming...' : 'Confirm Order'}
          </button>
        </div>
      )}
    </div>
  );
};

const OrdersList = ({ orders, onSelectOrder }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Orders</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Order #</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Total Charge</th>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b">
                <td className="p-2">{order.orderNumber}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-white ${
                    order.status === 'Delivered' ? 'bg-green-500' :
                    order.status === 'Failed' ? 'bg-red-500' :
                    order.status === 'Pending' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-2">${order.totalCharge}</td>
                <td className="p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
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

const OrderDetail = ({ order, onBack }) => {
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReschedule = async () => {
    setLoading(true);
    try {
      await api.post('/customer/reschedule', {
        orderId: order._id,
        newDate: rescheduleDate
      });
      toast.success('Delivery rescheduled successfully!');
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reschedule failed');
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

      <div className="grid grid-cols-5 gap-4 mb-6">
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
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Assigned Agent</p>
          <p className="font-semibold">{order.assignedAgent?.name || 'Not assigned'}</p>
        </div>
      </div>

      <div className="mb-6">
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

      {order.status === 'Failed' && (
        <div className="p-4 bg-red-50 rounded border border-red-200">
          <h3 className="font-semibold text-red-700 mb-2">Reschedule Delivery</h3>
          <input
            type="date"
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
            className="px-3 py-2 border rounded-lg mr-4"
            min={new Date().toISOString().split('T')[0]}
          />
          <button
            onClick={handleReschedule}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Rescheduling...' : 'Reschedule'}
          </button>
        </div>
      )}
    </div>
  );
};

const ProfileEdit = ({ profileData, setProfileData, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onUpdate(e);
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default CustomerDashboard;
