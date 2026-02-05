import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users, properties, jobs, assignments, estimates, sessions, estimateTemplates, poolRegulations, urgentNotifications, adminMessages, repairHistory } from '@shared/schema';
import { eq, sql, desc, and, gte, lte, count } from 'drizzle-orm';
import os from 'os';

const router = Router();

const startTime = Date.now();
let requestCount = 0;
let errorCount = 0;
const recentErrors: Array<{ timestamp: string; error: string; endpoint: string; stack?: string }> = [];
const recentRequests: Array<{ timestamp: string; method: string; path: string; statusCode: number; duration: number }> = [];
const MAX_RECENT_ITEMS = 100;

export function trackRequest(method: string, path: string, statusCode: number, duration: number) {
  requestCount++;
  if (statusCode >= 400) errorCount++;
  recentRequests.unshift({
    timestamp: new Date().toISOString(),
    method,
    path,
    statusCode,
    duration
  });
  if (recentRequests.length > MAX_RECENT_ITEMS) recentRequests.pop();
}

export function trackError(error: string, endpoint: string, stack?: string) {
  errorCount++;
  recentErrors.unshift({
    timestamp: new Date().toISOString(),
    error,
    endpoint,
    stack
  });
  if (recentErrors.length > MAX_RECENT_ITEMS) recentErrors.pop();
}

router.get('/health', async (req: Request, res: Response) => {
  try {
    const dbCheck = await db.execute(sql`SELECT 1 as ok`);
    const dbConnected = dbCheck.rows.length > 0;
    
    const memoryUsage = process.memoryUsage();
    const uptime = Date.now() - startTime;
    
    res.json({
      status: dbConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: {
        ms: uptime,
        formatted: formatUptime(uptime)
      },
      database: {
        connected: dbConnected,
        status: dbConnected ? 'connected' : 'disconnected'
      },
      memory: {
        heapUsed: formatBytes(memoryUsage.heapUsed),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        rss: formatBytes(memoryUsage.rss),
        external: formatBytes(memoryUsage.external)
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        cpuCount: os.cpus().length,
        loadAverage: os.loadavg(),
        freeMemory: formatBytes(os.freemem()),
        totalMemory: formatBytes(os.totalmem())
      }
    });
  } catch (error) {
    trackError('Health check failed', '/api/debug/health', (error as Error).stack);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const uptime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage();
    
    res.json({
      timestamp: new Date().toISOString(),
      server: {
        uptime: {
          ms: uptime,
          formatted: formatUptime(uptime)
        },
        requests: {
          total: requestCount,
          errors: errorCount,
          errorRate: requestCount > 0 ? ((errorCount / requestCount) * 100).toFixed(2) + '%' : '0%'
        }
      },
      memory: {
        heapUsed: {
          bytes: memoryUsage.heapUsed,
          formatted: formatBytes(memoryUsage.heapUsed)
        },
        heapTotal: {
          bytes: memoryUsage.heapTotal,
          formatted: formatBytes(memoryUsage.heapTotal)
        },
        heapUsage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2) + '%',
        rss: {
          bytes: memoryUsage.rss,
          formatted: formatBytes(memoryUsage.rss)
        }
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });
  } catch (error) {
    trackError('Metrics fetch failed', '/api/debug/metrics', (error as Error).stack);
    res.status(500).json({ error: (error as Error).message });
  }
});

async function safeCount(table: any): Promise<number> {
  try {
    const result = await db.select({ count: count() }).from(table);
    return result[0]?.count || 0;
  } catch {
    return -1;
  }
}

async function safeQuery(query: any): Promise<any[]> {
  try {
    const result = await db.execute(query);
    return result.rows;
  } catch {
    return [];
  }
}

