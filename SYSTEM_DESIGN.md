# System Design: Last Mile Delivery Tracker

## Rate Calculation Engine

The rate calculation engine is the core pricing module that computes delivery charges dynamically based on multiple factors. When an order is placed, the system first extracts the area name from the pickup and drop addresses. Each area is mapped to a zone in the database, enabling zone-based pricing. The engine calculates volumetric weight using the formula (Length × Breadth × Height) / 5000, then determines billable weight as the higher of actual weight or volumetric weight. The system checks if pickup and drop zones are the same (intra-zone) or different (inter-zone) and retrieves the appropriate rate from the rate card for the order type (B2B or B2C). Base charge is calculated as billable weight multiplied by the rate. If payment type is COD, a configured surcharge is added. All values come from the database—no hardcoding—ensuring flexibility for admins to adjust pricing without code changes. The full calculation breakdown is displayed to customers before confirmation.

## Zone Detection Approach

Zone detection uses a simple, database-driven approach without external mapping APIs. Admins create zones (e.g., North Zone, South Zone) and areas (e.g., Downtown, Uptown), then assign each area to a zone. When processing an address, the system searches for area names within the address string. For example, if the address contains "Downtown", it maps to the zone configured for that area. This approach is cost-effective, easy to maintain, and sufficient for most use cases. It avoids complexity of geocoding APIs while allowing admins to easily expand coverage by adding new areas and zones.

## Auto Assignment Logic

The auto assignment algorithm assigns delivery agents intelligently based on availability and location. When triggered, the system queries for all delivery agents in the pickup zone who are marked as available. For each agent, it retrieves the most recent location from the AgentLocation collection. If location data exists, the system calculates distance using the Haversine formula and assigns the nearest agent. If location data is unavailable, it falls back to assigning the first available agent in the pickup zone. This two-tier approach ensures reliable assignment even when GPS data is missing, while optimizing for efficiency when location data is present. Agents update their location manually through the agent dashboard, and availability can be toggled on/off.

## Tracking History

Order tracking uses an immutable history model to ensure complete auditability. Every status change creates a new TrackingHistory document with the order ID, new status, timestamp, actor (user who made the change), actor role, and optional notes. The Order document stores an array of references to these history entries. This design prevents data loss—history is never overwritten, only appended. Customers can view the full timeline with timestamps and actor information. The system supports all order statuses: Pending, Assigned, Picked Up, In Transit, Out For Delivery, Delivered, and Failed.

## Failed Delivery Handling

When a delivery fails, the agent updates the status to "Failed" with optional notes. The system immediately sends email and SMS notifications to the customer explaining the failure. The order status remains "Failed" until the customer takes action. Customers can log in and select a new delivery date through the reschedule interface. Upon rescheduling, the order status resets to "Pending", the assigned agent is cleared, and a new tracking entry is created. Admin or auto-assignment can then assign an agent for the rescheduled attempt. The original failed delivery history remains intact, providing complete visibility into delivery attempts. This workflow ensures customers are informed and can control rescheduling while maintaining a complete audit trail.
