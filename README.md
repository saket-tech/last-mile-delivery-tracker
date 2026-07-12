# Last Mile Delivery Tracker

A comprehensive delivery management platform with automated rate calculation, intelligent agent assignment, and real-time order tracking.

## Features

### For Customers
- Register and login
- Place orders with real-time charge calculation
- View charge breakdown before confirmation
- Track orders with full timeline
- Reschedule failed deliveries

### For Admins
- Manage zones and areas
- Configure rate cards (B2B/B2C, intra/inter-zone, COD surcharge)
- Create orders on behalf of customers
- Manual or automatic agent assignment
- View and filter all orders
- Override order status

### For Delivery Agents
- View assigned orders
- Update order status (Picked Up, In Transit, Out For Delivery, Delivered, Failed)
- Update current location
- Toggle availability

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Nodemailer (Email)
- Twilio (SMS)

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios

## Project Structure

```
Last-Mile Delivery Tracker/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── agentController.js
│   │   ├── authController.js
│   │   └── customerController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validateRequest.js
│   ├── models/
│   │   ├── AgentLocation.js
│   │   ├── Area.js
│   │   ├── Order.js
│   │   ├── RateCard.js
│   │   ├── TrackingHistory.js
│   │   ├── User.js
│   │   └── Zone.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── agentRoutes.js
│   │   ├── authRoutes.js
│   │   └── customerRoutes.js
│   ├── services/
│   │   ├── autoAssignmentService.js
│   │   ├── emailService.js
│   │   ├── rateCalculationService.js
│   │   ├── smsService.js
│   │   └── zoneDetectionService.js
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── agent/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── customer/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Gmail account (for email)
- Twilio account (optional, for SMS)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/last-mile-delivery
JWT_SECRET=your_jwt_secret_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
PORT=5000
```

5. Start backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start frontend development server:
```bash
npm run dev
```

4. Open browser at `http://localhost:3000`

## Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: Enum['admin', 'customer', 'delivery_agent'],
  zone: ObjectId (ref: Zone), // for agents
  isAvailable: Boolean,
  currentLocation: {
    latitude: Number,
    longitude: Number
  }
}
```

### Zones Collection
```javascript
{
  name: String (unique),
  description: String
}
```

### Areas Collection
```javascript
{
  name: String (unique),
  zone: ObjectId (ref: Zone)
}
```

### RateCards Collection
```javascript
{
  orderType: Enum['B2B', 'B2C'],
  intraZoneRate: Number,
  interZoneRate: Number,
  codSurcharge: Number
}
```

### Orders Collection
```javascript
{
  orderNumber: String (unique),
  customer: ObjectId (ref: User),
  pickupAddress: String,
  pickupArea: ObjectId (ref: Area),
  pickupZone: ObjectId (ref: Zone),
  dropAddress: String,
  dropArea: ObjectId (ref: Area),
  dropZone: ObjectId (ref: Zone),
  dimensions: {
    length: Number,
    breadth: Number,
    height: Number
  },
  actualWeight: Number,
  volumetricWeight: Number,
  billableWeight: Number,
  orderType: Enum['B2B', 'B2C'],
  paymentType: Enum['Prepaid', 'COD'],
  charge: Number,
  codSurcharge: Number,
  totalCharge: Number,
  status: Enum['Pending', 'Assigned', 'Picked Up', 'In Transit', 'Out For Delivery', 'Delivered', 'Failed'],
  assignedAgent: ObjectId (ref: User),
  rescheduledDate: Date,
  trackingHistory: [ObjectId (ref: TrackingHistory)]
}
```

### TrackingHistory Collection
```javascript
{
  order: ObjectId (ref: Order),
  status: String,
  timestamp: Date,
  actor: ObjectId (ref: User),
  actorRole: String,
  notes: String
}
```

### AgentLocations Collection
```javascript
{
  agent: ObjectId (ref: User),
  latitude: Number,
  longitude: Number,
  timestamp: Date
}
```

## Rate Calculation Logic

The rate calculation engine follows these steps:

1. **Zone Detection**: Extract area name from address and map to zone
2. **Volumetric Weight**: Calculate (Length × Breadth × Height) / 5000
3. **Billable Weight**: Use higher of actual weight or volumetric weight
4. **Zone Type**: Determine if intra-zone (same zone) or inter-zone (different zones)
5. **Rate Lookup**: Fetch rate from appropriate rate card (B2B or B2C)
6. **Base Charge**: Billable Weight × Rate
7. **COD Surcharge**: Add COD surcharge if payment type is COD
8. **Total Charge**: Base Charge + COD Surcharge

All values are fetched from database - no hardcoding.

## API Documentation

### Authentication

#### POST /api/auth/register
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "role": "customer"
}
```

