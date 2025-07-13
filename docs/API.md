# ClaMax DTRIS API Documentation

This document provides comprehensive documentation for the ClaMax DTRIS API endpoints.

## Base URL

- **Development**: `http://localhost:3000`
- **Staging**: `https://staging-api.dtris.gov.lr`
- **Production**: `https://api.dtris.gov.lr`

## Authentication

All API endpoints require authentication using Bearer tokens from Supabase Auth.

```http
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "data": {},
  "message": "Success message",
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

Error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Endpoints

### Authentication

#### Sign Up
```http
POST /api/auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "owner",
  "phone": "+231-777-123-456",
  "address": "Monrovia, Liberia"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "owner"
  }
}
```

### Users

#### Get Users
```http
GET /api/users?page=1&pageSize=20&role=owner&search=john
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `role` (optional): Filter by user role
- `search` (optional): Search by name or email

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "phone": "+231-777-123-456",
      "address": "Monrovia, Liberia",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

#### Create User
```http
POST /api/users
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "role": "inspector",
  "phone": "+231-888-234-567",
  "address": "Paynesville, Liberia"
}
```

#### Update User
```http
PUT /api/users?id=uuid
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+231-999-345-678",
  "address": "New Address"
}
```

### Vehicles

#### Get Vehicles
```http
GET /api/vehicles?page=1&pageSize=20&ownerId=uuid&status=active
```

**Query Parameters:**
- `page` (optional): Page number
- `pageSize` (optional): Items per page
- `ownerId` (optional): Filter by owner ID
- `status` (optional): Filter by vehicle status

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "ownerId": "uuid",
      "licensePlate": "LR-2024-001",
      "make": "Toyota",
      "model": "Camry",
      "year": 2020,
      "color": "Blue",
      "vin": "VIN123456789",
      "registrationDate": "2024-01-01T00:00:00Z",
      "expirationDate": "2025-01-01T00:00:00Z",
      "status": "active",
      "barcode": "LR123456789012",
      "documents": [],
      "inspections": []
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

#### Create Vehicle
```http
POST /api/vehicles
```

**Request Body:**
```json
{
  "ownerId": "uuid",
  "licensePlate": "LR-2024-002",
  "make": "Honda",
  "model": "Civic",
  "year": 2021,
  "color": "Red",
  "vin": "VIN987654321",
  "expirationDate": "2025-12-31T23:59:59Z",
  "barcode": "LR987654321098"
}
```

### Inspections

#### Get Inspections
```http
GET /api/inspections?page=1&vehicleId=uuid&inspectorId=uuid&status=pass
```

