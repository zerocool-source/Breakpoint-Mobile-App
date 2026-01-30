import type { User, Property, Job, Estimate, RouteStop, ChatMessage, QueueMetrics } from '@/types';

export const mockUser: User = {
  id: '',
  name: '',
  email: '',
  role: 'repair_tech',
};

export const mockProperties: Property[] = [
  { id: '1', name: 'AA Ron Property Services', address: '', email: 'aaronpropertyservices951@gmail.com', phone: '9515413566' },
  { id: '2', name: 'Altis Master Association', address: '', email: 'jason.kratz@seabreezemgmt.com', phone: '' },
  { id: '3', name: 'Amberwalk HOA', address: '', email: 'hoavendor@wsr.net', phone: '' },
  { id: '4', name: 'Amelia Square HOA', address: '', email: 'jwilliams@prescottmgt.com', phone: '' },
  { id: '5', name: 'Antelope Ridge Apartments', address: '', email: 'anteloperidges@sentinelcorp.com', phone: '' },
  { id: '6', name: 'Antigua - Repairs', address: '', email: 'caterina.mares@fsresidential.com', phone: '' },
  { id: '7', name: 'Aquatic Technologies', address: '', email: 'charlie@aquatictechnologies.com', phone: '' },
  { id: '8', name: 'Aquatic Zone', address: '', email: 'christi@aquatic-concepts.com', phone: '' },
  { id: '9', name: 'Arrow Station HOA', address: '', email: 'seabreezeinvoices@payableslockbox.com', phone: '' },
  { id: '10', name: 'Arroyo Vista', address: '', email: '', phone: '' },
  { id: '11', name: 'Ashwood Apts. #1', address: '', email: 'nickscript@cox.net', phone: '' },
  { id: '12', name: 'Ashwood Apts. #2', address: '', email: 'nickscript@cox.net', phone: '' },
  { id: '13', name: 'Aspen Hills - Repair', address: '', email: 'LKridle@5starmgmt.com', phone: '' },
  { id: '14', name: 'Atwell Community Association PA - 29', address: '', email: 'toya.wallace@seabreezemgmt.com', phone: '' },
  { id: '15', name: 'Atwell Community Association PA-22', address: '', email: 'stephanie.schumann@seabreezemgmt.com', phone: '' },
  { id: '16', name: 'Atwell Community Association PA-24 Corridor Park', address: '', email: 'toya.wallace@seabreezemgmt.com', phone: '' },
  { id: '17', name: 'Atwell Community Association PA-26', address: '', email: 'Stephanie.Schumann@seabreezemgmt.com', phone: '' },
  { id: '18', name: 'Audie Murphy Ranch HOA', address: '', email: 'AccountsPayable@Keystonepacific.com', phone: '' },
  { id: '19', name: 'AVELINA HOA', address: '', email: 'pro.invoices@associa.us', phone: '' },
  { id: '20', name: 'BARRINGTON PLACE HOA', address: '', email: '', phone: '' },
  { id: '21', name: 'Bear Creek MA', address: '', email: 'ap@avalonweb.com', phone: '8004002284' },
  { id: '22', name: 'Bedford Master Association/Hudson House', address: '', email: 'deanna.casillas@fsresidential.com', phone: '' },
  { id: '23', name: 'Bedford/The Shed BEMA', address: '', email: 'deanna.casillas@fsresidential.com', phone: '' },
  { id: '24', name: 'Belamaria Splash Deck', address: '', email: 'sharon@mgmtdenovo.com', phone: '' },
  { id: '25', name: 'Belcaro HOA', address: '', email: 'aspicer@waltersmanagement.com', phone: '9516915611' },
  { id: '26', name: 'Bella Vista HOA', address: '', email: 'reina@cmsmgmt.com', phone: '' },
  { id: '27', name: 'BelVista Community Assoc.', address: '', email: 'info@thealliancemgt.com', phone: '' },
  { id: '28', name: 'BONITA VILLAGE HOA', address: '', email: 'antonia@progressive-am.com', phone: '9096572655' },
  { id: '29', name: 'Bottaia Winery', address: '', email: 'jhilton@pontewinery.com', phone: '9513971300' },
  { id: '30', name: 'Breakpoint Commercial Pools (Test Account)', address: '', email: 'breakpointcpsinc@gmail.com', phone: '9516533333' },
  { id: '31', name: 'Bridlevale HOA', address: '', email: 'blake@avalonweb.com', phone: '' },
  { id: '32', name: 'Brookfield Ontario Ranch Master Assoc.', address: '', email: 'proinvoices@associa.us', phone: '' },
  { id: '33', name: 'Brookview Terrace HOA', address: '', email: 'mpease@powerstonepm.com', phone: '9493724029' },
  { id: '34', name: 'Bungalows at Old School House', address: '', email: 'terry@avalonweb.com', phone: '' },
  { id: '35', name: 'Carter Estates Winery and Resort', address: '', email: 'cibarra@wineresort.com', phone: '8582487185' },
  { id: '36', name: 'Cedarpointe Community Corporation', address: '', email: 'diversifiedhoa@invoices.appfolio.com', phone: '' },
  { id: '37', name: 'CHARDONNAY HILLS HOA', address: '', email: 'AP5@AVALONWEB.COM', phone: '' },
  { id: '38', name: 'CITRO OWNERS ASSOCIATION (CIOW)- Fallbrook', address: '', email: '', phone: '' },
  { id: '39', name: 'City of Riverside Parks, Recreation & Community Services', address: '', email: 'bantunez@riversideca.gov', phone: '9515844128' },
  { id: '40', name: 'Comfort Inn & Suites Murrieta - Repairs', address: '', email: 'jimmy.lin@comfortinnmurrieta.com', phone: '' },
  { id: '41', name: 'Cornerstone HOA', address: '', email: 'anyssa.sanchez@fsresidential.com', phone: '' },
  { id: '42', name: 'Cottonwood Canyon Hills HOA', address: '', email: 'ccastro@actionlife.com', phone: '9512462397' },
  { id: '43', name: 'Country Club Villas HOA', address: '', email: 'vhall@keystonepacific.com', phone: '' },
  { id: '44', name: 'Country Park Villas - Repairs', address: '', email: 'dbernardo@actionlife.com', phone: '' },
  { id: '45', name: 'Crown Villas', address: '', email: 'kstrogatz@optimumpm.com', phone: '' },
  { id: '46', name: 'CYPRESS CREEK HOA', address: '', email: '', phone: '' },
  { id: '47', name: 'Dakota Apartments', address: '', email: 'manager@rent-dakota.com', phone: '9519268200' },
  { id: '48', name: 'East Highlands Ranch - Repairs', address: '', email: 'mlara@easthighlandsranch.com', phone: '' },
  { id: '49', name: 'Edenglen HOA', address: '', email: 'proinvoices@associa.us', phone: '' },
  { id: '50', name: 'Encanto at Dos Logos - Repairs', address: '', email: 'encantomgr@greystar.com', phone: '9512774100' },
  { id: '51', name: 'EOS Fitness in Moreno Valley - Repairs', address: '', email: 'Hannibalmartinez12@gmail.com', phone: '' },
  { id: '52', name: 'ESPERANZA HOA', address: '', email: 'dharle@keystonepacific.com', phone: '' },
  { id: '53', name: 'Estrella Community Association', address: '', email: 'invoicesbpi@associa.us', phone: '' },
  { id: '54', name: 'Fairway Canyon HOA', address: '', email: 'Brittany.Bishop@fsresidential.com', phone: '' },
  { id: '55', name: 'FOOTHILL GROVE HOA', address: '', email: 'klaframboise@seabreezemgmt.com', phone: '9515470441' },
  { id: '56', name: 'Foothill Vineyard', address: '', email: 'crystaltrujillo@theprimeas.com', phone: '' },
  { id: '57', name: 'Four Seasons at Hemet HOA', address: '', email: 'FSResidentialAPCA@avidbill.com', phone: '' },
  { id: '58', name: 'Gardens at the Arboretum', address: '', email: '', phone: '' },
  { id: '59', name: 'Grand Park Community Association', address: '', email: 'jscott@powerstonepm.com', phone: '' },
  { id: '60', name: 'Green River HOA', address: '', email: 'marc.m@avalon.web', phone: '' },
  { id: '61', name: 'HARVEST AT UPLAND HOA', address: '', email: 'FSResidentialAPCA@avidbill.com', phone: '' },
  { id: '62', name: 'Haven View Estates - Repairs', address: '', email: 'darlene.harris@fsresidential.com', phone: '' },
  { id: '63', name: 'Hayes/Westport - Eastvale Square Community Association', address: '', email: 'mdent@keystonepacific.com', phone: '' },
  { id: '64', name: 'Heather at Ridge Pointe - Repairs', address: '', email: 'caterina.cilluffo@fsreidential.com', phone: '' },
  { id: '65', name: 'Heirloom Farms', address: '', email: 'margaret@vintagegroupre.com', phone: '' },
  { id: '66', name: 'HERITAGE LAKE HOA', address: '', email: 'FSResidentialAPCA@avidbill.com', phone: '' },
  { id: '67', name: 'Highland Village - Repairs', address: '', email: 'chouse@keystonepacific.com', phone: '' },
  { id: '68', name: 'HOLIDAY HOA', address: '', email: 'veronica@progressive-am.com', phone: '' },
  { id: '69', name: 'HOLIDAY HOA REPAIRS', address: '', email: 'veronica@progressive-am.com', phone: '' },
  { id: '70', name: 'Horse Creek Ridge HOA', address: '', email: 'jeff@vintagegroupre.com', phone: '7603634811' },
  { id: '71', name: 'Horsethief Canyon Ranch Master Association', address: '', email: 'seabreezeinvoices@payableslockbox.com', phone: '' },
  { id: '72', name: 'HYDE PARK HOA', address: '', email: 'shannaghale@theprimeas.com', phone: '' },
  { id: '73', name: 'Indigo Place', address: '', email: 'destiny@vintagegroupre.com', phone: '9515500508' },
  { id: '74', name: 'JACKSON CROSSING HOA', address: '', email: 'vendors@waltersmanagement.com', phone: '' },
  { id: '75', name: 'JURUPA AREA RECREATION & PARK DISTRICT- SPLASHPAD', address: '', email: 'CURT@JARPD.ORG', phone: '9513612090' },
  { id: '76', name: 'Lake Elsinore Village', address: '', email: 'esteban@huntingtonwest.com', phone: '' },
  { id: '77', name: 'Lake Hills Reserve HOA', address: '', email: 'AP@AVALONWEB.COM', phone: '' },
  { id: '78', name: 'LAKE VILLAGE HOA', address: '', email: 'holly.dillenbeck@fsresidential.com', phone: '' },
  { id: '79', name: 'La Paloma at Corona Ranch', address: '', email: 'flasorsa@5starmgmt.com', phone: '' },
  { id: '80', name: 'Laurel Creek', address: '', email: 'Jeldair@vintagegroupre.com', phone: '' },
  { id: '81', name: 'LIPT Winchester Road, LLC', address: '', email: 'josh.darbee@jll.com', phone: '9519730570' },
  { id: '82', name: 'Madison Park Villas HOA', address: '', email: 'jnuzzo@voitmanagement.com', phone: '9512394933' },
  { id: '83', name: 'MARKET STREET HOA', address: '', email: 'bwilson@drminternet.com', phone: '' },
  { id: '84', name: 'McSweeny Farms', address: '', email: 'apscan@avalonweb.com', phone: '9517465620' },
  { id: '85', name: 'Meadowview Community', address: '', email: 'jennifer.Brewer@fsresidential.com', phone: '' },
  { id: '86', name: 'MENIFEE TOWN CENTER HOA', address: '', email: 'AccountsPayable@Keystonepacific.com', phone: '' },
  { id: '87', name: 'MESA VERDE HOA', address: '', email: 'seabreezeinvoices@payableslockbox.com', phone: '' },
  { id: '88', name: 'Montara and La Cresta', address: '', email: 'crystaltrujillo@theprimeas.com', phone: '' },
  { id: '89', name: 'Montego Bay Riverside - TPC780260', address: '', email: 'jwilliams@prescottmgt.com', phone: '' },
  { id: '90', name: 'Moreno Valley Ranch HOA', address: '', email: 'gm@morenovalleyranch.com', phone: '' },
  { id: '91', name: 'Morgan Hill Homeowners Association', address: '', email: 'mhfm@waltersmanagement.com', phone: '9515879352' },
  { id: '92', name: 'Mountain View HOA', address: '', email: 'FSResidentialAPCA@avidbill.com', phone: '' },
  { id: '93', name: 'Narra Hills', address: '', email: '', phone: '' },
  { id: '94', name: 'NEUHOUSE HOA', address: '', email: 'AccountsPayableSC@managementtrust.com', phone: '8585474373' },
  { id: '95', name: 'New American Homes II', address: '', email: 'aeminvoices@equitymgt.com', phone: '' },
  { id: '96', name: 'North Oaks - Repairs', address: '', email: 'bsomers@keystonepacific.com', phone: '9513753447' },
  { id: '97', name: 'Northstar Ranch HOA', address: '', email: 'gprivitt@keystonepacific.com', phone: '' },
  { id: '98', name: 'Orange County Pools and Spas', address: '', email: 'everett@orangecountypoolsandspas.com', phone: '7142803118' },
  { id: '99', name: 'Pacific Ave HOA', address: '', email: 'jgomez@equitymgt.com', phone: '9512965640' },
  { id: '100', name: 'Pacific Landing Apartments', address: '', email: 'pacificlandingmgr@apcompanies.com', phone: '' },
  { id: '101', name: 'Pala Mesa Villas HOA', address: '', email: 'abergen@keystonepacific.com', phone: '9513823057' },
  { id: '102', name: 'Palm Court Apartment Homes', address: '', email: 'kristina.hernandez@wng.com', phone: '' },
  { id: '103', name: 'Park Place Master (0577)', address: '', email: 'FSResidentialAPCA@avidbill.com', phone: '' },
  { id: '104', name: 'PASEO DEL SOL HOA', address: '', email: 'paseodirector@waltersmanagement.com', phone: '' },
  { id: '105', name: 'Paseos HOA at Crown Valley', address: '', email: 'ap2@avalonweb.com', phone: '' },
  { id: '106', name: 'Ponte Winery', address: '', email: 'jhilton@pontewinery.com', phone: '9513971300' },
  { id: '107', name: 'Prado Homes', address: '', email: 'eva@vintagegroupre.com', phone: '' },
  { id: '108', name: 'PRESERVE At Chino', address: '', email: 'FSResidentialAPCA@avidbill.com', phone: '' },
  { id: '109', name: 'PRESERVE MEADOWHOUSE', address: '', email: 'FSResidentialAPCA@avidbill.com', phone: '9096067446' },
  { id: '110', name: 'Quail Ridge Apartments', address: '', email: 'quailridge@vdbprop.com', phone: '' },
  { id: '111', name: 'Radius at Piemonte', address: '', email: 'karanda@keystonepacific.com', phone: '' },
  { id: '112', name: 'Rancho Highlands HOA', address: '', email: 'AP@AVALONWEB.COM', phone: '' },
  { id: '113', name: 'Rancho Soleo HOA', address: '', email: 'AccountsPayable@Keystonepacific.com', phone: '' },
  { id: '114', name: 'Rancho Town Square Fountain', address: '', email: 'holly.dillenbeck@fsresidential.com', phone: '' },
  { id: '115', name: 'River Ranch HOA', address: '', email: 'seabreezeinvoices@payableslockbox.com', phone: '' },
  { id: '116', name: "River's Edge Apartments", address: '', email: 'riveredgemgr@apcompanies.com', phone: '' },
  { id: '117', name: 'RIVERWALK VISTA HOA', address: '', email: 'ieinvoices@actionlife.com', phone: '' },
  { id: '118', name: 'Rockport Ranch', address: '', email: 'dpetroff@keystonepacific.com', phone: '' },
  { id: '119', name: 'Roosevelt High School - Repairs', address: '', email: 'trussell@cnusd.k12.ca.us', phone: '' },
  { id: '120', name: 'Roripaugh Hills HOA', address: '', email: 'TJ@ELITEMANAGEMENT.COM', phone: '9518370787' },
  { id: '121', name: 'RORIPAUGH RANCH', address: '', email: 'amy.dankel@fsresidential.com', phone: '' },
  { id: '122', name: 'Rosena Ranch', address: '', email: '', phone: '' },
  { id: '123', name: 'SANTA ROSA HIGHLANDS HOA', address: '', email: 'ACCOUNTSPAYABLE@KEYSTONEPACIFIC.COM', phone: '' },
  { id: '124', name: 'Santiago HOA', address: '', email: 'acarrillo@actionlife.com', phone: '' },
  { id: '125', name: 'SAUSALITO HOA', address: '', email: 'seabreezeinvoices@payableslockbox.com', phone: '' },
  { id: '126', name: 'Sequoia Plaza Mobile Home Park - Repairs', address: '', email: 'smh@santiagocorp.com', phone: '' },
  { id: '127', name: 'Serafina HOA', address: '', email: 'FSResidentialAPCA@avidbill.com', phone: '' },
  { id: '128', name: 'Shadetree HOA', address: '', email: 'jessica.clifford@manamenttrust.com', phone: '' },
  { id: '129', name: 'Shadow Hills Village HOA - Repair', address: '', email: 'workorderdept@inclineconsultants.com', phone: '' },
  { id: '130', name: 'Shady Grove HOA', address: '', email: 'proinvoices@associa.us', phone: '' },
  { id: '131', name: 'Shady Trails HOA', address: '', email: 'jessica.jamieson@fsresidential.com', phone: '' },
  { id: '132', name: 'Shady View', address: '', email: 'kara.beers@seabreezemgmt.com', phone: '9093132641' },
  { id: '133', name: 'Skyview Ridge Community Association', address: '', email: 'margaret@vintagegroupre.com', phone: '' },
  { id: '134', name: 'Solera Community Association', address: '', email: 'toniburns@theprimeas.com', phone: '' },
  { id: '135', name: 'Solera Diamond Valley HOA', address: '', email: 'jocelyne.quiroz@seabreezemgmt.com', phone: '' },
  { id: '136', name: 'Solera Oak Valley Greens HOA', address: '', email: 'cestrada@keystonepacific.com', phone: '' },
  { id: '137', name: 'SOMMERS BEND AA PLANNING AREA ASSOCIATION', address: '', email: 'ANNA.MACHADO@SEABREEZEMGMT.COM', phone: '' },
  { id: '138', name: 'South Coast Winery', address: '', email: '', phone: '8582487185' },
  { id: '139', name: "SPENCER'S CROSSING HOA", address: '', email: 'ap@avalonweb.com', phone: '' },
  { id: '140', name: 'SUMMERLY COMMUNITY HOA', address: '', email: 'Deanna.casillas@fsresidential.com', phone: '' },
  { id: '141', name: 'Summit Crest HOA', address: '', email: '', phone: '' },
  { id: '142', name: 'Sun City Villas HOA', address: '', email: 'Scott@wsr.net', phone: '9516795771' },
  { id: '143', name: 'SUNDANCE NORTH HOA', address: '', email: 'dmandel@keystonepacific.com', phone: '' },
  { id: '144', name: 'SUNDANCE PARK', address: '', email: 'proinvoices@associa.us', phone: '' },
  { id: '145', name: 'SUN LAKES COUNTRY CLUB', address: '', email: 'FSResidentialAPCA@avidbill.com', phone: '9515723460' },
  { id: '146', name: 'SUNNY MEADOWS', address: '', email: 'paseodirector@waltersmanagement.com', phone: '' },
  { id: '147', name: 'SUNNYMEAD RANCH PCA', address: '', email: 'seabreezeinvoices@payableslockbox.com', phone: '' },
  { id: '148', name: 'Sycamore Creek HOA', address: '', email: '', phone: '' },
  { id: '149', name: 'Sycamore Hills HOA - Repairs', address: '', email: 'josephine.perez@managementtrust.com', phone: '' },
  { id: '150', name: 'Tamarack Community', address: '', email: 'FSResidentialAPCA@avidbill.com', phone: '' },
  { id: '151', name: 'TEMECULA LANE HOA', address: '', email: 'zfeenstra@powerstonepm.com', phone: '9493724029' },
  { id: '152', name: 'Temecula Ridge Apartments - Repairs', address: '', email: 'tina.williams@rcmi.com', phone: '9512528282' },
  { id: '153', name: 'Temeku Hills MA', address: '', email: 'fsresidentialapca@avidbill.com', phone: '' },
  { id: '154', name: 'The Arbors HOA', address: '', email: '', phone: '' },
  { id: '155', name: 'The Bluffs at Temecula Valley Wine Country', address: '', email: 'FSResidentialAPCA@avidbill.com', phone: '' },
  { id: '156', name: 'The Farm in Temecula', address: '', email: '', phone: '' },
  { id: '157', name: 'The Oaks of Wildomar HOA', address: '', email: '', phone: '' },
  { id: '158', name: 'The Overlook HOA', address: '', email: '', phone: '' },
  { id: '159', name: 'The Resort at Pelican Hill', address: '', email: '', phone: '' },
  { id: '160', name: 'The Retreat at Corona Ranch', address: '', email: '', phone: '' },
  { id: '161', name: 'The Ridge at Serrano HOA', address: '', email: '', phone: '' },
  { id: '162', name: 'The Springs at Borrego', address: '', email: '', phone: '' },
  { id: '163', name: 'The Vintage at Murrieta', address: '', email: '', phone: '' },
  { id: '164', name: 'Thornton HOA', address: '', email: '', phone: '' },
  { id: '165', name: 'Tierra Del Sol HOA', address: '', email: '', phone: '' },
  { id: '166', name: 'Toscana HOA', address: '', email: '', phone: '' },
  { id: '167', name: 'Traditions Golf Club', address: '', email: '', phone: '' },
  { id: '168', name: 'Trilogy at Glen Ivy', address: '', email: '', phone: '' },
  { id: '169', name: 'Trilogy at Monarch Dunes', address: '', email: '', phone: '' },
  { id: '170', name: 'Trilogy at the Polo Club', address: '', email: '', phone: '' },
  { id: '171', name: 'Tustin Ranch Golf Club', address: '', email: '', phone: '' },
  { id: '172', name: 'Valley Wide Recreation', address: '', email: '', phone: '' },
  { id: '173', name: 'Verde at Tres Lagos', address: '', email: '', phone: '' },
  { id: '174', name: 'Via Montecito HOA', address: '', email: '', phone: '' },
  { id: '175', name: 'Villas at Old School House', address: '', email: '', phone: '' },
  { id: '176', name: 'Vista Pacifica HOA', address: '', email: '', phone: '' },
  { id: '177', name: 'Walden Park HOA', address: '', email: '', phone: '' },
  { id: '178', name: 'Waterstone HOA', address: '', email: '', phone: '' },
  { id: '179', name: 'West Hills HOA', address: '', email: '', phone: '' },
  { id: '180', name: 'Westgate Apartments', address: '', email: '', phone: '' },
  { id: '181', name: 'Westridge HOA', address: '', email: '', phone: '' },
  { id: '182', name: 'Wildhorse Ranch', address: '', email: '', phone: '' },
  { id: '183', name: 'Willow Springs', address: '', email: '', phone: '' },
  { id: '184', name: 'Winchester Hills HOA', address: '', email: '', phone: '' },
  { id: '185', name: 'Windrose at Baker Ranch', address: '', email: '', phone: '' },
  { id: '186', name: 'Woodcrest Country Club', address: '', email: '', phone: '' },
  { id: '187', name: 'Woodview Patio Homes Association - Repairs', address: '', email: 'weston.andrew@fsresidential.com', phone: '' },
];

