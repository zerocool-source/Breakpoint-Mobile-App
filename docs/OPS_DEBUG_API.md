# Breakpoint Commercial Pool Systems - Ops Debug API

## Overview

This document provides complete documentation for the Debug/Monitoring API endpoints. These endpoints enable the Ops app to monitor application health, track performance, and diagnose issues in real-time.

**Base URL:** `/api/debug`

**Authentication:** None required (internal monitoring endpoints)

---

## Quick Reference

| Endpoint | Description | Use Case |
|----------|-------------|----------|
| `GET /health` | Server and database health check | Heartbeat monitoring |
| `GET /metrics` | Server performance metrics | Performance dashboards |
| `GET /database` | Database statistics | Data volume monitoring |
| `GET /external-apis` | External API connectivity | Integration health |
| `GET /users` | User accounts summary | User management |
| `GET /sessions` | Active session monitoring | Login activity |
| `GET /jobs` | Job queue statistics | Work tracking |
| `GET /estimates` | Estimate pipeline stats | Sales pipeline |
| `GET /ai-status` | AI system health | AI feature monitoring |
| `GET /errors` | Recent error log | Error tracking |
| `GET /requests` | Request log with timing | API performance |
| `GET /notifications` | Urgent notifications | Alert monitoring |
| `GET /full-report` | Complete system snapshot | Daily health report |

---

## Detailed Endpoint Documentation

### 1. Health Check

**`GET /api/debug/health`**

