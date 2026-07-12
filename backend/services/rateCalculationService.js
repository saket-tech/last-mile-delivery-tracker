const RateCard = require('../models/RateCard');
const { detectZone } = require('./zoneDetectionService');

// Calculate volumetric weight
const calculateVolumetricWeight = (length, breadth, height) => {
  return (length * breadth * height) / 5000;
};

// Get billable weight (higher of actual or volumetric)
const getBillableWeight = (actualWeight, volumetricWeight) => {
  return Math.max(actualWeight, volumetricWeight);
};

// Calculate delivery charge
const calculateCharge = async (orderData) => {
  try {
    const {
      pickupAddress,
      dropAddress,
      dimensions,
      actualWeight,
      orderType,
      paymentType
    } = orderData;

    // Detect pickup and drop zones
    const pickupZoneData = await detectZone(pickupAddress);
    const dropZoneData = await detectZone(dropAddress);

    // Calculate volumetric weight
    const volumetricWeight = calculateVolumetricWeight(
      dimensions.length,
      dimensions.breadth,
      dimensions.height
    );

    // Get billable weight
    const billableWeight = getBillableWeight(actualWeight, volumetricWeight);

    // Get appropriate rate card
    const rateCard = await RateCard.findOne({ orderType });
    if (!rateCard) {
      throw new Error(`Rate card not found for order type: ${orderType}`);
    }

    // Determine if intra-zone or inter-zone
    const isIntraZone = pickupZoneData.zone.toString() === dropZoneData.zone.toString();
    const rate = isIntraZone ? rateCard.intraZoneRate : rateCard.interZoneRate;

    // Calculate base charge
    const baseCharge = billableWeight * rate;

    // Calculate COD surcharge if applicable
    let codSurcharge = 0;
    if (paymentType === 'COD') {
      codSurcharge = rateCard.codSurcharge;
    }

    // Total charge
    const totalCharge = baseCharge + codSurcharge;

    return {
      pickupArea: pickupZoneData.area,
      pickupZone: pickupZoneData.zone,
      pickupAreaName: pickupZoneData.areaName,
      pickupZoneName: pickupZoneData.zoneName,
      dropArea: dropZoneData.area,
      dropZone: dropZoneData.zone,
      dropAreaName: dropZoneData.areaName,
      dropZoneName: dropZoneData.zoneName,
      volumetricWeight: Math.round(volumetricWeight * 100) / 100,
      billableWeight: Math.round(billableWeight * 100) / 100,
      isIntraZone,
      rate,
      baseCharge: Math.round(baseCharge * 100) / 100,
      codSurcharge: Math.round(codSurcharge * 100) / 100,
      totalCharge: Math.round(totalCharge * 100) / 100,
      calculation: {
        step1: `Volumetric Weight = (${dimensions.length} × ${dimensions.breadth} × ${dimensions.height}) / 5000 = ${Math.round(volumetricWeight * 100) / 100} kg`,
        step2: `Billable Weight = Max(${actualWeight}, ${Math.round(volumetricWeight * 100) / 100}) = ${Math.round(billableWeight * 100) / 100} kg`,
        step3: `Zone Type = ${isIntraZone ? 'Intra Zone' : 'Inter Zone'}`,
        step4: `Rate = ${rate} per kg (${orderType})`,
        step5: `Base Charge = ${Math.round(billableWeight * 100) / 100} × ${rate} = ${Math.round(baseCharge * 100) / 100}`,
        step6: paymentType === 'COD' ? `COD Surcharge = ${codSurcharge}` : 'COD Surcharge = 0',
        step7: `Total Charge = ${Math.round(baseCharge * 100) / 100} + ${codSurcharge} = ${Math.round(totalCharge * 100) / 100}`
      }
    };
  } catch (error) {
    throw new Error(`Rate calculation failed: ${error.message}`);
  }
};

module.exports = { calculateCharge };
