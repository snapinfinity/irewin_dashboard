/**
 * Sample data for testing the IREWIN public site (fictional employers).
 * Used by scripts/seed-sample-data.ts. Every document it creates is tagged
 * `sample: true` so `npm run seed:sample -- --remove` can clean it up.
 */

export type WorkMode = "remote" | "hybrid" | "onsite";
export type EmploymentType = "full-time" | "part-time" | "contract" | "internship";
export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";

export interface SampleCategory {
  name: string;
  slug: string;
  subcategories: string[];
}

export interface SampleCompany {
  key: string;
  name: string;
  website: string;
  logoFile: string;
}

export interface SampleJob {
  id: string;
  title: string;
  /** SampleCompany.key */
  company: string;
  /** category slug */
  category: string;
  /** subcategory slug */
  sub: string;
  location: string;
  mode: WorkMode;
  type: EmploymentType;
  level: ExperienceLevel;
  min: number | null;
  max: number | null;
  skills: string[];
  /** yyyy-mm-dd, converted to "N days ago" relative to the seed date */
  created: string;
  /** yyyy-mm-dd, shifted by the same offset as `created` */
  deadline: string | null;
  summary: string;
}

/** Dates in SAMPLE_JOBS are written relative to this day. */
export const SAMPLE_REFERENCE_DATE = "2026-09-25";

export const SAMPLE_CATEGORIES: SampleCategory[] = [
  { name: "Technology & IT", slug: "technology", subcategories: ["Software Development", "Data & Analytics", "DevOps & Cloud", "Cybersecurity", "IT Support"] },
  { name: "Healthcare & Nursing", slug: "healthcare", subcategories: ["Nursing", "Allied Health", "Care Assistants", "Pharmacy", "Medical & Clinical"] },
  { name: "Finance & Accounting", slug: "finance", subcategories: ["Accounting", "Financial Analysis", "Banking", "Funds & Asset Management", "Insurance"] },
  { name: "Pharma & Life Sciences", slug: "pharma", subcategories: ["Manufacturing", "Quality & Validation", "Research & Development", "Regulatory Affairs"] },
  { name: "Engineering & Manufacturing", slug: "engineering", subcategories: ["Mechanical", "Electrical", "Process Engineering", "Maintenance", "Production"] },
  { name: "Sales & Marketing", slug: "sales-marketing", subcategories: ["Sales", "Digital Marketing", "Marketing", "Account Management", "Communications"] },
  { name: "Hospitality & Tourism", slug: "hospitality", subcategories: ["Chefs & Kitchen", "Front of House", "Hotel Management", "Tourism & Travel"] },
  { name: "Construction & Trades", slug: "construction", subcategories: ["Civil Engineering", "Quantity Surveying", "Site Management", "Electricians", "Plumbing"] },
  { name: "Education & Training", slug: "education", subcategories: ["Primary & Secondary", "Third Level", "Training & Development", "SNA"] },
  { name: "Logistics & Supply Chain", slug: "logistics", subcategories: ["Warehouse", "Transport & Drivers", "Procurement", "Supply Chain Planning"] },
  { name: "Retail", slug: "retail", subcategories: ["Store Management", "Sales Assistants", "Merchandising", "E-commerce"] },
  { name: "Customer Service", slug: "customer-service", subcategories: ["Contact Centre", "Customer Success", "Technical Support", "Multilingual Roles"] },
];