Quick health check for the server and database connection. Use this for uptime monitoring and alerts.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-05T06:08:56.297Z",
  "uptime": {
    "ms": 7989,
    "formatted": "7s"
  },
  "database": {
    "connected": true,
    "status": "connected"
  },
  "memory": {
    "heapUsed": "18.94 MB",
    "heapTotal": "22.02 MB",
    "rss": "113.38 MB",
    "external": "2.82 MB"
  },
  "system": {
    "platform": "linux",
    "nodeVersion": "v22.22.0",
    "cpuCount": 8,
    "loadAverage": [6.58, 6.23, 6.17],
    "freeMemory": "20.96 GB",
    "totalMemory": "62.8 GB"
  }
}
```

**Status Values:**
- `healthy` - All systems operational
- `degraded` - Database issues or high load
- `unhealthy` - Critical failure

**Monitoring Alerts:**
- Alert if `status !== "healthy"`
- Alert if `database.connected === false`
- Alert if memory heap usage > 85%

---

### 2. Server Metrics

**`GET /api/debug/metrics`**

Detailed server performance metrics for dashboards and trend analysis.

**Response:**
```json
{
  "timestamp": "2026-02-05T06:09:09.011Z",
  "server": {
    "uptime": {
      "ms": 20703,
      "formatted": "20s"
    },
    "requests": {
      "total": 1523,
      "errors": 12,
      "errorRate": "0.79%"
    }
  },
  "memory": {
    "heapUsed": {
      "bytes": 23739824,
      "formatted": "22.64 MB"
    },
    "heapTotal": {
      "bytes": 26497024,
      "formatted": "25.27 MB"
    },
    "heapUsage": "89.59%",
    "rss": {
      "bytes": 120934400,
      "formatted": "115.33 MB"
    }
  },
  "process": {
    "pid": 6823,
    "nodeVersion": "v22.22.0",
    "platform": "linux",
    "arch": "x64"
  }
}
```

**Key Metrics to Track:**
- `requests.errorRate` - Should be < 1%
- `memory.heapUsage` - Alert if > 90%
- `uptime.ms` - Detect restarts

---

### 3. Database Statistics

**`GET /api/debug/database`**

Complete database table statistics and record counts.

**Response:**
```json
{
  "timestamp": "2026-02-05T06:10:00.000Z",
  "status": "connected",
  "tables": {
    "users": {
      "total": 5,
      "byRole": [
        {"role": "repair_foreman", "count": "1"},
        {"role": "repair_tech", "count": "2"},
        {"role": "service_tech", "count": "1"},
        {"role": "admin", "count": "1"}
      ]
    },
    "properties": {
      "total": 187
    },
    "jobs": {
      "total": 45,
      "byStatus": [
        {"status": "pending", "count": "12"},
        {"status": "in_progress", "count": "8"},
        {"status": "completed", "count": "25"}
      ],
      "byPriority": [
        {"priority": "urgent", "count": "3"},
        {"priority": "high", "count": "7"},
        {"priority": "normal", "count": "35"}
      ]
    },
    "assignments": {
      "total": 156
    },
    "estimates": {
      "total": 18,
      "byStatus": [
        {"status": "draft", "count": "7"},
        {"status": "sent", "count": "4"},
        {"status": "approved", "count": "5"},
        {"status": "rejected", "count": "2"}
      ]
    },
    "sessions": {
      "active": 33
    },
    "estimateTemplates": {
      "total": 12
    },
    "poolRegulations": {
      "total": 9
    },
    "urgentNotifications": {
      "total": 5
    },
    "adminMessages": {
      "total": 23
    }
  }
}
```

**Note:** A value of `-1` or `"table not found"` indicates the table doesn't exist in the database.

---

### 4. External API Health

**`GET /api/debug/external-apis`**

Tests connectivity and configuration status for all external API integrations.

**Response:**
```json
{
  "timestamp": "2026-02-05T06:09:02.738Z",
  "apis": {
    "poolbrain": {
      "status": "connected",
      "statusCode": 200,
      "latency": "245ms",
      "configured": true
    },
    "openai": {
      "status": "connected",
      "statusCode": 200,
      "latency": "125ms",
      "configured": true
    },
    "heritage": {
      "status": "configured",
      "configured": true
    },
    "mobileApi": {
      "status": "configured",
      "configured": true
    }
  }
}
```

**Status Values:**
- `connected` - API responding successfully
- `error` - API call failed
- `configured` - API key present (not actively tested)
- `not_configured` - API key missing

**Monitoring Alerts:**
- Alert if `poolbrain.status === "error"` (product search won't work)
- Alert if `openai.status === "error"` (AI estimates won't work)
- Alert if latency > 2000ms

---

### 5. User Accounts

**`GET /api/debug/users`**

Complete user account listing with role breakdown.

**Response:**
```json
{
  "timestamp": "2026-02-05T06:09:10.000Z",
  "summary": {
    "total": 5,
    "active": 5,
    "inactive": 0,
    "byRole": {
      "service_tech": 1,
      "repair_foreman": 1,
      "repair_tech": 2,
      "admin": 1
    }
  },
  "users": [
    {
      "id": "abc123",
      "email": "repair.foreman@breakpointpools.com",
      "firstName": "Rick",
      "lastName": "Jacobs",
      "role": "repair_foreman",
      "phone": "9513238429",
      "county": "north_county",
      "hourlyRate": "85.00",
      "isActive": true,
      "name": "Rick Jacobs",
      "createdAt": "2026-01-15T00:00:00.000Z"
    }
  ]
}
```

**User Roles:**
- `service_tech` - Service Technician
- `repair_tech` - Repair Technician  
- `repair_foreman` - Repair Foreman (estimate creation)
- `supervisor` - Supervisor (team management)
- `admin` - Administrator

---

### 6. Active Sessions

**`GET /api/debug/sessions`**

Monitor active login sessions and user activity.

**Response:**
```json
{
  "timestamp": "2026-02-05T06:09:15.000Z",
  "summary": {
    "activeSessions": 33,
    "uniqueUsers": 4
  },
  "sessions": [
    {
      "id": "session123",
      "userId": "user456",
      "expiresAt": "2026-02-06T06:09:15.000Z",
      "createdAt": "2026-02-05T06:09:15.000Z",
      "user": {
        "id": "user456",
        "email": "rick@breakpointpools.com",
        "firstName": "Rick",
        "lastName": "Jacobs",
        "role": "repair_foreman"
      },
      "expiresIn": "23h 59m 45s"
    }
  ]
}
```

---

### 7. Job Queue

**`GET /api/debug/jobs`**

Job queue statistics and recent job activity.

**Response:**
```json
{
  "timestamp": "2026-02-05T06:09:20.000Z",
  "summary": {
    "total": 45,
    "pending": 12,
    "inProgress": 8,
    "urgent": 3,
    "byStatus": {
      "pending": 12,
      "in_progress": 8,
      "completed": 25
    },
    "byPriority": {
      "urgent": 3,
      "high": 7,
      "normal": 30,
      "low": 5
    },
    "byType": {
      "approved_repair": 20,
      "assessment": 15,
      "assigned": 10
    }
  },
  "recentJobs": [
    {
      "id": "job123",
      "propertyId": "prop456",
      "assignedToId": "user789",
      "title": "Heater Replacement",
      "description": "Replace faulty heater unit",
      "priority": "high",
      "status": "pending",
      "jobType": "approved_repair",
      "scheduledDate": "2026-02-06T09:00:00.000Z",
      "createdAt": "2026-02-05T06:00:00.000Z"
    }
  ]
}
```

**Job Priorities:**
- `urgent` - Immediate attention required
- `high` - Same-day priority
- `normal` - Standard scheduling
- `low` - Can wait

**Job Types:**
- `approved_repair` - Repair with approved estimate
- `assessment` - Initial assessment needed
- `assigned` - Directly assigned work

---

### 8. Estimate Pipeline

**`GET /api/debug/estimates`**

Estimate creation and approval pipeline statistics.

**Response:**
```json
{
  "timestamp": "2026-02-05T06:09:25.000Z",
  "summary": {
    "total": 18,
    "byStatus": {
      "draft": 7,
      "sent": 4,
      "approved": 5,
      "rejected": 2
    },
    "totalValue": "$45,678.00",
    "approvedValue": "$23,456.00",
    "conversionRate": "27.8%"
  },
  "recentEstimates": [
    {
      "id": "est123",
      "estimateNumber": "EST-2026-0001",
      "propertyId": "prop456",
      "technicianId": "user789",
      "status": "sent",
      "subtotal": "4500.00",
      "tax": "337.50",
      "total": "4837.50",
      "createdAt": "2026-02-05T06:00:00.000Z"
    }
  ]
}
```

**Estimate Statuses:**
- `draft` - Being created
- `sent` - Sent to customer
- `approved` - Customer approved
- `rejected` - Customer declined
- `needs_review` - Requires manager review
- `needs_scheduling` - Approved, needs scheduling
- `scheduled` - Work scheduled
- `ready_to_invoice` - Work complete

---

### 9. AI System Status

**`GET /api/debug/ai-status`**

AI system health and knowledge base statistics.

**Response:**
```json
{
  "timestamp": "2026-02-05T06:09:30.000Z",
  "aiSystem": {
    "openaiConfigured": true,
    "model": "gpt-4o",
    "features": {
      "estimateGeneration": true,
      "voiceTranscription": true,
      "webSearch": true,
      "selfLearning": true
    }
  },
  "knowledgeBase": {
    "estimateTemplates": 12,
    "poolRegulations": 9
  },
  "recentTemplates": [
    {
      "id": "temp123",
      "name": "Heater Replacement",
      "category": "heaters_heat_pumps",
      "isActive": true,
      "updatedAt": "2026-02-01T00:00:00.000Z"
    }
  ]
}
```

**AI Features:**
- `estimateGeneration` - GPT-4o powered estimate creation
- `voiceTranscription` - Whisper voice-to-text
- `webSearch` - Pool Brain product search integration
- `selfLearning` - AI learns from user interactions

---

### 10. Error Log

**`GET /api/debug/errors`**

Recent error log for debugging and issue tracking.

**Query Parameters:**
- `limit` (optional): Number of errors to return (default: 50)

**Response:**
```json
{
  "timestamp": "2026-02-05T06:09:35.000Z",
  "summary": {
    "totalErrors": 12,
    "recentErrorCount": 12
  },
  "recentErrors": [
    {
      "timestamp": "2026-02-05T06:05:00.000Z",
      "error": "Database connection timeout",
      "endpoint": "/api/properties",
      "stack": "Error: Database connection timeout\n    at ..."
    }
  ]
}
```

---

### 11. Request Log

**`GET /api/debug/requests`**

Recent API request log with timing information.

**Query Parameters:**
- `limit` (optional): Number of requests to return (default: 50)

**Response:**
```json
{
  "timestamp": "2026-02-05T06:09:40.000Z",
  "summary": {
    "totalRequests": 1523,
    "recentRequestCount": 100,
    "slowRequests": 3,
    "failedRequests": 5
  },
  "recentRequests": [
    {
      "timestamp": "2026-02-05T06:09:35.000Z",
      "method": "POST",
      "path": "/api/ai-product-search/generate-estimate",
      "statusCode": 200,
      "duration": 2345
    }
  ]
}
```

**Monitoring Alerts:**
- Alert if `slowRequests` count increases rapidly
- Alert if `failedRequests` percentage > 5%

---

### 12. Urgent Notifications

**`GET /api/debug/notifications`**

Monitor urgent notifications sent to technicians.

**Response:**
```json
{
  "timestamp": "2026-02-05T06:09:45.000Z",
  "summary": {
    "total": 5,
    "unread": 2,
    "dismissed": 1
  },
  "notifications": [
    {
      "id": "notif123",
      "title": "Emergency: Pool Leak",
      "message": "Urgent leak detected at Sunrise HOA",
      "type": "urgent",
      "icon": "alert-triangle",
      "targetRole": "repair_foreman",
      "targetUserId": null,
      "propertyId": "prop456",
      "isRead": false,
      "isDismissed": false,
      "createdAt": "2026-02-05T05:30:00.000Z"
    }
  ]
}
```

**Notification Types:**
- `urgent` - Red alert, immediate action
- `warning` - Yellow warning
- `info` - Blue informational

---

### 13. Full System Report

**`GET /api/debug/full-report`**

Comprehensive system snapshot combining all monitoring data. Ideal for daily health reports or incident investigation.

**Response:**
```json
{
  "generatedAt": "2026-02-05T06:10:41.789Z",
  "appName": "Breakpoint Commercial Pool Systems",
  "version": "1.0.0-beta",
  
  "health": {
    "overall": "healthy",
    "database": "connected",
    "server": "running"
  },

  "server": {
    "uptime": "8s",
    "uptimeMs": 8781,
    "memory": {
      "heapUsed": "19.13 MB",
      "heapTotal": "22.02 MB",
      "heapUsage": "86.9%",
      "rss": "106.76 MB"
    },
    "requests": {
      "total": 1523,
      "errors": 12,
      "errorRate": "0.79%"
    },
    "system": {
      "platform": "linux",
      "nodeVersion": "v22.22.0",
      "cpuCount": 8,
      "loadAverage": [5.33, 5.82, 6.02]
    }
  },

  "database": {
    "tables": {
      "users": 5,
      "properties": 187,
      "jobs": 45,
      "estimates": 18,
      "activeSessions": 33,
      "estimateTemplates": 12,
      "urgentNotifications": 5
    },
    "jobsByStatus": [...],
    "estimatesByStatus": [...]
  },

  "externalApis": {
    "openai": {
      "configured": true,
      "model": "gpt-4o"
    },
    "poolbrain": {
      "configured": true,
      "productCount": 2024
    },
    "heritage": {
      "configured": true
    }
  },

  "features": {
    "authentication": {
      "enabled": true,
      "method": "JWT",
      "roles": ["service_tech", "supervisor", "repair_tech", "repair_foreman"]
    },
    "aiEstimates": {
      "enabled": true,
      "voiceInput": true,
      "webSearch": true,
      "selfLearning": true
    },
    "offlineMode": {
      "enabled": true,
      "syncStrategy": "queue-and-sync"
    }
  },

  "recentActivity": {
    "recentErrors": [...],
    "slowRequests": [...]
  }
}
```

---

## Monitoring Best Practices

### 1. Heartbeat Monitoring
Poll `/api/debug/health` every 60 seconds. Alert if:
- `status !== "healthy"`
- Response time > 5 seconds
- Connection refused

### 2. Performance Dashboard
Poll `/api/debug/metrics` every 5 minutes for:
- Memory usage trends
- Request volume
- Error rate tracking

### 3. Daily Health Report
Fetch `/api/debug/full-report` once daily for:
- System snapshot
- Database growth trends
- API integration health

### 4. Error Alerting
Poll `/api/debug/errors` every 5 minutes and alert on:
- New critical errors
- Error spike detection
- Repeated endpoint failures

### 5. Session Monitoring
Poll `/api/debug/sessions` for:
- Active user counts
- Unusual login patterns
- Session cleanup verification

---

## Troubleshooting Guide

### Problem: High Memory Usage
1. Check `/api/debug/metrics` for heap usage
2. Check `/api/debug/requests` for slow requests
3. Consider server restart if > 95% heap

### Problem: Database Connection Issues
1. Check `/api/debug/health` for database status
2. Check `/api/debug/errors` for connection errors
3. Verify DATABASE_URL environment variable

### Problem: AI Estimates Not Working
1. Check `/api/debug/ai-status` for OpenAI configuration
2. Check `/api/debug/external-apis` for OpenAI connectivity
3. Verify AI_INTEGRATIONS_OPENAI_API_KEY is set

### Problem: Product Search Not Working
1. Check `/api/debug/external-apis` for Pool Brain status
2. Verify POOLBRAIN_API_KEY is set
3. Check API latency for timeout issues

### Problem: Jobs Not Appearing
1. Check `/api/debug/jobs` for job counts
2. Verify job status values
3. Check database table existence

---

## Environment Variables

The debug endpoints check these environment variables:

| Variable | Purpose | Required |
|----------|---------|----------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API access | Yes (for AI) |
| `POOLBRAIN_API_KEY` | Pool Brain product search | Yes (for products) |
| `HERITAGE_API_KEY` | Heritage API access | Optional |
| `MOBILE_API_KEY` | Mobile app authentication | Yes |
| `DATABASE_URL` | PostgreSQL connection | Yes |

---

## Security Notes

- These endpoints are for internal monitoring only
- No authentication is currently required
- Consider adding IP whitelist for production
- Do not expose to public internet

---

*Last Updated: February 5, 2026*
*Version: 1.0.0-beta*
