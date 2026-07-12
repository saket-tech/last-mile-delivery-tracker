const Area = require('../models/Area');

// Detect zone from address by finding the area in the address
const detectZone = async (address) => {
  try {
    console.log('Detecting zone for address:', address);
    
    // Get all areas
    const areas = await Area.find().populate('zone');
    console.log('Available areas:', areas.map(a => ({ name: a.name, zone: a.zone?.name })));
    
    // Find which area is mentioned in the address
    // More flexible matching: check if area name is present in address or vice versa
    for (const area of areas) {
      const addressLower = address.toLowerCase();
      const areaNameLower = area.name.toLowerCase();
      
      // Check if area name is in address
      if (addressLower.includes(areaNameLower)) {
        console.log('Found matching area:', area.name, 'in zone:', area.zone.name);
        return {
          area: area._id,
          zone: area.zone._id,
          areaName: area.name,
          zoneName: area.zone.name
        };
      }
      
      // Check for partial matches (e.g., "downtown" in "downtown street")
      const areaWords = areaNameLower.split(' ');
      for (const word of areaWords) {
        if (word.length > 3 && addressLower.includes(word)) {
          console.log('Found partial matching area:', area.name, 'in zone:', area.zone.name);
          return {
            area: area._id,
            zone: area.zone._id,
            areaName: area.name,
            zoneName: area.zone.name
          };
        }
      }
    }
    
    // If no match found, return a default area (first available)
    if (areas.length > 0) {
      console.warn('No exact match found, using default area:', areas[0].name);
      return {
        area: areas[0]._id,
        zone: areas[0].zone._id,
        areaName: areas[0].name,
        zoneName: areas[0].zone.name
      };
    }
    
    console.error('No areas found in database');
    throw new Error('No areas configured in database');
  } catch (error) {
    console.error('Zone detection error:', error);
    throw new Error(`Zone detection failed: ${error.message}`);
  }
};

module.exports = { detectZone };
