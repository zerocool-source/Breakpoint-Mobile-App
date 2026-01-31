import { Router, Request, Response } from "express";
import express from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

interface LogInteractionBody {
  userId?: string;
  propertyId?: string;
  propertyType?: string;
  userQuery: string;
  suggestedProducts: Array<{ sku: string; name: string; confidence: number }>;
  sessionId: string;
}

interface LogFeedbackBody {
  interactionId: string;
  productSku: string;
  productName: string;
  feedbackType: 'selected' | 'rejected' | 'modified' | 'ignored';
  quantitySelected?: number;
  confidenceScore?: number;
}

interface LogEstimateCompletionBody {
  sessionId: string;
  selectedProducts: Array<{ sku: string; quantity: number }>;
  propertyType?: string;
}

router.post("/log-interaction", express.json(), async (req: Request, res: Response) => {
  try {
    const body: LogInteractionBody = req.body;
    
    const result = await db.execute(sql`
      INSERT INTO ai_learning_interactions 
        (user_id, property_id, property_type, user_query, suggested_products, session_id)
      VALUES 
        (${body.userId || null}, ${body.propertyId || null}, ${body.propertyType || null}, 
         ${body.userQuery}, ${JSON.stringify(body.suggestedProducts)}, ${body.sessionId})
      RETURNING id
    `);
    
    const interactionId = result.rows[0]?.id;
    res.json({ success: true, interactionId });
  } catch (error) {
    console.error("Error logging AI interaction:", error);
    res.status(500).json({ error: "Failed to log interaction" });
  }
});

router.post("/log-feedback", express.json(), async (req: Request, res: Response) => {
  try {
    const body: LogFeedbackBody = req.body;
    
    await db.execute(sql`
      INSERT INTO ai_product_feedback 
        (interaction_id, product_sku, product_name, feedback_type, quantity_selected, confidence_score)
      VALUES 
        (${body.interactionId}, ${body.productSku}, ${body.productName}, 
         ${body.feedbackType}::feedback_type, ${body.quantitySelected || null}, ${body.confidenceScore || null})
    `);

    if (body.feedbackType === 'selected') {
      await db.execute(sql`
        INSERT INTO ai_query_mappings (query_term, mapped_product_sku, success_count, total_count)
        VALUES (
          (SELECT user_query FROM ai_learning_interactions WHERE id = ${body.interactionId}),
          ${body.productSku}, 1, 1
        )
        ON CONFLICT DO NOTHING
      `);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error logging AI feedback:", error);
    res.status(500).json({ error: "Failed to log feedback" });
  }
});

router.post("/log-estimate-completion", express.json(), async (req: Request, res: Response) => {
  try {
    const body: LogEstimateCompletionBody = req.body;
    
    await db.execute(sql`
      UPDATE ai_learning_interactions 
      SET selected_products = ${JSON.stringify(body.selectedProducts)}
      WHERE session_id = ${body.sessionId}
    `);

    const products = body.selectedProducts;
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const primary = products[i];
        const related = products[j];
        
        await db.execute(sql`
          INSERT INTO ai_product_patterns 
            (primary_product_sku, related_product_sku, co_occurrence_count, property_type, avg_quantity_ratio)
          VALUES 
            (${primary.sku}, ${related.sku}, 1, ${body.propertyType || null}, 
             ${related.quantity / (primary.quantity || 1)})
          ON CONFLICT DO NOTHING
        `);
        
        await db.execute(sql`
          UPDATE ai_product_patterns 
          SET co_occurrence_count = co_occurrence_count + 1,
              last_updated = NOW()
          WHERE primary_product_sku = ${primary.sku} 
            AND related_product_sku = ${related.sku}
        `);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error logging estimate completion:", error);
    res.status(500).json({ error: "Failed to log completion" });
  }
});

router.get("/learned-patterns/:productSku", async (req: Request, res: Response) => {
  try {
    const { productSku } = req.params;
    const { propertyType } = req.query;
    
    let result;
    if (propertyType) {
      result = await db.execute(sql`
        SELECT related_product_sku, co_occurrence_count, avg_quantity_ratio
        FROM ai_product_patterns
        WHERE primary_product_sku = ${productSku}
          AND (property_type = ${propertyType} OR property_type IS NULL)
        ORDER BY co_occurrence_count DESC
        LIMIT 5
      `);
    } else {
      result = await db.execute(sql`
        SELECT related_product_sku, co_occurrence_count, avg_quantity_ratio
        FROM ai_product_patterns
        WHERE primary_product_sku = ${productSku}
        ORDER BY co_occurrence_count DESC
        LIMIT 5
      `);
    }
    
    res.json({ patterns: result.rows });
  } catch (error) {
    console.error("Error fetching learned patterns:", error);
    res.status(500).json({ error: "Failed to fetch patterns" });
  }
});

router.get("/query-mappings/:query", async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    
    const result = await db.execute(sql`
      SELECT mapped_product_sku, success_count, total_count,
             (success_count::float / total_count::float) as success_rate
      FROM ai_query_mappings
      WHERE query_term ILIKE ${'%' + query + '%'}
      ORDER BY success_rate DESC, success_count DESC
      LIMIT 10
    `);
    
    res.json({ mappings: result.rows });
  } catch (error) {
    console.error("Error fetching query mappings:", error);
    res.status(500).json({ error: "Failed to fetch mappings" });
  }
});

router.get("/learning-stats", async (_req: Request, res: Response) => {
  try {
    const interactions = await db.execute(sql`
      SELECT COUNT(*) as total FROM ai_learning_interactions
    `);
    
    const feedback = await db.execute(sql`
      SELECT feedback_type, COUNT(*) as count 
      FROM ai_product_feedback 
      GROUP BY feedback_type
    `);
    
    const patterns = await db.execute(sql`
      SELECT COUNT(*) as total, SUM(co_occurrence_count) as total_occurrences
      FROM ai_product_patterns
    `);
    
    const topPatterns = await db.execute(sql`
      SELECT primary_product_sku, related_product_sku, co_occurrence_count
      FROM ai_product_patterns
      ORDER BY co_occurrence_count DESC
      LIMIT 10
    `);
    
    res.json({
      totalInteractions: interactions.rows[0]?.total || 0,
      feedbackBreakdown: feedback.rows,
      patternsCount: patterns.rows[0]?.total || 0,
      totalPatternOccurrences: patterns.rows[0]?.total_occurrences || 0,
      topPatterns: topPatterns.rows,
    });
  } catch (error) {
    console.error("Error fetching learning stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
