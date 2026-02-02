import { Router } from "express";
import { db } from "../db";
import { poolRegulations } from "@shared/schema";
import { eq, ilike, or, and } from "drizzle-orm";
import { authMiddleware, AuthenticatedRequest } from "../auth";

const router = Router();

const poolCodeData = [
  {
    codeSection: "116064.2",
    title: "Anti-Entrapment Devices and Systems",
    category: "anti_entrapment" as const,
    summary: "All public swimming pools must be equipped with anti-entrapment devices to prevent physical entrapment at suction outlets.",
    fullText: "Every public swimming pool shall be equipped with antientrapment devices or systems that comply with the ANSI/APSP-16 performance standard. A public swimming pool that has a suction outlet in any location other than on the bottom of the pool shall be designed so that the recirculation system shall have the capacity to provide a complete turnover of pool water within specified time limits.",
    hoaFriendlyExplanation: "California law requires all pool drains to have special safety covers that prevent swimmers from getting stuck. These anti-entrapment drain covers are mandatory to protect residents, especially children, from dangerous suction forces. Without these safety devices, pools can be cited as a public health hazard and may be required to close until the issue is resolved.",
    relatedProducts: "Main Drain Cover,Anti-Vortex Drain Cover,Suction Outlet Cover,VGB Compliant Drain,Safety Vacuum Release System",
    sourceDocument: "California Health and Safety Code Section 116064.2"
  },
  {
    codeSection: "65529",
    title: "Public Pool Disinfection Requirements",
    category: "disinfection" as const,
    summary: "Public pools must be continuously disinfected with minimum chlorine levels of 1.0-3.0 ppm depending on pool type.",
    fullText: "Public pools, when open or in use, shall be disinfected continuously by a chemical that imparts a disinfectant at concentrations consistent with requirements. Minimum free-chlorine residual is 1.0 ppm for pools without CYA, 2.0 ppm with CYA, and 3.0 ppm for spas, wading pools, and spray grounds.",
    hoaFriendlyExplanation: "State regulations require your pool to maintain specific chlorine levels at all times to keep the water safe for residents. Proper disinfection equipment ensures your pool stays compliant with health codes and prevents waterborne illnesses. Without functioning chemical feeders, your pool cannot maintain the required sanitizer levels and may be shut down by the health department.",
    relatedProducts: "Chemical Feeder,Chlorinator,Salt Cell,Chemical Controller,ORP Controller,Erosion Feeder",
    sourceDocument: "California Code of Regulations Title 22 Section 65529"
  },
  {
    codeSection: "3124B",
    title: "Turnover Time Requirements",
    category: "turnover_time" as const,
    summary: "Pool recirculation systems must turn over all pool water within specific time limits based on pool type.",
    fullText: "The recirculation system shall have the capacity to provide a complete turnover of pool water in: One-half hour or less for a spa pool; One-half hour or less for a spray ground; One hour or less for a wading pool; Two hours or less for a medical pool; Six hours or less for all other types of public pools.",
    hoaFriendlyExplanation: "California building codes require that all the water in your pool passes through the filter and sanitation system within a specific timeframe. For standard pools, this is every 6 hours. If your pump or motor cannot achieve this, the water won't be properly filtered and sanitized, which can lead to cloudy water, algae growth, and health code violations.",
    relatedProducts: "Pool Pump,Pool Motor,Variable Speed Pump,Pump Impeller,Pump Seal,Motor Bearings",
    sourceDocument: "California Building Code Section 3124B"
  },
  {
    codeSection: "3128B-3132B",
    title: "Filter Requirements",
    category: "filters" as const,
    summary: "Pool filters must be properly sized and maintained to ensure water clarity and safety.",
    fullText: "Filters shall be designed, operated and maintained to produce clear pool water at all times. Filter area shall be based on turnover rates and manufacturer specifications. Filters must be backwashed or cleaned when pressure differential indicates need.",
    hoaFriendlyExplanation: "Pool filters are required by state code to keep your water crystal clear so lifeguards and residents can see the pool bottom at all times. A failing or undersized filter cannot properly remove contaminants, leading to cloudy water that violates health and safety codes. The law requires the pool bottom to be visible from the deck - if it's not, the pool must be closed.",
    relatedProducts: "Filter Cartridge,DE Filter Grid,Sand Filter,Filter Valve,Multiport Valve,Filter Tank,Backwash Valve",
    sourceDocument: "California Building Code Sections 3128B-3132B"
  },
  {
    codeSection: "65525",
    title: "Recirculation and Water Treatment System Operation",
    category: "pumps_equipment" as const,
    summary: "Pool operators must operate pumps, filters, and all water treatment equipment whenever the pool is available for use.",
    fullText: "The pool operator shall operate pumps, filters, disinfectant and chemical feeders, flow indicators, gauges, recirculation systems, disinfection systems, and all parts of the water treatment system whenever the public pool is available for use, and at such additional times as may be necessary to maintain clean pool water, clear pool water, and disinfection standards.",
    hoaFriendlyExplanation: "State regulations require that all pool equipment - pumps, filters, and chemical systems - must be running whenever residents can use the pool. This isn't optional; it's the law. A broken pump means the pool cannot operate legally because water cannot be properly circulated and sanitized. Your residents' health and safety depend on having functional equipment.",
    relatedProducts: "Pool Pump,Variable Speed Pump,Pool Motor,Pump Impeller,Pump Seal,Motor Capacitor,Pump Strainer",
    sourceDocument: "California Code of Regulations Title 22 Section 65525"
  },
  {
    codeSection: "65527",
    title: "Water Clarity Requirements",
    category: "water_quality" as const,
    summary: "Pool water must be clear enough to see the bottom at maximum depth from the deck.",
    fullText: "The pool operator shall maintain clear pool water while the public pool is in use. The pool operator shall close the public pool if the bottom of the pool at the maximum depth is not clearly visible from the deck. The pool operator shall not reopen the public pool for use until the pool water is clean and clear.",
    hoaFriendlyExplanation: "California law is very specific: if you cannot see the pool bottom clearly from the deck, the pool MUST be closed immediately. This is a critical safety requirement - lifeguards and residents need to see if someone is in distress underwater. Cloudy water is not just unsightly; it's a legal violation that requires immediate closure until resolved.",
    relatedProducts: "Filter Cartridge,DE Filter,Clarifier,Pool Filter,Pump Motor,Variable Speed Pump",
    sourceDocument: "California Code of Regulations Title 22 Section 65527"
  },
  {
    codeSection: "3115B",
    title: "Pool Lighting Requirements",
    category: "lighting" as const,
    summary: "Pools used at night must have underwater and deck lighting for safety observation.",
    fullText: "Pools shall have underwater and deck lighting such that lifeguards or other persons may observe, without interference from direct and reflected glare, every part of the underwater area and pool surface. If underwater or deck surface lighting is not operational, the operator shall secure the pool area and not permit any use of the pool after dark.",
    hoaFriendlyExplanation: "If your pool can be used in the evening, California code requires working underwater and deck lights so anyone can see the entire pool bottom and surface. Without functional pool lighting, you cannot allow evening or nighttime pool use - the pool must be closed after dark. This is a safety requirement so residents can see if someone needs help.",
    relatedProducts: "LED Pool Light,Pool Light Fixture,Light Niche,Light Transformer,GFCI,Light Lens,Light Gasket",
    sourceDocument: "California Building Code Section 3115B"
  },
  {
    codeSection: "116049",
    title: "Ground-Fault Circuit Interrupter Requirements",
    category: "safety_equipment" as const,
    summary: "All pool light fixtures must be protected by GFCI and have encapsulated terminals.",
    fullText: "All dry-niche light fixtures, and all underwater wet-niche light fixtures operating at more than 15 volts in public swimming pools shall be protected by a ground-fault circuit interrupter in the branch circuit, and all light fixtures shall have encapsulated terminals.",
    hoaFriendlyExplanation: "For electrical safety, California law requires all pool lights to be protected by special GFCI breakers that instantly shut off power if there's any electrical fault. This prevents electrocution hazards. If your pool lights lack proper GFCI protection or have damaged wiring, this creates a serious safety hazard that must be addressed immediately to protect residents.",
    relatedProducts: "GFCI Breaker,Pool Light GFCI,Light Junction Box,Light Cord,Wet Niche Light,Light Transformer",
    sourceDocument: "California Health and Safety Code Section 116049"
  },
  {
    codeSection: "3119B",
    title: "Pool Enclosure Requirements",
    category: "enclosure_fencing" as const,
    summary: "Pools must be enclosed by fencing at least 5 feet high with self-closing, self-latching gates.",
    fullText: "The pool shall be enclosed by fence, portion of building, wall, or other approved enclosure with minimum effective perpendicular height of 5 feet. Gates and doors shall be equipped with self-closing and self-latching devices. Openings shall not allow passage of a 4-inch diameter sphere.",
    hoaFriendlyExplanation: "California requires all commercial pools to have secure fencing that prevents unauthorized access, especially by small children. The fence must be at least 5 feet tall with self-closing and self-latching gates. If your pool enclosure is damaged, gates don't latch properly, or there are gaps where children could enter, this is a serious code violation that must be fixed to protect your community.",
    relatedProducts: "Pool Gate Latch,Self-Closing Hinge,Gate Spring,Pool Fence,Safety Gate Hardware",
    sourceDocument: "California Building Code Section 3119B"
  },
  {
    codeSection: "65540",
    title: "Safety and First Aid Equipment",
    category: "safety_equipment" as const,
    summary: "Pools must have life rings, rescue poles, and first aid equipment available at all times.",
    fullText: "The pool operator shall ensure safety and first aid equipment is provided and maintained readily visible and available at all times including: 17-inch minimum life ring with attached throw rope, 12-foot minimum rescue pole with body hook. For lifeguarded pools: first aid kit, operating telephone, backboard and head immobilizer.",
    hoaFriendlyExplanation: "California requires every pool to have specific safety equipment available and in working condition at all times. This includes a life ring with rope and a rescue pole - these save lives in emergencies. Missing or damaged safety equipment means your pool is not compliant with state law and could result in citations or liability issues if there's an incident.",
    relatedProducts: "Life Ring,Rescue Pole,Body Hook,Throw Rope,Pool Safety Equipment,First Aid Kit",
    sourceDocument: "California Code of Regulations Title 22 Section 65540"
  },
  {
    codeSection: "65530",
    title: "Pool Water Temperature and pH",
    category: "water_quality" as const,
    summary: "Pool water must maintain pH between 7.2-7.8 and temperature not exceeding 104°F.",
    fullText: "The pool operator shall maintain public pool water characteristics within the following ranges: pH minimum 7.2 maximum 7.8; Pool Water Temperature maximum 104°F. For cyanuric acid: minimum 0.0 ppm maximum 100.0 ppm.",
    hoaFriendlyExplanation: "State regulations require your pool water to stay within specific pH and temperature ranges. Water that's too acidic or too alkaline can irritate swimmers' eyes and skin, and prevents sanitizers from working effectively. If your heater thermostat is broken or chemical automation isn't working, your pool may fall out of compliance and need to close.",
    relatedProducts: "Pool Heater,Heat Pump,Heater Thermostat,Chemical Controller,pH Controller,Temperature Sensor,Chemical Feeder",
    sourceDocument: "California Code of Regulations Title 22 Section 65530"
  },
  {
    codeSection: "3120B",
    title: "Required Pool Signage",
    category: "signage" as const,
    summary: "Pools must display specific signs including capacity, no diving, emergency numbers, and spa warnings.",
    fullText: "Required signs include: pool user capacity sign, NO DIVING signs for pools 6 feet or less, NO LIFEGUARD ON DUTY sign, CPR diagram, emergency telephone 911, spa warning signs, emergency shut off signs, and diarrhea warning signs.",
    hoaFriendlyExplanation: "California law requires specific safety signs at every commercial pool. These include maximum capacity, emergency phone numbers, spa warnings, and CPR instructions. Missing or illegible signs are code violations. Proper signage protects your residents by providing critical safety information and protects your HOA from liability.",
    relatedProducts: "Pool Signs,No Diving Sign,Pool Rules Sign,Emergency Sign,CPR Sign,Spa Warning Sign",
    sourceDocument: "California Building Code Section 3120B"
  },
  {
    codeSection: "65535",
    title: "Pool Site Maintenance",
    category: "general_maintenance" as const,
    summary: "All parts of the pool site must be well-maintained including equipment, decks, and facilities.",
    fullText: "The pool operator shall keep all parts of the public pool site well-maintained, including, but not limited to, the public pools, water treatment systems, ancillary facilities, signs, showers, toilets, dressing facilities, drinking fountains, diaper-changing stations, floors, walls, partitions, doors, and lockers.",
    hoaFriendlyExplanation: "State regulations require that your entire pool area - not just the pool itself - be properly maintained. This includes the deck, equipment, showers, and all facilities. Cracked decks, broken showers, or malfunctioning equipment are all violations that can result in citations. Regular maintenance keeps your pool compliant and safe for residents.",
    relatedProducts: "Deck Drain,Pool Tile,Coping,Deck Equipment,Pool Deck Coating",
    sourceDocument: "California Code of Regulations Title 22 Section 65535"
  },
  {
    codeSection: "65545",
    title: "Pool Closure Requirements",
    category: "health_safety" as const,
    summary: "Pools with unsafe conditions must be closed immediately until issues are resolved.",
    fullText: "A public pool that is maintained or operated in a manner that creates an unhealthful, unsafe, or unsanitary condition may be closed by the enforcing agent. Conditions include: failure to maintain clear pool water, inadequate disinfection, improper pH, missing or broken suction outlet covers, missing or broken pool enclosures, hazards to pool users.",
    hoaFriendlyExplanation: "California health inspectors have the authority to immediately close your pool if they find unsafe conditions. This includes cloudy water, broken drain covers, damaged fencing, or malfunctioning equipment. A closed pool frustrates residents and reflects poorly on your community. Proactive maintenance and timely repairs help you avoid mandatory closures.",
    relatedProducts: "Drain Cover,Pool Fence,Gate Latch,Chemical Feeder,Pool Pump,Filter",
    sourceDocument: "California Code of Regulations Title 22 Section 65545"
  },
  {
    codeSection: "3123B",
    title: "Recirculation System Requirements",
    category: "pumps_equipment" as const,
    summary: "Each pool must have a separate recirculation system for continuous filtration and disinfection.",
    fullText: "Each pool shall be provided with a separate recirculation system designed for the continuous recirculation, filtration and disinfection of the pool water. The system shall consist of pumps, filters, chemical feeders, skimmers or perimeter overflow systems, valves, pipes, connections, fittings and appurtenances.",
    hoaFriendlyExplanation: "California building codes require every commercial pool to have a complete water circulation system that continuously filters and sanitizes the water. This includes the pump, filter, chemical feeders, and all the plumbing. Each component must work properly - a broken pump or clogged filter means your pool cannot operate legally.",
    relatedProducts: "Pool Pump,Variable Speed Motor,Pool Filter,Chemical Feeder,Skimmer,Check Valve,Union Fitting,PVC Pipe,Ball Valve",
    sourceDocument: "California Building Code Section 3123B"
  }
];