router.get('/database', async (req: Request, res: Response) => {
  try {
    const [
      userCount,
      propertyCount,
      jobCount,
      assignmentCount,
      estimateCount,
      sessionCount,
      templateCount,
      regulationCount,
      notificationCount,
      adminMessageCount
    ] = await Promise.all([
      safeCount(users),
      safeCount(properties),
      safeCount(jobs),
      safeCount(assignments),
      safeCount(estimates),
      safeCount(sessions),
      safeCount(estimateTemplates),
      safeCount(poolRegulations),
      safeCount(urgentNotifications),
      safeCount(adminMessages)
    ]);

    const jobsByStatus = await safeQuery(sql`
      SELECT status, COUNT(*) as count 
      FROM jobs 
      GROUP BY status
    `);

    const jobsByPriority = await safeQuery(sql`
      SELECT priority, COUNT(*) as count 
      FROM jobs 
      GROUP BY priority
    `);

    const estimatesByStatus = await safeQuery(sql`
      SELECT status, COUNT(*) as count 
      FROM estimates 
      GROUP BY status
    `);

    const usersByRole = await safeQuery(sql`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    res.json({
      timestamp: new Date().toISOString(),
      status: 'connected',
      tables: {
        users: {
          total: userCount[0]?.count || 0,
          byRole: usersByRole.rows
        },
        properties: {
          total: propertyCount[0]?.count || 0
        },
        jobs: {
          total: jobCount[0]?.count || 0,
          byStatus: jobsByStatus.rows,
          byPriority: jobsByPriority.rows
        },
        assignments: {
          total: assignmentCount[0]?.count || 0
        },
        estimates: {
          total: estimateCount[0]?.count || 0,
          byStatus: estimatesByStatus.rows
        },
        sessions: {
          active: sessionCount[0]?.count || 0
        },
        estimateTemplates: {
          total: templateCount[0]?.count || 0
        },
        poolRegulations: {
          total: regulationCount[0]?.count || 0
        },
        urgentNotifications: {
          total: notificationCount[0]?.count || 0
        },
        adminMessages: {
          total: adminMessageCount[0]?.count || 0
        }
      }
    });
  } catch (error) {
    trackError('Database stats failed', '/api/debug/database', (error as Error).stack);
    res.status(500).json({ 
      status: 'error',
      error: (error as Error).message 
    });
  }
});

router.get('/external-apis', async (req: Request, res: Response) => {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    apis: {}
  };

  const poolbrainApiKey = process.env.POOLBRAIN_API_KEY;
  if (poolbrainApiKey) {
    try {
      const startTime = Date.now();
      const response = await fetch('https://api.poolbrain.app/v2/inventory/items?page=1&per_page=1', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': poolbrainApiKey
        }
      });
      const latency = Date.now() - startTime;
      
      results.apis.poolbrain = {
        status: response.ok ? 'connected' : 'error',
        statusCode: response.status,
        latency: `${latency}ms`,
        configured: true
      };
    } catch (error) {
      results.apis.poolbrain = {
        status: 'error',
        error: (error as Error).message,
        configured: true
      };
    }
  } else {
    results.apis.poolbrain = {
      status: 'not_configured',
      configured: false
    };
  }

  const openaiApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (openaiApiKey) {
    try {
      const startTime = Date.now();
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        }
      });
      const latency = Date.now() - startTime;
      
      results.apis.openai = {
        status: response.ok ? 'connected' : 'error',
        statusCode: response.status,
        latency: `${latency}ms`,
        configured: true
      };
    } catch (error) {
      results.apis.openai = {
        status: 'error',
        error: (error as Error).message,
        configured: true
      };
    }
  } else {
    results.apis.openai = {
      status: 'not_configured',
      configured: false
    };
  }

  const heritageApiKey = process.env.HERITAGE_API_KEY;
  results.apis.heritage = {
    status: heritageApiKey ? 'configured' : 'not_configured',
    configured: !!heritageApiKey
  };

  const mobileApiKey = process.env.MOBILE_API_KEY;
  results.apis.mobileApi = {
    status: mobileApiKey ? 'configured' : 'not_configured',
    configured: !!mobileApiKey
  };

  res.json(results);
});

router.get('/users', async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      phone: users.phone,
      county: users.county,
      hourlyRate: users.hourlyRate,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).orderBy(desc(users.createdAt));

    const activeUsers = allUsers.filter(u => u.isActive);
    const inactiveUsers = allUsers.filter(u => !u.isActive);

    const roleBreakdown: Record<string, number> = {};
    allUsers.forEach(u => {
      roleBreakdown[u.role] = (roleBreakdown[u.role] || 0) + 1;
    });

    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        total: allUsers.length,
        active: activeUsers.length,
        inactive: inactiveUsers.length,
        byRole: roleBreakdown
      },
      users: allUsers.map(u => ({
        ...u,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown'
      }))
    });
  } catch (error) {
    trackError('Users fetch failed', '/api/debug/users', (error as Error).stack);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const activeSessions = await db.select({
      id: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
      createdAt: sessions.createdAt
    })
    .from(sessions)
    .where(gte(sessions.expiresAt, now))
    .orderBy(desc(sessions.createdAt));

    const userIds = [...new Set(activeSessions.map(s => s.userId))];
    const sessionUsers = userIds.length > 0 
      ? await db.select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role
        })
        .from(users)
        .where(sql`${users.id} = ANY(${userIds})`)
      : [];

    const userMap = new Map(sessionUsers.map(u => [u.id, u]));

    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        activeSessions: activeSessions.length,
        uniqueUsers: userIds.length
      },
      sessions: activeSessions.map(s => ({
        ...s,
        user: userMap.get(s.userId) || null,
        expiresIn: formatUptime(new Date(s.expiresAt).getTime() - now.getTime())
      }))
    });
  } catch (error) {
    trackError('Sessions fetch failed', '/api/debug/sessions', (error as Error).stack);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const allJobs = await db.select({
      id: jobs.id,
      propertyId: jobs.propertyId,
      assignedToId: jobs.assignedToId,
      title: jobs.title,
      description: jobs.description,
      priority: jobs.priority,
      status: jobs.status,
      jobType: jobs.jobType,
      scheduledDate: jobs.scheduledDate,
      scheduledTime: jobs.scheduledTime,
      estimatedCost: jobs.estimatedCost,
      completedAt: jobs.completedAt,
      createdAt: jobs.createdAt
    }).from(jobs).orderBy(desc(jobs.createdAt)).limit(100);

    const statusBreakdown: Record<string, number> = {};
    const priorityBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};

    allJobs.forEach(j => {
      statusBreakdown[j.status] = (statusBreakdown[j.status] || 0) + 1;
      priorityBreakdown[j.priority] = (priorityBreakdown[j.priority] || 0) + 1;
      typeBreakdown[j.jobType || 'unknown'] = (typeBreakdown[j.jobType || 'unknown'] || 0) + 1;
    });

    const pendingJobs = allJobs.filter(j => j.status === 'pending');
    const inProgressJobs = allJobs.filter(j => j.status === 'in_progress');
    const urgentJobs = allJobs.filter(j => j.priority === 'urgent' || j.priority === 'high');

    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        total: allJobs.length,
        pending: pendingJobs.length,
        inProgress: inProgressJobs.length,
        urgent: urgentJobs.length,
        byStatus: statusBreakdown,
        byPriority: priorityBreakdown,
        byType: typeBreakdown
      },
      recentJobs: allJobs.slice(0, 20)
    });
  } catch (error) {
    trackError('Jobs fetch failed', '/api/debug/jobs', (error as Error).stack);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/estimates', async (req: Request, res: Response) => {
  try {
    const allEstimates = await db.select({
      id: estimates.id,
      estimateNumber: estimates.estimateNumber,
      propertyId: estimates.propertyId,
      technicianId: estimates.technicianId,
      status: estimates.status,
      subtotal: estimates.subtotal,
      tax: estimates.tax,
      total: estimates.total,
      createdAt: estimates.createdAt,
      updatedAt: estimates.updatedAt
    }).from(estimates).orderBy(desc(estimates.createdAt)).limit(100);

    const statusBreakdown: Record<string, number> = {};
    let totalValue = 0;
    let approvedValue = 0;

    allEstimates.forEach(e => {
      statusBreakdown[e.status] = (statusBreakdown[e.status] || 0) + 1;
      const value = parseFloat(e.total) || 0;
      totalValue += value;
      if (e.status === 'approved') approvedValue += value;
    });

    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        total: allEstimates.length,
        byStatus: statusBreakdown,
        totalValue: `$${totalValue.toFixed(2)}`,
        approvedValue: `$${approvedValue.toFixed(2)}`,
        conversionRate: allEstimates.length > 0 
          ? `${((statusBreakdown['approved'] || 0) / allEstimates.length * 100).toFixed(1)}%`
          : '0%'
      },
      recentEstimates: allEstimates.slice(0, 20)
    });
  } catch (error) {
    trackError('Estimates fetch failed', '/api/debug/estimates', (error as Error).stack);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/ai-status', async (req: Request, res: Response) => {
  try {
    const [templateCount, regulationCount] = await Promise.all([
      safeCount(estimateTemplates),
      safeCount(poolRegulations)
    ]);

    let recentTemplates: any[] = [];
    try {
      recentTemplates = await db.select({
        id: estimateTemplates.id,
        name: estimateTemplates.name,
        category: estimateTemplates.category,
        isActive: estimateTemplates.isActive,
        updatedAt: estimateTemplates.updatedAt
      }).from(estimateTemplates).orderBy(desc(estimateTemplates.updatedAt)).limit(10);
    } catch {
      recentTemplates = [];
    }

    const openaiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    res.json({
      timestamp: new Date().toISOString(),
      aiSystem: {
        openaiConfigured: !!openaiKey,
        model: 'gpt-4o',
        features: {
          estimateGeneration: true,
          voiceTranscription: true,
          webSearch: true,
          selfLearning: true
        }
      },
      knowledgeBase: {
        estimateTemplates: templateCount >= 0 ? templateCount : 'table not found',
        poolRegulations: regulationCount >= 0 ? regulationCount : 'table not found'
      },
      recentTemplates
    });
  } catch (error) {
    trackError('AI status failed', '/api/debug/ai-status', (error as Error).stack);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/errors', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  
  res.json({
    timestamp: new Date().toISOString(),
    summary: {
      totalErrors: errorCount,
      recentErrorCount: recentErrors.length
    },
    recentErrors: recentErrors.slice(0, limit)
  });
});

router.get('/requests', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  
  const slowRequests = recentRequests.filter(r => r.duration > 1000);
  const failedRequests = recentRequests.filter(r => r.statusCode >= 400);
  
  res.json({
    timestamp: new Date().toISOString(),
    summary: {
      totalRequests: requestCount,
      recentRequestCount: recentRequests.length,
      slowRequests: slowRequests.length,
      failedRequests: failedRequests.length
    },
    recentRequests: recentRequests.slice(0, limit)
  });
});

router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const notifications = await db.select()
      .from(urgentNotifications)
      .orderBy(desc(urgentNotifications.createdAt))
      .limit(50);

    const unread = notifications.filter(n => !n.isRead);
    const dismissed = notifications.filter(n => n.isDismissed);

    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        total: notifications.length,
        unread: unread.length,
        dismissed: dismissed.length
      },
      notifications
    });
  } catch (error) {
    trackError('Notifications fetch failed', '/api/debug/notifications', (error as Error).stack);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/full-report', async (req: Request, res: Response) => {
  try {
    const dbCheck = await db.execute(sql`SELECT 1 as ok`);
    const memoryUsage = process.memoryUsage();
    const uptime = Date.now() - startTime;

    const [
      userCount,
      propertyCount,
      jobCount,
      estimateCount,
      sessionCount,
      templateCount,
      notificationCount
    ] = await Promise.all([
      safeCount(users),
      safeCount(properties),
      safeCount(jobs),
      safeCount(estimates),
      safeCount(sessions),
      safeCount(estimateTemplates),
      safeCount(urgentNotifications)
    ]);

    const jobsByStatus = await safeQuery(sql`
      SELECT status, COUNT(*) as count FROM jobs GROUP BY status
    `);
    const estimatesByStatus = await safeQuery(sql`
      SELECT status, COUNT(*) as count FROM estimates GROUP BY status
    `);

    const openaiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const poolbrainKey = process.env.POOLBRAIN_API_KEY;

    res.json({
      generatedAt: new Date().toISOString(),
      appName: 'Breakpoint Commercial Pool Systems',
      version: '1.0.0-beta',
      
      health: {
        overall: dbCheck.rows.length > 0 ? 'healthy' : 'degraded',
        database: dbCheck.rows.length > 0 ? 'connected' : 'disconnected',
        server: 'running'
      },

      server: {
        uptime: formatUptime(uptime),
        uptimeMs: uptime,
        memory: {
          heapUsed: formatBytes(memoryUsage.heapUsed),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(1) + '%',
          rss: formatBytes(memoryUsage.rss)
        },
        requests: {
          total: requestCount,
          errors: errorCount,
          errorRate: requestCount > 0 ? ((errorCount / requestCount) * 100).toFixed(2) + '%' : '0%'
        },
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          cpuCount: os.cpus().length,
          loadAverage: os.loadavg()
        }
      },

      database: {
        tables: {
          users: userCount >= 0 ? userCount : 'table not found',
          properties: propertyCount >= 0 ? propertyCount : 'table not found',
          jobs: jobCount >= 0 ? jobCount : 'table not found',
          estimates: estimateCount >= 0 ? estimateCount : 'table not found',
          activeSessions: sessionCount >= 0 ? sessionCount : 'table not found',
          estimateTemplates: templateCount >= 0 ? templateCount : 'table not found',
          urgentNotifications: notificationCount >= 0 ? notificationCount : 'table not found'
        },
        jobsByStatus: jobsByStatus,
        estimatesByStatus: estimatesByStatus
      },

      externalApis: {
        openai: {
          configured: !!openaiKey,
          model: 'gpt-4o'
        },
        poolbrain: {
          configured: !!poolbrainKey,
          productCount: 2024
        },
        heritage: {
          configured: !!process.env.HERITAGE_API_KEY
        }
      },

      features: {
        authentication: {
          enabled: true,
          method: 'JWT',
          roles: ['service_tech', 'supervisor', 'repair_tech', 'repair_foreman']
        },
        aiEstimates: {
          enabled: !!openaiKey,
          voiceInput: true,
          webSearch: !!poolbrainKey,
          selfLearning: true
        },
        offlineMode: {
          enabled: true,
          syncStrategy: 'queue-and-sync'
        }
      },

      recentActivity: {
        recentErrors: recentErrors.slice(0, 5),
        slowRequests: recentRequests.filter(r => r.duration > 1000).slice(0, 5)
      }
    });
  } catch (error) {
    trackError('Full report failed', '/api/debug/full-report', (error as Error).stack);
    res.status(500).json({ error: (error as Error).message });
  }
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export default router;