#### POST /api/auth/login
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /api/auth/profile
Get user profile (protected)

### Admin Routes

#### POST /api/admin/zones
Create a new zone
```json
{
  "name": "North Zone",
  "description": "Northern delivery zone"
}
```

#### GET /api/admin/zones
Get all zones

#### POST /api/admin/areas
Create a new area
```json
{
  "name": "Downtown",
  "zone": "zone_id"
}
```

#### GET /api/admin/areas
Get all areas

#### POST /api/admin/rate-cards
Create a rate card
```json
{
  "orderType": "B2C",
  "intraZoneRate": 10,
  "interZoneRate": 15,
  "codSurcharge": 50
}
```

#### GET /api/admin/rate-cards
Get all rate cards

#### POST /api/admin/preview-charge
Preview charge calculation
```json
{
  "pickupAddress": "123 Downtown Street",
  "dropAddress": "456 Uptown Avenue",
  "dimensions": { "length": 30, "breadth": 20, "height": 10 },
  "actualWeight": 5,
  "orderType": "B2C",
  "paymentType": "COD"
}
```

#### POST /api/admin/orders
Create order for customer
```json
{
  "customer": "customer_id",
  "pickupAddress": "123 Downtown Street",
  "dropAddress": "456 Uptown Avenue",
  "dimensions": { "length": 30, "breadth": 20, "height": 10 },
  "actualWeight": 5,
  "orderType": "B2C",
  "paymentType": "COD"
}
```

#### GET /api/admin/orders
Get all orders (supports query params: status, zone, agent)

#### POST /api/admin/assign-agent
Manually assign agent to order
```json
{
  "orderId": "order_id",
  "agentId": "agent_id"
}
```

#### POST /api/admin/auto-assign
Auto assign nearest available agent
```json
{
  "orderId": "order_id"
}
```

#### POST /api/admin/override-status
Override order status
```json
{
  "orderId": "order_id",
  "status": "Delivered",
  "notes": "Delivered successfully"
}
```

### Customer Routes

#### POST /api/customer/orders
Place new order (same body as admin create order)

#### GET /api/customer/orders
Get customer's orders

#### GET /api/customer/orders/:id
Get single order details

#### POST /api/customer/reschedule
Reschedule failed delivery
```json
{
  "orderId": "order_id",
  "newDate": "2024-01-15"
}
```

### Agent Routes

#### GET /api/agent/orders
Get assigned orders

#### GET /api/agent/orders/:id
Get single order details

#### POST /api/agent/update-status
Update order status
```json
{
  "orderId": "order_id",
  "status": "Picked Up",
  "notes": "Package picked up"
}
```

#### POST /api/agent/update-location
Update current location
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### POST /api/agent/toggle-availability
Toggle agent availability

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Create new Render service
3. Connect GitHub repository
4. Set build command: `npm install`
5. Set start command: `node server.js`
6. Add environment variables in Render dashboard
7. Deploy

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Configure root directory: `frontend`
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Add environment variable: `VITE_API_URL` (backend URL)
7. Deploy

### Database (MongoDB Atlas)

1. Create MongoDB Atlas account
2. Create new cluster
3. Configure network access (whitelist IP)
4. Create database user
5. Get connection string
6. Add to environment variables

## Email Configuration

To enable email notifications:

1. Enable 2-factor on your Gmail account
2. Go to Google Account settings > Security
3. Generate App Password
4. Use app password in `EMAIL_PASSWORD` environment variable

## SMS Configuration (Optional)

To enable SMS notifications:

1. Create Twilio account (free trial available)
2. Get Account SID and Auth Token from dashboard
3. Get a Twilio phone number
4. Add credentials to environment variables

If Twilio is not configured, SMS will be logged to console instead.

## Initial Setup

After deployment, you need to:

1. Register an admin user
2. Create zones (e.g., North Zone, South Zone)
3. Create areas and assign to zones (e.g., Downtown → North Zone)
4. Create rate cards for B2B and B2C
5. Register delivery agents and assign them to zones

## Testing

The application includes validation on all API endpoints. Test with:
- Valid inputs
- Invalid inputs
- Missing required fields
- Unauthorized access
- Role-based access control

## License

ISC
