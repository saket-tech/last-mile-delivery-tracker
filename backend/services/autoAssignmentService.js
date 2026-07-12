const User = require('../models/User');
const AgentLocation = require('../models/AgentLocation');

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Auto assign nearest available agent
const autoAssignAgent = async (pickupZone) => {
  try {
    console.log('Auto assignment called for zone:', pickupZone);
    
    // Find all available delivery agents in the pickup zone
    const agents = await User.find({
      role: 'delivery_agent',
      zone: pickupZone,
      isAvailable: true
    });

    console.log('Available agents found:', agents.length);
    console.log('Agents:', agents.map(a => ({ name: a.name, zone: a.zone, isAvailable: a.isAvailable })));

    if (agents.length === 0) {
      // Try finding agents without isAvailable filter for debugging
      const allAgentsInZone = await User.find({
        role: 'delivery_agent',
        zone: pickupZone
      });
      console.log('All agents in zone (including unavailable):', allAgentsInZone.length);
      console.log('All agents:', allAgentsInZone.map(a => ({ name: a.name, zone: a.zone, isAvailable: a.isAvailable })));
      
      throw new Error('No available agents in pickup zone');
    }

    // Get latest location for each agent
    const agentsWithLocation = [];
    for (const agent of agents) {
      const latestLocation = await AgentLocation.findOne({ agent: agent._id })
        .sort({ timestamp: -1 });
      
      if (latestLocation) {
        agentsWithLocation.push({
          agent,
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude
        });
      }
    }

    console.log('Agents with location data:', agentsWithLocation.length);

    // If we have agents with location data, find the nearest one
    if (agentsWithLocation.length > 0) {
      // For simplicity, we'll assign the first available agent with location
      // In a real implementation, you would calculate distance from pickup location
      const assigned = agentsWithLocation[0];
      console.log('Assigned agent (location-based):', assigned.agent.name);
      return {
        agentId: assigned.agent._id,
        agentName: assigned.agent.name,
        method: 'location_based'
      };
    }

    // Fallback: assign first available agent in zone
    const assigned = agents[0];
    console.log('Assigned agent (zone-based):', assigned.name);
    return {
      agentId: assigned._id,
      agentName: assigned.name,
      method: 'zone_based'
    };
  } catch (error) {
    console.error('Auto assignment error:', error);
    throw new Error(`Auto assignment failed: ${error.message}`);
  }
};

module.exports = { autoAssignAgent };