export const SAMPLE_COMPANIES: SampleCompany[] = [
  { key: "liffey-analytics", name: "Liffey Analytics", website: "https://liffeyanalytics.example", logoFile: "liffey-analytics.svg" },
  { key: "claddagh-health", name: "Claddagh Health Group", website: "https://claddaghhealth.example", logoFile: "claddagh-health.svg" },
  { key: "harbourview-capital", name: "Harbourview Capital", website: "https://harbourview.example", logoFile: "harbourview-capital.svg" },
  { key: "shannon-biologics", name: "Shannon Biologics", website: "https://shannonbio.example", logoFile: "shannon-biologics.svg" },
  { key: "wild-atlantic-travel", name: "Wild Atlantic Travel", website: "https://wildatlantic.example", logoFile: "wild-atlantic-travel.svg" },
  { key: "corrib-energy", name: "Corrib Energy", website: "https://corribenergy.example", logoFile: "corrib-energy.svg" },
  { key: "boyne-construction", name: "Boyne Construction", website: "https://boyneconstruction.example", logoFile: "boyne-construction.svg" },
  { key: "kylemore-hotels", name: "Kylemore Hotels", website: "https://kylemorehotels.example", logoFile: "kylemore-hotels.svg" },
  { key: "deise-digital", name: "Déise Digital", website: "https://deisedigital.example", logoFile: "deise-digital.svg" },
  { key: "burren-logistics", name: "Burren Logistics", website: "https://burrenlogistics.example", logoFile: "burren-logistics.svg" },
  { key: "emerald-retail", name: "Emerald Retail Group", website: "https://emeraldretail.example", logoFile: "emerald-retail.svg" },
  { key: "slaney-software", name: "Slaney Software", website: "https://slaneysoftware.example", logoFile: "slaney-software.svg" },
];

