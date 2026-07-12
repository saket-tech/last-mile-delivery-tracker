import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'orders':
          response = await api.get('/admin/orders');
          break;
        case 'customers':
          response = await api.get('/admin/users?role=customer');
          break;
        case 'agents':
          response = await api.get('/admin/users?role=delivery_agent');
          break;
        case 'zones':
          response = await api.get('/admin/zones');
          break;
        case 'areas':
          response = await api.get('/admin/areas');
          break;
        case 'rate-cards':
          response = await api.get('/admin/rate-cards');
          break;
        default:
          return;
      }
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
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
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded ${activeTab === 'orders' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded ${activeTab === 'customers' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2 rounded ${activeTab === 'agents' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            Agents
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2 rounded ${activeTab === 'zones' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            Zones
          </button>
          <button
            onClick={() => setActiveTab('areas')}
            className={`px-4 py-2 rounded ${activeTab === 'areas' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            Areas
          </button>
          <button
            onClick={() => setActiveTab('rate-cards')}
            className={`px-4 py-2 rounded ${activeTab === 'rate-cards' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            Rate Cards
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            {activeTab === 'orders' && <OrdersTable orders={Array.isArray(data) ? data : []} refresh={fetchData} />}
            {activeTab === 'customers' && <CustomersTable customers={Array.isArray(data) ? data : []} refresh={fetchData} />}
            {activeTab === 'agents' && <AgentsTable agents={Array.isArray(data) ? data : []} refresh={fetchData} />}
            {activeTab === 'zones' && <ZonesTable zones={Array.isArray(data) ? data : []} refresh={fetchData} />}
            {activeTab === 'areas' && <AreasTable areas={Array.isArray(data) ? data : []} refresh={fetchData} />}
            {activeTab === 'rate-cards' && <RateCardsTable rateCards={Array.isArray(data) ? data : []} refresh={fetchData} />}
          </div>
        )}
      </div>
    </div>
  );
};

const OrdersTable = ({ orders, refresh }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    pickupAddress: '',
    dropAddress: '',
    dimensions: { length: '', breadth: '', height: '' },
    actualWeight: '',
    orderType: 'B2C',
    paymentType: 'Prepaid'
  });
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableAgents, setAvailableAgents] = useState([]);
  const [showAgentSelect, setShowAgentSelect] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/users?role=customer').then(res => setCustomers(res.data)).catch(err => console.error(err));
    api.get('/admin/users?role=delivery_agent').then(res => setAvailableAgents(res.data.filter(a => a.isAvailable))).catch(err => console.error(err));
  }, []);

  const filteredOrders = orders.filter(order => 
    order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/orders', formData);
      toast.success('Order created successfully');
      setShowCreateForm(false);
      setFormData({
        customer: '',
        pickupAddress: '',
        dropAddress: '',
        dimensions: { length: '', breadth: '', height: '' },
        actualWeight: '',
        orderType: 'B2C',
        paymentType: 'Prepaid'
      });
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async (orderId) => {
    setLoading(true);
    try {
      await api.post('/admin/auto-assign', { orderId });
      toast.success('Agent assigned successfully');
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Auto assignment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async (orderId, agentId) => {
    setLoading(true);
    try {
      await api.post('/admin/assign-agent', { orderId, agentId });
      toast.success('Agent assigned successfully');
      setShowAgentSelect(null);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Manual assignment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideStatus = async (orderId, status) => {
    if (!status) return;
    setLoading(true);
    try {
      await api.post('/admin/override-status', { orderId, status });
      toast.success('Status updated successfully');
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Orders</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by customer name or order #"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            Create Order
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded">
          <h3 className="font-bold mb-4">Create New Order</h3>
          <select
            value={formData.customer}
            onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
            required
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer._id} value={customer._id}>{customer.name} ({customer.email})</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Pickup Address"
            value={formData.pickupAddress}
            onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Drop Address"
            value={formData.dropAddress}
            onChange={(e) => setFormData({ ...formData, dropAddress: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
            required
          />
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              placeholder="Length (cm)"
              value={formData.dimensions.length}
              onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: e.target.value } })}
              className="flex-1 p-2 border rounded"
              required
            />
            <input
              type="number"
              placeholder="Breadth (cm)"
              value={formData.dimensions.breadth}
              onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, breadth: e.target.value } })}
              className="flex-1 p-2 border rounded"
              required
            />
            <input
              type="number"
              placeholder="Height (cm)"
              value={formData.dimensions.height}
              onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, height: e.target.value } })}
              className="flex-1 p-2 border rounded"
              required
            />
          </div>
          <input
            type="number"
            placeholder="Actual Weight (kg)"
            value={formData.actualWeight}
            onChange={(e) => setFormData({ ...formData, actualWeight: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
            required
          />
          <select
            value={formData.orderType}
            onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
          >
            <option value="B2C">B2C</option>
            <option value="B2B">B2B</option>
          </select>
          <select
            value={formData.paymentType}
            onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
          >
            <option value="Prepaid">Prepaid</option>
            <option value="COD">COD</option>
          </select>
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50" disabled={loading}>
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Order #</th>
              <th className="text-left p-2">Customer</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Total Charge</th>
              <th className="text-left p-2">Agent</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id} className="border-b">
                <td className="p-2">{order.orderNumber}</td>
                <td className="p-2">{order.customer?.name}</td>
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
                <td className="p-2">{order.assignedAgent?.name || 'Unassigned'}</td>
                <td className="p-2">
                  {!order.assignedAgent && (
                    <>
                      <button
                        onClick={() => handleAutoAssign(order._id)}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2 disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? 'Assigning...' : 'Auto Assign'}
                      </button>
                      <button
                        onClick={() => setShowAgentSelect(showAgentSelect === order._id ? null : order._id)}
                        className="bg-green-500 text-white px-2 py-1 rounded text-sm mr-2 disabled:opacity-50"
                        disabled={loading}
                      >
                        Manual Assign
                      </button>
                    </>
                  )}
                  {showAgentSelect === order._id && (
                    <div className="mt-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleManualAssign(order._id, e.target.value);
                          }
                        }}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="">Select Agent</option>
                        {availableAgents.map((agent) => (
                          <option key={agent._id} value={agent._id}>{agent.name} ({agent.zone || 'No zone'})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <select
                    onChange={(e) => handleOverrideStatus(order._id, e.target.value)}
                    className="px-2 py-1 border rounded text-sm mt-2"
                  >
                    <option value="">Override Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Picked Up">Picked Up</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out For Delivery">Out For Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Failed">Failed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CustomersTable = ({ customers, refresh }) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({ name: customer.name, email: customer.email, phone: customer.phone });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/users/${selectedCustomer._id}`, formData);
      toast.success('Customer updated successfully');
      setShowEditForm(false);
      setSelectedCustomer(null);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/users/${customerId}`);
      toast.success('Customer deleted successfully');
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Customers</h2>
      </div>

      {showEditForm && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h3 className="font-bold mb-4">Edit Customer</h3>
          <form onSubmit={handleUpdate}>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full mb-2 p-2 border rounded"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full mb-2 p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full mb-4 p-2 border rounded"
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50" disabled={loading}>
                {loading ? 'Updating...' : 'Update'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedCustomer(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">Phone</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer._id} className="border-b">
              <td className="p-2">{customer.name}</td>
              <td className="p-2">{customer.email}</td>
              <td className="p-2">{customer.phone}</td>
              <td className="p-2">
                <button
                  onClick={() => handleEdit(customer)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2 hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(customer._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AgentsTable = ({ agents, refresh }) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', zone: '' });
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/zones').then(res => setZones(res.data)).catch(err => console.error(err));
  }, []);

  const handleEdit = (agent) => {
    setSelectedAgent(agent);
    setFormData({ name: agent.name, email: agent.email, phone: agent.phone, zone: agent.zone || '' });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/users/${selectedAgent._id}`, formData);
      toast.success('Agent updated successfully');
      setShowEditForm(false);
      setSelectedAgent(null);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update agent');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agentId) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/users/${agentId}`);
      toast.success('Agent deleted successfully');
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Delivery Agents</h2>
      </div>

      {showEditForm && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h3 className="font-bold mb-4">Edit Agent</h3>
          <form onSubmit={handleUpdate}>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full mb-2 p-2 border rounded"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full mb-2 p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full mb-2 p-2 border rounded"
            />
            <select
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="w-full mb-4 p-2 border rounded"
            >
              <option value="">Select Zone</option>
              {zones.map((zone) => (
                <option key={zone._id} value={zone.name}>{zone.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50" disabled={loading}>
                {loading ? 'Updating...' : 'Update'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedAgent(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">Phone</th>
            <th className="text-left p-2">Zone</th>
            <th className="text-left p-2">Available</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent._id} className="border-b">
              <td className="p-2">{agent.name}</td>
              <td className="p-2">{agent.email}</td>
              <td className="p-2">{agent.phone}</td>
              <td className="p-2">{agent.zone || 'No zone'}</td>
              <td className="p-2">{agent.isAvailable ? 'Yes' : 'No'}</td>
              <td className="p-2">
                <button
                  onClick={() => handleEdit(agent)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2 hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(agent._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ZonesTable = ({ zones, refresh }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/zones', formData);
      toast.success('Zone created successfully');
      setShowCreateForm(false);
      setFormData({ name: '', description: '' });
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create zone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Zones</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Zone
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded">
          <input
            type="text"
            placeholder="Zone Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
          />
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50" disabled={loading}>
            {loading ? 'Creating...' : 'Create Zone'}
          </button>
        </form>
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr key={zone._id} className="border-b">
              <td className="p-2">{zone.name}</td>
              <td className="p-2">{zone.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AreasTable = ({ areas, refresh }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', zone: '' });
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/zones').then(res => setZones(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/areas', formData);
      toast.success('Area created successfully');
      setShowCreateForm(false);
      setFormData({ name: '', zone: '' });
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create area');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Areas</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Area
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded">
          <input
            type="text"
            placeholder="Area Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
            required
          />
          <select
            value={formData.zone}
            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          >
            <option value="">Select Zone</option>
            {zones.map((zone) => (
              <option key={zone._id} value={zone._id}>{zone.name}</option>
            ))}
          </select>
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50" disabled={loading}>
            {loading ? 'Creating...' : 'Create Area'}
          </button>
        </form>
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Zone</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area) => (
            <tr key={area._id} className="border-b">
              <td className="p-2">{area.name}</td>
              <td className="p-2">{area.zone?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RateCardsTable = ({ rateCards, refresh }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    orderType: 'B2C',
    intraZoneRate: '',
    interZoneRate: '',
    codSurcharge: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/rate-cards', formData);
      toast.success('Rate card created successfully');
      setShowCreateForm(false);
      setFormData({ orderType: 'B2C', intraZoneRate: '', interZoneRate: '', codSurcharge: '' });
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create rate card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Rate Cards</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Rate Card
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded">
          <select
            value={formData.orderType}
            onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
          >
            <option value="B2C">B2C</option>
            <option value="B2B">B2B</option>
          </select>
          <input
            type="number"
            placeholder="Intra Zone Rate (per kg)"
            value={formData.intraZoneRate}
            onChange={(e) => setFormData({ ...formData, intraZoneRate: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Inter Zone Rate (per kg)"
            value={formData.interZoneRate}
            onChange={(e) => setFormData({ ...formData, interZoneRate: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="COD Surcharge"
            value={formData.codSurcharge}
            onChange={(e) => setFormData({ ...formData, codSurcharge: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50" disabled={loading}>
            {loading ? 'Creating...' : 'Create Rate Card'}
          </button>
        </form>
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Order Type</th>
            <th className="text-left p-2">Intra Zone Rate</th>
            <th className="text-left p-2">Inter Zone Rate</th>
            <th className="text-left p-2">COD Surcharge</th>
          </tr>
        </thead>
        <tbody>
          {rateCards.map((card) => (
            <tr key={card._id} className="border-b">
              <td className="p-2">{card.orderType}</td>
              <td className="p-2">${card.intraZoneRate}/kg</td>
              <td className="p-2">${card.interZoneRate}/kg</td>
              <td className="p-2">${card.codSurcharge}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
