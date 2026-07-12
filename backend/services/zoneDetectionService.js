const Area = require('../models/Area');

// Detect zone from address by finding the area in the address
const detectZone = async (address) => {
  try {
    console.log('Detecting zone for address:', address);
    
    // Get all areas
    const areas = await Area.find().populate('zone');
    console.log('Available areas:', areas.map(a => ({ name: a.name, zone: a.zone?.name })));
    
    // Find which area is mentioned in the address
    // Simple implementation: check if area name is present in address
    for (const area of areas) {
      if (address.toLowerCase().includes(area.name.toLowerCase())) {
        console.log('Found matching area:', area.name, 'in zone:', area.zone.name);
        return {
          area: area._id,
          zone: area.zone._id,
          areaName: area.name,
          zoneName: area.zone.name
        };
      }
    }
    
    console.error('No matching area found for address:', address);
    throw new Error('Area not found in address');
  } catch (error) {
    console.error('Zone detection error:', error);
    throw new Error(`Zone detection failed: ${error.message}`);
  }
};

module.exports = { detectZone };