router.get("/", async (req, res) => {
  try {
    const regulations = await db.select().from(poolRegulations).where(eq(poolRegulations.isActive, true));
    res.json(regulations);
  } catch (error) {
    console.error("Error fetching pool regulations:", error);
    res.status(500).json({ error: "Failed to fetch pool regulations" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { query, category, products } = req.query;
    
    let conditions = [eq(poolRegulations.isActive, true)];
    
    if (category && typeof category === 'string') {
      conditions.push(eq(poolRegulations.category, category as any));
    }
    
    const regulations = await db
      .select()
      .from(poolRegulations)
      .where(and(...conditions));
    
    let filtered = regulations;
    
    if (query && typeof query === 'string') {
      const searchTerms = query.toLowerCase().split(' ');
      filtered = regulations.filter(reg => 
        searchTerms.some(term => 
          reg.title.toLowerCase().includes(term) ||
          reg.summary.toLowerCase().includes(term) ||
          reg.relatedProducts?.toLowerCase().includes(term)
        )
      );
    }
    
    if (products && typeof products === 'string') {
      const productList = products.toLowerCase().split(',');
      filtered = filtered.filter(reg => 
        productList.some(product => 
          reg.relatedProducts?.toLowerCase().includes(product.trim())
        )
      );
    }
    
    res.json(filtered);
  } catch (error) {
    console.error("Error searching pool regulations:", error);
    res.status(500).json({ error: "Failed to search pool regulations" });
  }
});

router.get("/by-products", async (req, res) => {
  try {
    const { products } = req.query;
    
    if (!products || typeof products !== 'string') {
      return res.status(400).json({ error: "Products parameter required" });
    }
    
    const productList = products.toLowerCase().split(',').map(p => p.trim());
    
    const regulations = await db
      .select()
      .from(poolRegulations)
      .where(eq(poolRegulations.isActive, true));
    
    const relevantRegs = regulations.filter(reg => 
      productList.some(product => 
        reg.relatedProducts?.toLowerCase().includes(product)
      )
    );
    
    const hoaExplanations = relevantRegs.map(reg => ({
      codeSection: reg.codeSection,
      title: reg.title,
      hoaFriendlyExplanation: reg.hoaFriendlyExplanation,
      category: reg.category
    }));
    
    res.json(hoaExplanations);
  } catch (error) {
    console.error("Error fetching regulations by products:", error);
    res.status(500).json({ error: "Failed to fetch regulations" });
  }
});

router.post("/seed", async (req, res) => {
  try {
    const existing = await db.select().from(poolRegulations);
    
    if (existing.length > 0) {
      return res.json({ message: "Database already seeded", count: existing.length });
    }
    
    for (const reg of poolCodeData) {
      await db.insert(poolRegulations).values(reg);
    }
    
    res.json({ message: "Pool regulations seeded successfully", count: poolCodeData.length });
  } catch (error) {
    console.error("Error seeding pool regulations:", error);
    res.status(500).json({ error: "Failed to seed pool regulations" });
  }
});

export default router;