export const SAMPLE_JOBS: SampleJob[] = [
  { id: "senior-frontend-developer-liffey", title: "Senior Frontend Developer", company: "liffey-analytics", category: "technology", sub: "software-development", location: "Dublin", mode: "hybrid", type: "full-time", level: "senior", min: 75000, max: 90000, skills: ["React", "TypeScript", "Next.js", "Accessibility", "Playwright"], created: "2026-09-24", deadline: "2026-10-30", summary: "Lead the build of our customer-facing reporting platform, working closely with design and a small backend team in our Dublin 2 office." },
  { id: "staff-nurse-ed-claddagh", title: "Staff Nurse, Emergency Department", company: "claddagh-health", category: "healthcare", sub: "nursing", location: "Galway", mode: "onsite", type: "full-time", level: "mid", min: 38000, max: 52000, skills: ["Triage", "Acute care", "NMBI registration", "Patient advocacy"], created: "2026-09-24", deadline: "2026-10-20", summary: "Join a busy, supportive emergency department team delivering high-quality acute care to patients across the West of Ireland." },
  { id: "financial-analyst-harbourview", title: "Financial Analyst", company: "harbourview-capital", category: "finance", sub: "financial-analysis", location: "Cork", mode: "hybrid", type: "full-time", level: "mid", min: 50000, max: 62000, skills: ["Financial modelling", "Excel", "Power BI", "Forecasting"], created: "2026-09-23", deadline: "2026-10-25", summary: "Support investment decisions with clear, well-built financial models and monthly performance reporting for our Cork-based funds team." },
  { id: "process-engineer-shannon", title: "Process Engineer", company: "shannon-biologics", category: "pharma", sub: "manufacturing", location: "Limerick", mode: "onsite", type: "full-time", level: "mid", min: 55000, max: 68000, skills: ["GMP", "Process validation", "Lean", "Root cause analysis"], created: "2026-09-22", deadline: "2026-10-31", summary: "Own and improve biologics manufacturing processes at our Limerick campus, from tech transfer through to routine production." },
  { id: "data-engineer-corrib", title: "Data Engineer", company: "corrib-energy", category: "technology", sub: "data-analytics", location: "Remote (Ireland)", mode: "remote", type: "contract", level: "senior", min: null, max: null, skills: ["Python", "SQL", "Airflow", "Azure", "dbt"], created: "2026-09-22", deadline: null, summary: "Design and run the data pipelines behind our renewable-generation forecasting, working remotely from anywhere in Ireland." },
  { id: "digital-marketing-executive-deise", title: "Digital Marketing Executive", company: "deise-digital", category: "sales-marketing", sub: "digital-marketing", location: "Waterford", mode: "hybrid", type: "part-time", level: "entry", min: 32000, max: 38000, skills: ["Google Ads", "Meta Ads", "SEO", "Copywriting"], created: "2026-09-21", deadline: "2026-10-15", summary: "Plan and run paid social and search campaigns for a portfolio of Irish retail and hospitality clients." },
  { id: "graduate-civil-engineer-boyne", title: "Graduate Civil Engineer", company: "boyne-construction", category: "construction", sub: "civil-engineering", location: "Drogheda, Co. Louth", mode: "onsite", type: "full-time", level: "entry", min: 36000, max: 40000, skills: ["AutoCAD", "Site supervision", "Setting out", "Health & safety"], created: "2026-09-20", deadline: "2026-10-18", summary: "Start your engineering career on major infrastructure projects across the North East with a structured graduate programme." },
  { id: "front-office-supervisor-kylemore", title: "Front Office Supervisor", company: "kylemore-hotels", category: "hospitality", sub: "front-of-house", location: "Killarney, Co. Kerry", mode: "onsite", type: "full-time", level: "mid", min: 34000, max: 39000, skills: ["Opera PMS", "Guest relations", "Team leadership"], created: "2026-09-19", deadline: "2026-10-12", summary: "Lead our front desk team and make every guest's arrival at our Killarney hotel something to remember." },
  { id: "full-stack-engineer-slaney", title: "Full Stack Engineer (React / Node)", company: "slaney-software", category: "technology", sub: "software-development", location: "Dublin", mode: "hybrid", type: "full-time", level: "senior", min: 70000, max: 85000, skills: ["React", "Node.js", "PostgreSQL", "AWS"], created: "2026-09-19", deadline: "2026-10-28", summary: "Build features end to end on our scheduling platform used by clinics and gyms across Ireland and the UK." },
  { id: "logistics-coordinator-burren", title: "Logistics Coordinator", company: "burren-logistics", category: "logistics", sub: "supply-chain-planning", location: "Limerick", mode: "onsite", type: "full-time", level: "mid", min: 36000, max: 42000, skills: ["WMS", "Route planning", "Excel", "Customer service"], created: "2026-09-18", deadline: "2026-10-16", summary: "Coordinate daily inbound and outbound freight for our Shannon distribution hub." },
  { id: "store-manager-emerald", title: "Store Manager", company: "emerald-retail", category: "retail", sub: "store-management", location: "Cork", mode: "onsite", type: "full-time", level: "senior", min: 48000, max: 55000, skills: ["P&L management", "Team leadership", "Merchandising"], created: "2026-09-17", deadline: "2026-10-14", summary: "Run one of our flagship Cork stores, leading a team of 30 and owning sales, service and standards." },
  { id: "cybersecurity-analyst-liffey", title: "Cybersecurity Analyst", company: "liffey-analytics", category: "technology", sub: "cybersecurity", location: "Dublin", mode: "hybrid", type: "full-time", level: "mid", min: 58000, max: 70000, skills: ["SIEM", "Incident response", "ISO 27001", "Azure"], created: "2026-09-16", deadline: "2026-10-22", summary: "Protect our clients' data by monitoring, investigating and responding to security events." },
  { id: "clinical-pharmacist-claddagh", title: "Clinical Pharmacist", company: "claddagh-health", category: "healthcare", sub: "pharmacy", location: "Galway", mode: "onsite", type: "full-time", level: "senior", min: 60000, max: 74000, skills: ["Medicines management", "PSI registration", "Clinical audit"], created: "2026-09-15", deadline: "2026-10-19", summary: "Provide clinical pharmacy services across medical and surgical wards in a leading Galway hospital." },
  { id: "qa-specialist-shannon", title: "Quality Assurance Specialist", company: "shannon-biologics", category: "pharma", sub: "quality-validation", location: "Limerick", mode: "hybrid", type: "contract", level: "mid", min: 52000, max: 60000, skills: ["GMP", "Deviations", "CAPA", "Batch release"], created: "2026-09-14", deadline: "2026-10-10", summary: "Support batch release and quality systems on a 12-month contract at our Limerick site." },
  { id: "tour-coordinator-wild-atlantic", title: "Tour Operations Coordinator", company: "wild-atlantic-travel", category: "hospitality", sub: "tourism-travel", location: "Galway", mode: "hybrid", type: "full-time", level: "mid", min: 33000, max: 38000, skills: ["Itinerary planning", "Supplier management", "French or German"], created: "2026-09-13", deadline: "2026-10-09", summary: "Plan and run small-group tours along the Wild Atlantic Way for guests from across Europe." },
  { id: "accountant-harbourview", title: "Newly Qualified Accountant", company: "harbourview-capital", category: "finance", sub: "accounting", location: "Dublin", mode: "hybrid", type: "full-time", level: "entry", min: 52000, max: 58000, skills: ["ACA / ACCA", "IFRS", "Fund accounting"], created: "2026-09-12", deadline: "2026-10-08", summary: "Join our fund accounting team straight after qualifying, with clear progression and study support." },
  { id: "customer-success-slaney", title: "Customer Success Manager", company: "slaney-software", category: "customer-service", sub: "customer-success", location: "Remote (Ireland)", mode: "remote", type: "full-time", level: "mid", min: 45000, max: 52000, skills: ["SaaS", "Onboarding", "HubSpot", "Relationship building"], created: "2026-09-11", deadline: null, summary: "Help clinics and studios get the most from our platform, from onboarding through renewal." },
  { id: "marketing-intern-wild-atlantic", title: "Summer Marketing Intern", company: "wild-atlantic-travel", category: "sales-marketing", sub: "marketing", location: "Westport, Co. Mayo", mode: "hybrid", type: "internship", level: "entry", min: null, max: 28000, skills: ["Social media", "Canva", "Content writing"], created: "2026-09-10", deadline: "2026-10-05", summary: "Create content and campaigns that bring visitors to the West of Ireland, with mentoring from our marketing lead." },
  { id: "site-manager-boyne", title: "Site Manager", company: "boyne-construction", category: "construction", sub: "site-management", location: "Dublin", mode: "onsite", type: "full-time", level: "lead", min: 75000, max: 88000, skills: ["Residential builds", "Programme management", "Safe Pass", "Subcontractor management"], created: "2026-09-09", deadline: "2026-10-06", summary: "Lead delivery of a 140-unit residential scheme in North County Dublin from groundworks to handover." },
  { id: "devops-engineer-corrib", title: "DevOps Engineer", company: "corrib-energy", category: "technology", sub: "devops-cloud", location: "Galway", mode: "hybrid", type: "full-time", level: "senior", min: 68000, max: 80000, skills: ["Kubernetes", "Terraform", "Azure", "CI/CD"], created: "2026-09-08", deadline: "2026-10-04", summary: "Run and automate the cloud platform behind our grid-forecasting products." },
  { id: "maintenance-engineer-shannon", title: "Maintenance Engineer", company: "shannon-biologics", category: "engineering", sub: "maintenance", location: "Cork", mode: "onsite", type: "full-time", level: "mid", min: 50000, max: 60000, skills: ["PLC", "Preventive maintenance", "CMMS", "Electrical fault-finding"], created: "2026-09-08", deadline: "2026-10-07", summary: "Keep critical production and utilities equipment running at our Cork manufacturing site." },
  { id: "ecommerce-executive-emerald", title: "E-commerce Executive", company: "emerald-retail", category: "retail", sub: "e-commerce", location: "Dublin", mode: "hybrid", type: "full-time", level: "mid", min: 40000, max: 47000, skills: ["Shopify", "Merchandising", "Google Analytics"], created: "2026-09-07", deadline: "2026-10-03", summary: "Grow online sales by managing product launches, promotions and on-site merchandising." },
];
