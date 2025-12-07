# API Documentation: Distributed Ticket Booking System

## 1. Introduction

This document outlines the backend API for the Distributed Ticket Booking System. The system manages seat bookings for a cinema, coordinated by a cluster of nodes. It demonstrates distributed database concepts and fault tolerance using a leader election algorithm (Bully Algorithm).

The API is divided into two main parts:
- A **RESTful API** for standard state-retrieval and actions (e.g., fetching seats).
- A **WebSocket/Server-Sent Events (SSE) API** for pushing real-time updates to clients, which is crucial for the admin dashboard to reflect live system changes.

### Enums
The system defines several enums in the `/enums` directory:
- `seat-status.enum.js`: Available seat statuses (AVAILABLE, BOOKED)
- `transaction-type.enum.js`: Types of system transactions (BUY, RELEASE, ELECTION, etc.)
- `node-role.enum.js`: Roles of nodes in the system (LEADER, FOLLOWER)
- `election-status.enum.js`: Election states (RUNNING, NOT_RUNNING)

---

## 2. Database Schema (Enhanced)

The provided schema is a good start. Here is an enhanced version for better data integrity and to support all frontend features.

### `nodes` Table
This table is essential for tracking the state of each node in the cluster.

```sql
CREATE TABLE nodes (
    id INT PRIMARY KEY,                       -- Node ID (e.g., 1, 2, 3)
    isLeader BOOLEAN DEFAULT FALSE,          -- Whether this node is the current leader
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `seats` Table
Stores the state of each seat.

```sql
CREATE TABLE seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seat_number VARCHAR(10) NOT NULL UNIQUE,  -- e.g., "A1", "A2"
    status ENUM('AVAILABLE', 'BOOKED') DEFAULT 'AVAILABLE', // See SeatStatus enum
    customer_name VARCHAR(100) DEFAULT NULL,
    -- Foreign key to the node that booked the seat
    booked_by_node_id INT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booked_by_node_id) REFERENCES nodes(id)
);
```

### `transaction_logs` Table
A log of all significant actions taken by the nodes.

```sql
CREATE TABLE transaction_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id INT NOT NULL,
    -- Expanded action types based on frontend
    action_type ENUM('LOCK', 'BUY', 'RELEASE', 'ELECTION', 'HEARTBEAT', 'KILL', 'REVIVE') NOT NULL, // See TransactionType enum
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES nodes(id)
);
```

### `election_history` Table
Stores a record of each leader election that occurs.

```sql
CREATE TABLE election_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    oldLeaderId INT,                        -- Can be NULL if no leader existed
    newLeaderId INT NOT NULL,
    candidates TEXT NOT NULL,                 -- JSON array of candidate node IDs, e.g., '[1, 2, 4, 5]'
    reason VARCHAR(255),                      -- e.g., "Node 3 was terminated"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (oldLeaderId) REFERENCES nodes(id),
    FOREIGN KEY (newLeaderId) REFERENCES nodes(id)
);
```

---

## 3. Data Models

These are the primary JSON objects used in API responses.

### Node
```json
{
  "id": 1,
  "isLeader": false
}
```

### Seat
```json
{
  "id": "A1",
  "seatNumber": "A1",
  "available": true,
  "customerName": null,
  "bookedByNode": null
}
```

### Transaction
```json
{
  "id": 1,
  "timestamp": "14:32:15",
  "nodeId": 3,
  "actionType": "BUY",
  "description": "Customer Jane Doe bought Seat A2"
}
```

### ElectionRecord
```json
{
    "id": 12345,
    "timestamp": "14:35:01",
    "oldLeaderId": 3,
    "newLeaderId": 6,
    "candidates": [1, 2, 4, 5, 6],
    "reason": "Node 3 was terminated"
}
```

---

## 4. REST API Endpoints

All admin-related endpoints should be protected and require authentication.

### Seats API

#### `GET /seats`
- **Description**: Retrieves the current state of all cinema seats. Used by both the admin dashboard and the user-facing booking page.
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "1",
      "seatNumber": "A1",
      "available": true,
      "customerName": null,
      "bookedByNode": null
    },
    {
      "id": "2",
      "seatNumber": "A2",
      "available": false,
      "customerName": "Jane Doe",
      "bookedByNode": 3
    }
  ]
  ```

#### `POST /seats/book`
- **Description**: A user action to book a seat. The backend should handle the distributed transaction logic (e.g., 2PC) to ensure consistency.
- **Request Body**:
  ```json
  {
    "seatId": "A5",
    "customerName": "John Doe"
  }
  ```
- **Response**:
  - `200 OK`: If booking is successful. Returns the updated seat object.
  - `409 Conflict`: If the seat is already booked.
  - `400 Bad Request`: For invalid input.

#### `POST /seats/release`
- **Description**: A user cancels their booking, or the system releases a locked seat.
- **Request Body**:
  ```json
  {
    "seatId": "A2"
  }
  ```
- **Response**: `200 OK` with the updated seat object.

### Nodes API

#### `GET /nodes`
- **Description**: Retrieves the state of all nodes in the cluster.
- **Response**: `200 OK`
  ```json
  [
    {"id": 1, "isLeader": false},
    {"id": 2, "isLeader": false},
    {"id": 3, "isLeader": true}
  ]
  ```

### System & Logs API

#### `GET /transactions`
- **Description**: Fetches a list of the most recent transaction logs.
- **Query Params**: `limit` (e.g., `?limit=50`).
- **Response**: `200 OK` with an array of `Transaction` objects.

#### `GET /elections/history`
- **Description**: Fetches a list of the most recent election records.
- **Query Params**: `limit` (e.g., `?limit=50`).
- **Response**: `200 OK` with an array of `ElectionRecord` objects.

#### `POST /system/toggle`
- **Description**: Toggles the entire system simulation on or off.
- **Request Body**:
  ```json
  {
    "active": true
  }
  ```
- **Response**: `200 OK`.

---

## 5. WebSocket / SSE Real-time Events

The server should push events to connected clients (especially the admin dashboard) to enable a live view of the system.

- **Endpoint**: `ws://your-domain/ws` or `http://your-domain/events`

### Events

#### `event: node_update`
- **Description**: Sent when a node's status changes (or becomes leader).
- **Payload**: A `Node` object.

#### `event: seat_update`
- **Description**: Sent when a seat is booked or released.
- **Payload**: A `Seat` object.

#### `event: new_transaction`
- **Description**: Sent every time a new transaction log is created.
- **Payload**: A `Transaction` object.

#### `event: election_started`
- **Description**: Sent when a leader election process begins.
- **Payload**:
  ```json
  {
    "oldLeaderId": 3,
    "candidates": [1, 2, 4, 5, 6]
  }
  ```

#### `event: election_step`
- **Description**: Sent for each step of the Bully Algorithm to visualize the process.
- **Payload**:
  ```json
  {
    "nodeId": 4,
    "message": "Node 4 sends election message (ID: 4)",
    "type": "election" // 'candidate', 'election', or 'victory'
  }
  ```

#### `event: election_ended`
- **Description**: Sent when a new leader is officially chosen and the cluster state is updated.
- **Payload**: The new `ElectionRecord` object.