export const mockJobs: Job[] = [];

export const mockEstimates: Estimate[] = [];

export const mockRouteStops: RouteStop[] = [];

export const mockChatMessages: ChatMessage[] = [];

export const mockQueueMetrics: QueueMetrics = {
  myEstimates: 0,
  urgentJobs: 0,
  partsOrdered: 0,
  completed: 0,
};

export function generateEstimateNumber(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `EST-${year}${month}-${seq}`;
}

export const mockCustomers: { id: string; name: string; email: string; pools?: number; status?: string; phone?: string }[] = [];

export interface SupportiveAction {
  id: string;
  technicianId: string;
  technicianName: string;
  date: string;
  category: 'performance' | 'behavior' | 'safety' | 'attendance' | 'quality';
  severity: 'low' | 'medium' | 'high';
  issueDescription: string;
  actionPlan: string;
  followUpDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  photos?: string[];
}

export const mockSupportiveActions: SupportiveAction[] = [];

export interface TruckInspection {
  id: string;
  truckNumber: string;
  inspectionDate: string;
  technicianId: string;
  technicianName: string;
  mileage: number;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full';
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  damageMarks: DamageMark[];
  checklist: TruckChecklistItem[];
  notes: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface DamageMark {
  id: string;
  view: 'front' | 'rear' | 'driver_side' | 'cargo';
  x: number;
  y: number;
  type: 'dent' | 'scratch' | 'crack' | 'missing' | 'rust' | 'other';
  notes?: string;
}

export interface TruckChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export const truckChecklistItems: TruckChecklistItem[] = [
  { id: '1', label: 'Headlights working', checked: false },
  { id: '2', label: 'Tail lights working', checked: false },
  { id: '3', label: 'Turn signals working', checked: false },
  { id: '4', label: 'Brake lights working', checked: false },
  { id: '5', label: 'Windshield clean/undamaged', checked: false },
  { id: '6', label: 'Mirrors adjusted and clean', checked: false },
  { id: '7', label: 'Tires in good condition', checked: false },
  { id: '8', label: 'Tire pressure checked', checked: false },
  { id: '9', label: 'Oil level checked', checked: false },
  { id: '10', label: 'Coolant level checked', checked: false },
  { id: '11', label: 'Washer fluid filled', checked: false },
  { id: '12', label: 'Brakes functioning properly', checked: false },
  { id: '13', label: 'Horn working', checked: false },
  { id: '14', label: 'Safety equipment present', checked: false },
  { id: '15', label: 'First aid kit present', checked: false },
  { id: '16', label: 'Fire extinguisher present', checked: false },
];

export const mockTruckInspections: TruckInspection[] = [];

export const mockActiveTechnicians: { id: string; name: string; role: string; status: string; location: string; lastUpdate: string }[] = [];

export interface QuickRepair {
  id: string;
  propertyName: string;
  address: string;
  description: string;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  status: 'unassigned' | 'claimed' | 'in_progress' | 'completed';
  assignedTo?: string;
  dueDate: string;
  createdAt: string;
}

export const mockQuickRepairs: QuickRepair[] = [];

export interface DemoNotification {
  id: string;
  role: 'service_tech' | 'supervisor' | 'repair_tech';
  title: string;
  message: string;
  type: 'urgent' | 'warning' | 'info';
  icon: string;
  timestamp: string;
}

export const mockDemoNotifications: DemoNotification[] = [];
