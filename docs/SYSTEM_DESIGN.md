# System Design: Last-Mile Delivery Tracker

This document presents the architectural design of the Last-Mile Delivery Tracker, optimized for logistics scale, correctness, and interviewer evaluation.

---

### 1. Database Schema & Architecture
The system is built on a relational architecture (SQLite for dev, PostgreSQL for production) managed through Prisma ORM. 

Key Entities:
- **User / Profiles:** Holds credentials and roles. `AgentProfile` extends the `User` model, holding specific attributes like availability status, phone number, current workload, and mapped zone.
- **Zone & Area:** Configures areas (pincodes) mapped to zones, facilitating geographic grouping.
- **Order & RateCard:** Orders store addresses, package dimensions, weights, charges, and current status. Rate cards store prices based on B2B/B2C and Intra/Inter-Zone rules.
- **Immutable Tracking & Reschedule:** Relates to order updates and failed delivery attempts.

---

### 2. Rate Calculation Engine
Base delivery charges are calculated dynamically to avoid hardcoding:
1. **Volumetric Weight:** Computes `(Length × Breadth × Height) / 5000` (in cm).
2. **Billable Weight:** `MAX(Actual Weight, Volumetric Weight)`.
3. **Zone Lookup:** Detects pickup and drop zones (via pincodes).
4. **Rate Type Selection:** If `Pickup Zone == Drop Zone`, rate type is `INTRA_ZONE`. Otherwise, it is `INTER_ZONE`. Combined with `Order Type` (B2B/B2C), this fetches the matching `RateCard`.
5. **Calculated Charge:** Base charge is `Billable Weight × Rate per Kg`, restricted by the configured `minCharge`.
6. **COD Surcharge:** Adds the configured cash surcharge for B2B/B2C if payment type is Cash on Delivery.

---

### 3. Zone Detection Strategy
The engine ensures users can enter **any address and pincode** without restriction:
- The system queries the `Area` table for the input pincode.
- If found, it maps to the configured zone.
- If not found, it falls back to the **default fallback zone** configured in the DB.
This design accepts all shipments while maintaining dynamic rate calculations.

---

### 4. Auto-Assignment Algorithm
When an order is created, the auto-assignment algorithm executes a deterministic selection process:
1. Filters all users with role `AGENT` whose `availability` status is `AVAILABLE` and current workload is under a maximum threshold.
2. Compares agent profile zones with the order's pickup zone.
3. If zone-matched agents exist, it selects the one with the **lowest current workload** (load balancing).
4. If no agent is matched to the pickup zone, it selects the agent with the lowest current workload from the overall available pool.
5. Performs the assignment and increments the agent's workload.

---

### 5. Agent Availability & Workload
Agents maintain availability states: `AVAILABLE`, `BUSY`, or `OFFLINE`.
- Instantiating/assigning an order increases workload. If workload reaches capacity, the agent is set to `BUSY`.
- When an order reaches `DELIVERED` or `FAILED`, the agent is released: workload is decremented and status resets to `AVAILABLE` if previously busy.

---

### 6. Order Lifecycle & Status Transitions
Allowed status values: `CREATED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`.
- The system validates state transitions server-side: e.g., `CREATED` can only move to `PICKED_UP`.
- Admins possess bypass privileges to override statuses to correct scanner or entry errors.

---

### 7. Immutable Tracking Timeline
To guarantee auditability and transparency, order statuses are never updated silently:
- Every status transition executes within a database transaction that updates the `Order` status and inserts a `TrackingHistory` record.
- The tracking history logs the previous status, new status, timestamp, actor ID, and an optional note.

---

### 8. Failed Delivery & Rescheduling
If delivery fails, the agent marks status as `FAILED` with a note:
1. The agent is released, and their workload is decremented.
2. The customer sees the `FAILED` status and receives a notification.
3. The customer can reschedule, submitting a new delivery date and instructions.
4. The reschedule creates a `Reschedule` record, updates the order status back to `CREATED`, and clears the active agent, making the order eligible for reassignment.

---

### 9. Role-Based Access Control (RBAC)
Auth is managed via secure, encrypted `iron-session` cookies.
- **CUSTOMER:** Can manage their own orders and trigger reschedules.
- **AGENT:** Can view assigned orders and update statuses through the lifecycle.
- **ADMIN:** Full write access to rate cards, COD charges, zone configuration, customer metrics, agent workload, manual/auto-assignment triggers, and status override.
RBAC is enforced server-side via API route controllers and Next.js 16 Proxy configurations.

---

### 10. Notification Architecture
Notifications are created in the database and displayed in the user portals. The architecture supports plugging in SMS/Email providers (e.g., Twilio, SendGrid) via environment variables. If credentials are missing, it logs the event safely without failing the order.