**Query Parameters:**
- `page` (optional): Page number
- `pageSize` (optional): Items per page
- `vehicleId` (optional): Filter by vehicle ID
- `inspectorId` (optional): Filter by inspector ID
- `status` (optional): Filter by inspection status

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "vehicleId": "uuid",
      "inspectorId": "uuid",
      "inspectorName": "Moses Kargbo",
      "date": "2024-01-15T10:00:00Z",
      "status": "pass",
      "notes": "Vehicle in good condition",
      "violations": [],
      "nextInspectionDue": "2025-01-15T10:00:00Z",
      "location": "Monrovia Inspection Center"
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 20,
  "totalPages": 2
}
```

#### Create Inspection
```http
POST /api/inspections
```

**Request Body:**
```json
{
  "vehicleId": "uuid",
  "inspectorId": "uuid",
  "inspectorName": "Moses Kargbo",
  "status": "pass",
  "notes": "Vehicle passed all safety checks",
  "violations": [],
  "location": "Monrovia Inspection Center"
}
```

### Incidents

#### Get Incidents
```http
GET /api/incidents?page=1&reporterId=uuid&vehicleId=uuid&status=reported&type=accident
```

**Query Parameters:**
- `page` (optional): Page number
- `pageSize` (optional): Items per page
- `reporterId` (optional): Filter by reporter ID
- `vehicleId` (optional): Filter by vehicle ID
- `status` (optional): Filter by incident status
- `type` (optional): Filter by incident type

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "vehicleId": "uuid",
      "reporterId": "uuid",
      "type": "accident",
      "description": "Minor fender bender at intersection",
      "location": "Broad Street & UN Drive",
      "date": "2024-01-20T14:30:00Z",
      "photos": ["url1", "url2"],
      "status": "reported"
    }
  ],
  "total": 15,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

#### Create Incident
```http
POST /api/incidents
```

**Request Body:**
```json
{
  "vehicleId": "uuid",
  "reporterId": "uuid",
  "type": "violation",
  "description": "Vehicle parked in no-parking zone",
  "location": "Capitol Hill",
  "photos": ["photo_url"]
}
```

#### Update Incident
```http
PUT /api/incidents?id=uuid
```

**Request Body:**
```json
{
  "status": "investigating",
  "notes": "Investigation started"
}
```

### Announcements

#### Get Announcements
```http
GET /api/announcements?page=1&targetRole=owner&priority=high
```

**Query Parameters:**
- `page` (optional): Page number
- `pageSize` (optional): Items per page
- `targetRole` (optional): Filter by target role
- `priority` (optional): Filter by priority level

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "System Maintenance Notice",
      "content": "The system will be under maintenance on...",
      "date": "2024-01-25T09:00:00Z",
      "priority": "high",
      "targetRole": null
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

#### Create Announcement
```http
POST /api/announcements
```

**Request Body:**
```json
{
  "title": "New Feature Release",
  "content": "We're excited to announce new features...",
  "priority": "medium",
  "targetRole": "owner"
}
```

### Payments

#### Get Payments
```http
GET /api/payments?page=1&userId=uuid&vehicleId=uuid&status=completed&type=registration
```

**Query Parameters:**
- `page` (optional): Page number
- `pageSize` (optional): Items per page
- `userId` (optional): Filter by user ID
- `vehicleId` (optional): Filter by vehicle ID
- `status` (optional): Filter by payment status
- `type` (optional): Filter by payment type

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "vehicleId": "uuid",
      "amount": 50.00,
      "type": "registration",
      "status": "completed",
      "date": "2024-01-30T12:00:00Z",
      "description": "Vehicle registration renewal",
      "transactionId": "txn_123456"
    }
  ],
  "total": 30,
  "page": 1,
  "pageSize": 20,
  "totalPages": 2
}
```

#### Process Payment
```http
POST /api/payments
```

**Request Body:**
```json
{
  "userId": "uuid",
  "vehicleId": "uuid",
  "amount": 50.00,
  "type": "registration",
  "description": "Vehicle registration renewal for LR-2024-001"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication token required |
| `INVALID_TOKEN` | Invalid or expired token |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Internal server error |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

All list endpoints support pagination:

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

## Filtering and Searching

Most endpoints support filtering and searching:

- Use query parameters for filtering
- Use `search` parameter for text search
- Combine multiple filters with `&`

Example:
```http
GET /api/vehicles?status=active&make=Toyota&search=camry
```

## Webhooks

The API supports webhooks for real-time notifications:

### Webhook Events

- `vehicle.created`
- `vehicle.updated`
- `inspection.completed`
- `incident.reported`
- `payment.completed`

### Webhook Payload

```json
{
  "event": "vehicle.created",
  "data": {
    "id": "uuid",
    "licensePlate": "LR-2024-001",
    ...
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

class DTRISClient {
  constructor(private supabase: SupabaseClient) {}

  async getVehicles(options?: {
    page?: number;
    pageSize?: number;
    ownerId?: string;
  }) {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .range(
        (options?.page || 1 - 1) * (options?.pageSize || 20),
        (options?.page || 1) * (options?.pageSize || 20) - 1
      );

    if (error) throw error;
    return data;
  }
}
```

### cURL Examples

```bash
# Get vehicles
curl -X GET "https://api.dtris.gov.lr/api/vehicles" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Create vehicle
curl -X POST "https://api.dtris.gov.lr/api/vehicles" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "LR-2024-001",
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "color": "Blue",
    "vin": "VIN123456789"
  }'
```

## Support

For API support, contact:
- **Email**: api-support@dtris.gov.lr
- **Documentation**: https://docs.dtris.gov.lr
- **Status Page**: https://status.dtris.gov.lr