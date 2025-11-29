// --- Constants ---
export const ROOMS = [
  "Kitchen",
  "Master Bath",
  "Living Room",
  "Guest Bedroom",
  "Exterior",
];
export const CATEGORIES = [
  "Materials",
  "Labor",
  "Permits",
  "Decor",
  "Fixtures",
  "Tools",
];
export const PAYMENT_METHODS = [
  "Credit Card",
  "Debit",
  "Cash",
  "Bank Transfer",
  "Check",
  "Finance", // Added Finance
];

export const PHASES = [
  "Planning",
  "Demolition",
  "Rough-in",
  "Drywall & Paint",
  "Finishes",
  "Inspection",
];

// --- Initial Data ---
export const INITIAL_BUDGET_ITEMS = [
  {
    id: 1,
    name: "Dumpster Rental",
    category: "Permits",
    room: "Exterior",
    estimated: 400,
    actual: 450,
    paid: true,
    paymentMethod: "Credit Card",
    date: "2023-10-15",
    notes: "Need to call for pickup",
  },
  {
    id: 2,
    name: "Oak Flooring",
    category: "Materials",
    room: "Living Room",
    estimated: 2500,
    actual: 0,
    paid: false,
    paymentMethod: "-",
    date: "-",
    notes: "Waiting for sale at Home Depot",
  },
  {
    id: 3,
    name: "Contractor Deposit",
    category: "Labor",
    room: "Kitchen",
    estimated: 1000,
    actual: 1000,
    paid: true,
    paymentMethod: "Bank Transfer",
    date: "2023-10-20",
    notes: "50% upfront",
  },
  {
    id: 4,
    name: "Paint & Primer",
    category: "Materials",
    room: "Kitchen",
    estimated: 300,
    actual: 0,
    paid: false,
    paymentMethod: "-",
    date: "-",
    notes: "Color: Chantilly Lace",
  },
  {
    id: 5,
    name: "New Vanity",
    category: "Fixtures",
    room: "Master Bath",
    estimated: 800,
    actual: 750,
    paid: true,
    paymentMethod: "Credit Card",
    date: "2023-10-25",
    notes: "Got open box discount",
  },
];

export const INITIAL_TIMELINE = [
  {
    id: 1,
    title: "Design & Permitting",
    phase: "Planning",
    startDate: "2023-10-01",
    endDate: "2023-10-10",
    status: "completed",
    assignee: "Homeowner",
    notes: "Permits approved by city",
  },
  {
    id: 2,
    title: "Demolition & Cleanup",
    phase: "Demolition",
    startDate: "2023-10-15",
    endDate: "2023-10-18",
    status: "completed",
    assignee: "Demo Crew",
    notes: "Dumpster full",
  },
  {
    id: 3,
    title: "Electrical Rough-in",
    phase: "Rough-in",
    startDate: "2023-10-20",
    endDate: "2023-10-22",
    status: "completed",
    assignee: "Sparky Electric",
    notes: "Added island pendant box",
  },
  {
    id: 4,
    title: "Plumbing Rough-in",
    phase: "Rough-in",
    startDate: "2023-10-24",
    endDate: "2023-10-26",
    status: "in-progress",
    assignee: "Joe Plumber",
    notes: "Waiting on shower valve",
  },
  {
    id: 5,
    title: "Drywall Installation",
    phase: "Drywall & Paint",
    startDate: "2023-11-01",
    endDate: "2023-11-04",
    status: "pending",
    assignee: "FastWalls Inc",
    notes: "",
  },
  {
    id: 6,
    title: "Painting Walls",
    phase: "Drywall & Paint",
    startDate: "2023-11-05",
    endDate: "2023-11-07",
    status: "pending",
    assignee: "DIY",
    notes: "Buy rollers",
  },
  {
    id: 7,
    title: "Cabinet Installation",
    phase: "Finishes",
    startDate: "2023-11-15",
    endDate: "2023-11-18",
    status: "pending",
    assignee: "Kitchen Pro",
    notes: "Delivery confirmed for 14th",
  },
];

export const INITIAL_ACTIVITY = [
  { id: 1, text: "Paid 'Demolition Crew'", time: "2h ago", type: "money" },
  { id: 2, text: "Updated timeline dates", time: "Yesterday", type: "edit" },
  {
    id: 3,
    text: "Uploaded 3 new inspiration photos",
    time: "Yesterday",
    type: "upload",
  },
  {
    id: 4,
    text: "Added 'Granite' to budget",
    time: "2 days ago",
    type: "edit",
  },
  { id: 5, text: "Design Studio session", time: "3 days ago", type: "ai" },
];

export const INITIAL_GALLERY = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80",
    label: "Target Concept",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=400&q=80",
    label: "Light Fixtures",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=400&q=80",
    label: "Countertop Sample",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80",
    label: "Paint Swatch",
  },
];
