const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register validation
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('role').isIn(['admin', 'customer', 'delivery_agent']).withMessage('Invalid role'),
  validate
];

// Login validation
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Order validation
const orderValidation = [
  body('pickupAddress').trim().notEmpty().withMessage('Pickup address is required'),
  body('dropAddress').trim().notEmpty().withMessage('Drop address is required'),
  body('dimensions.length').isNumeric().withMessage('Length must be a number'),
  body('dimensions.breadth').isNumeric().withMessage('Breadth must be a number'),
  body('dimensions.height').isNumeric().withMessage('Height must be a number'),
  body('actualWeight').isNumeric().withMessage('Actual weight must be a number'),
  body('orderType').isIn(['B2B', 'B2C']).withMessage('Order type must be B2B or B2C'),
  body('paymentType').isIn(['Prepaid', 'COD']).withMessage('Payment type must be Prepaid or COD'),
  validate
];

// Zone validation
const zoneValidation = [
  body('name').trim().notEmpty().withMessage('Zone name is required'),
  validate
];

// Area validation
const areaValidation = [
  body('name').trim().notEmpty().withMessage('Area name is required'),
  body('zone').isMongoId().withMessage('Valid zone ID is required'),
  validate
];

// Rate card validation
const rateCardValidation = [
  body('orderType').isIn(['B2B', 'B2C']).withMessage('Order type must be B2B or B2C'),
  body('intraZoneRate').isNumeric().withMessage('Intra zone rate must be a number'),
  body('interZoneRate').isNumeric().withMessage('Inter zone rate must be a number'),
  body('codSurcharge').isNumeric().withMessage('COD surcharge must be a number'),
  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  orderValidation,
  zoneValidation,
  areaValidation,
  rateCardValidation
};
