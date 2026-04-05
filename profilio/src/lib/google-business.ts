export interface BusinessLocation {
  name: string;
  title: string;
  storefrontAddress?: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    regionCode: string;
  };
  websiteUri?: string;
  phoneNumbers?: {
    primaryPhone: string;
  };
  metadata?: {
    mapsUri: string;
    newReviewUri: string;
  };
}

export interface ReviewData {
  name: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
}

export interface MetricValue {
  metric: string;
  totalValue?: {
    metricOption?: string;
    timeDimension?: {
      timeRange: { startTime: string; endTime: string };
    };
    value: number;
  };
  dimensionalValues?: Array<{
    metricOption?: string;
    timeDimension?: {
      timeRange: { startTime: string; endTime: string };
    };
    value: number;
  }>;
}

export interface InsightsData {
  locationMetrics: MetricValue[];
}

const GBP_API_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const GBP_ACCOUNT_API = "https://mybusinessaccountmanagement.googleapis.com/v1";

export async function getAccounts(accessToken: string) {
  const res = await fetch(`${GBP_ACCOUNT_API}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch accounts: ${error}`);
  }
  return res.json();
}

export async function getLocations(accessToken: string, accountId: string) {
  const res = await fetch(
    `${GBP_API_BASE}/${accountId}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,metadata`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch locations: ${error}`);
  }
  return res.json();
}

export async function getReviews(accessToken: string, locationName: string) {
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch reviews: ${error}`);
  }
  return res.json();
}

export async function getInsights(
  accessToken: string,
  locationName: string,
  startDate: string,
  endDate: string
) {
  const body = {
    locationNames: [locationName],
    basicRequest: {
      metricRequests: [
        { metric: "ALL" },
      ],
      timeRange: {
        startTime: startDate,
        endTime: endDate,
      },
    },
  };

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationName}:reportInsights`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch insights: ${error}`);
  }
  return res.json();
}

// Generate demo data for development/demo purposes
export function generateDemoData() {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const searchViews = months.map((month) => ({
    month,
    direct: Math.floor(Math.random() * 500) + 200,
    discovery: Math.floor(Math.random() * 800) + 300,
    branded: Math.floor(Math.random() * 300) + 100,
  }));

  const customerActions = months.map((month) => ({
    month,
    website: Math.floor(Math.random() * 200) + 50,
    directions: Math.floor(Math.random() * 150) + 30,
    calls: Math.floor(Math.random() * 100) + 20,
  }));

  const photoViews = months.map((month) => ({
    month,
    owner: Math.floor(Math.random() * 300) + 100,
    customer: Math.floor(Math.random() * 200) + 50,
  }));

  const ratingDistribution = [
    { rating: "5 Stars", count: Math.floor(Math.random() * 150) + 80 },
    { rating: "4 Stars", count: Math.floor(Math.random() * 80) + 40 },
    { rating: "3 Stars", count: Math.floor(Math.random() * 40) + 10 },
    { rating: "2 Stars", count: Math.floor(Math.random() * 20) + 5 },
    { rating: "1 Star", count: Math.floor(Math.random() * 10) + 2 },
  ];

  const weeklyTraffic = [
    { day: "Mon", visits: Math.floor(Math.random() * 100) + 40 },
    { day: "Tue", visits: Math.floor(Math.random() * 100) + 40 },
    { day: "Wed", visits: Math.floor(Math.random() * 120) + 50 },
    { day: "Thu", visits: Math.floor(Math.random() * 120) + 50 },
    { day: "Fri", visits: Math.floor(Math.random() * 150) + 60 },
    { day: "Sat", visits: Math.floor(Math.random() * 180) + 70 },
    { day: "Sun", visits: Math.floor(Math.random() * 80) + 30 },
  ];

  const engagementMetrics = [
    { category: "Photos", value: Math.floor(Math.random() * 90) + 40 },
    { category: "Posts", value: Math.floor(Math.random() * 70) + 30 },
    { category: "Q&A", value: Math.floor(Math.random() * 60) + 20 },
    { category: "Reviews", value: Math.floor(Math.random() * 85) + 35 },
    { category: "Updates", value: Math.floor(Math.random() * 75) + 25 },
  ];

  const conversionFunnel = [
    { id: "impressions", label: "Impressions", value: Math.floor(Math.random() * 5000) + 8000 },
    { id: "views", label: "Profile Views", value: Math.floor(Math.random() * 3000) + 4000 },
    { id: "actions", label: "Actions Taken", value: Math.floor(Math.random() * 1500) + 2000 },
    { id: "conversions", label: "Conversions", value: Math.floor(Math.random() * 500) + 500 },
  ];

  const performanceHeatmap = Array.from({ length: 7 }, (_, dayIndex) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return {
      id: days[dayIndex],
      data: Array.from({ length: 24 }, (_, hour) => ({
        x: `${hour}:00`,
        y: Math.floor(Math.random() * 100),
      })),
    };
  });

  const categoryBreakdown = [
    { id: "Search", label: "Search", value: Math.floor(Math.random() * 2000) + 1000 },
    { id: "Maps", label: "Maps", value: Math.floor(Math.random() * 1500) + 800 },
    { id: "Direct", label: "Direct", value: Math.floor(Math.random() * 800) + 400 },
    { id: "Referral", label: "Referral", value: Math.floor(Math.random() * 500) + 200 },
  ];

  const treemapData = {
    name: "interactions",
    children: [
      {
        name: "Discovery",
        children: [
          { name: "Search Views", value: Math.floor(Math.random() * 3000) + 1500 },
          { name: "Maps Views", value: Math.floor(Math.random() * 2000) + 1000 },
        ],
      },
      {
        name: "Actions",
        children: [
          { name: "Website Clicks", value: Math.floor(Math.random() * 1000) + 500 },
          { name: "Call Clicks", value: Math.floor(Math.random() * 600) + 300 },
          { name: "Direction Requests", value: Math.floor(Math.random() * 800) + 400 },
        ],
      },
      {
        name: "Engagement",
        children: [
          { name: "Photo Views", value: Math.floor(Math.random() * 1500) + 700 },
          { name: "Review Responses", value: Math.floor(Math.random() * 400) + 200 },
        ],
      },
    ],
  };

  const waffleData = [
    { id: "5-star", label: "5 Star", value: Math.floor(Math.random() * 45) + 35, color: "#B8860B" },
    { id: "4-star", label: "4 Star", value: Math.floor(Math.random() * 25) + 15, color: "#C4A265" },
    { id: "3-star", label: "3 Star", value: Math.floor(Math.random() * 15) + 5, color: "#D4C5A0" },
    { id: "2-star", label: "2 Star", value: Math.floor(Math.random() * 8) + 2, color: "#8B7355" },
    { id: "1-star", label: "1 Star", value: Math.floor(Math.random() * 5) + 1, color: "#6B5B3E" },
  ];

  // Stream chart data
  const streamData = months.map((month) => ({
    month,
    "Search Views": Math.floor(Math.random() * 400) + 200,
    "Maps Views": Math.floor(Math.random() * 300) + 150,
    "Website Clicks": Math.floor(Math.random() * 200) + 80,
    "Phone Calls": Math.floor(Math.random() * 100) + 30,
    "Direction Requests": Math.floor(Math.random() * 150) + 50,
  }));

  // Sunburst data
  const sunburstData = {
    name: "Business",
    children: [
      {
        name: "Discovery",
        children: [
          { name: "Search", value: Math.floor(Math.random() * 3000) + 2000 },
          { name: "Maps", value: Math.floor(Math.random() * 2000) + 1000 },
          { name: "Brand", value: Math.floor(Math.random() * 1000) + 500 },
        ],
      },
      {
        name: "Engagement",
        children: [
          { name: "Photos", value: Math.floor(Math.random() * 1500) + 500 },
          { name: "Posts", value: Math.floor(Math.random() * 800) + 300 },
          { name: "Q&A", value: Math.floor(Math.random() * 600) + 200 },
        ],
      },
      {
        name: "Conversions",
        children: [
          { name: "Calls", value: Math.floor(Math.random() * 800) + 400 },
          { name: "Directions", value: Math.floor(Math.random() * 700) + 300 },
          { name: "Website", value: Math.floor(Math.random() * 1000) + 500 },
          { name: "Bookings", value: Math.floor(Math.random() * 400) + 100 },
        ],
      },
    ],
  };

  // Scatter plot data
  const scatterData = [
    {
      id: "Reviews vs Views",
      data: Array.from({ length: 30 }, () => ({
        x: Math.floor(Math.random() * 100) + 10,
        y: Math.floor(Math.random() * 500) + 50,
      })),
    },
    {
      id: "Rating vs Actions",
      data: Array.from({ length: 30 }, () => ({
        x: Math.floor(Math.random() * 100) + 10,
        y: Math.floor(Math.random() * 500) + 50,
      })),
    },
  ];

  // Bump chart data
  const bumpData = [
    { id: "Search", data: months.map((m, i) => ({ x: m, y: Math.floor(Math.random() * 5) + 1 })) },
    { id: "Maps", data: months.map((m, i) => ({ x: m, y: Math.floor(Math.random() * 5) + 1 })) },
    { id: "Direct", data: months.map((m, i) => ({ x: m, y: Math.floor(Math.random() * 5) + 1 })) },
    { id: "Social", data: months.map((m, i) => ({ x: m, y: Math.floor(Math.random() * 5) + 1 })) },
    { id: "Referral", data: months.map((m, i) => ({ x: m, y: Math.floor(Math.random() * 5) + 1 })) },
  ];

  // Swarm plot data
  const swarmData = Array.from({ length: 60 }, (_, i) => ({
    id: `r${i}`,
    group: ["Search", "Maps", "Direct", "Social"][Math.floor(Math.random() * 4)],
    value: Math.floor(Math.random() * 100),
    volume: Math.floor(Math.random() * 20) + 5,
  }));

  // Calendar data
  const calendarData = Array.from({ length: 365 }, (_, i) => {
    const date = new Date(2024, 0, 1);
    date.setDate(date.getDate() + i);
    return {
      day: date.toISOString().split("T")[0],
      value: Math.floor(Math.random() * 300),
    };
  });

  // Sankey data
  const sankeyData = {
    nodes: [
      { id: "Google Search" },
      { id: "Google Maps" },
      { id: "Direct" },
      { id: "Profile View" },
      { id: "Website Click" },
      { id: "Call" },
      { id: "Directions" },
      { id: "Booking" },
    ],
    links: [
      { source: "Google Search", target: "Profile View", value: Math.floor(Math.random() * 2000) + 1000 },
      { source: "Google Maps", target: "Profile View", value: Math.floor(Math.random() * 1500) + 800 },
      { source: "Direct", target: "Profile View", value: Math.floor(Math.random() * 800) + 400 },
      { source: "Profile View", target: "Website Click", value: Math.floor(Math.random() * 1000) + 500 },
      { source: "Profile View", target: "Call", value: Math.floor(Math.random() * 600) + 300 },
      { source: "Profile View", target: "Directions", value: Math.floor(Math.random() * 800) + 400 },
      { source: "Profile View", target: "Booking", value: Math.floor(Math.random() * 300) + 100 },
    ],
  };

  // Chord data
  const chordMatrix = [
    [0, 120, 80, 50, 30],
    [90, 0, 60, 40, 20],
    [70, 50, 0, 45, 35],
    [40, 30, 55, 0, 25],
    [20, 15, 30, 20, 0],
  ];
  const chordKeys = ["Search", "Maps", "Website", "Calls", "Directions"];

  // Circle packing data
  const circlePackingData = {
    name: "Metrics",
    children: [
      {
        name: "Views",
        children: [
          { name: "Search", value: Math.floor(Math.random() * 5000) + 2000 },
          { name: "Maps", value: Math.floor(Math.random() * 3000) + 1500 },
          { name: "Photos", value: Math.floor(Math.random() * 2000) + 800 },
        ],
      },
      {
        name: "Actions",
        children: [
          { name: "Calls", value: Math.floor(Math.random() * 1000) + 500 },
          { name: "Directions", value: Math.floor(Math.random() * 1200) + 600 },
          { name: "Website", value: Math.floor(Math.random() * 1500) + 700 },
        ],
      },
      {
        name: "Reviews",
        children: [
          { name: "5 Star", value: Math.floor(Math.random() * 800) + 400 },
          { name: "4 Star", value: Math.floor(Math.random() * 400) + 200 },
          { name: "3 Star", value: Math.floor(Math.random() * 200) + 100 },
        ],
      },
    ],
  };

  // Marimekko data
  const marimekkoData = [
    { statement: "Q1", Search: 40, Maps: 30, Direct: 20, Social: 10 },
    { statement: "Q2", Search: 35, Maps: 35, Direct: 18, Social: 12 },
    { statement: "Q3", Search: 38, Maps: 28, Direct: 22, Social: 12 },
    { statement: "Q4", Search: 42, Maps: 32, Direct: 16, Social: 10 },
  ];

  // Network data
  const networkNodes = [
    { id: "Business", radius: 20, color: "#B8860B" },
    { id: "Search", radius: 14, color: "#C4A265" },
    { id: "Maps", radius: 14, color: "#D4C5A0" },
    { id: "Reviews", radius: 12, color: "#8B7355" },
    { id: "Photos", radius: 10, color: "#6B5B3E" },
    { id: "Posts", radius: 10, color: "#A0855C" },
    { id: "Actions", radius: 14, color: "#8B6914" },
    { id: "Website", radius: 10, color: "#C4A265" },
    { id: "Calls", radius: 10, color: "#B8860B" },
    { id: "Directions", radius: 10, color: "#D4C5A0" },
  ];
  const networkLinks = [
    { source: "Business", target: "Search", distance: 60 },
    { source: "Business", target: "Maps", distance: 60 },
    { source: "Business", target: "Reviews", distance: 70 },
    { source: "Business", target: "Photos", distance: 70 },
    { source: "Business", target: "Posts", distance: 70 },
    { source: "Business", target: "Actions", distance: 60 },
    { source: "Actions", target: "Website", distance: 50 },
    { source: "Actions", target: "Calls", distance: 50 },
    { source: "Actions", target: "Directions", distance: 50 },
  ];

  const recentReviews = [
    {
      author: "Sarah M.",
      rating: 5,
      text: "Absolutely fantastic experience! The team went above and beyond.",
      date: "2024-01-15",
    },
    {
      author: "James K.",
      rating: 4,
      text: "Very professional service. Would recommend to others.",
      date: "2024-01-12",
    },
    {
      author: "Emily R.",
      rating: 5,
      text: "Best in the area. Consistent quality every time.",
      date: "2024-01-10",
    },
    {
      author: "Michael D.",
      rating: 3,
      text: "Good overall but wait times could be improved.",
      date: "2024-01-08",
    },
    {
      author: "Lisa P.",
      rating: 5,
      text: "Outstanding! The attention to detail is remarkable.",
      date: "2024-01-05",
    },
  ];

  const summaryStats = {
    totalViews: Math.floor(Math.random() * 10000) + 15000,
    totalSearches: Math.floor(Math.random() * 8000) + 10000,
    totalActions: Math.floor(Math.random() * 3000) + 4000,
    avgRating: (Math.random() * 0.8 + 4.1).toFixed(1),
    totalReviews: Math.floor(Math.random() * 200) + 150,
    responseRate: Math.floor(Math.random() * 20) + 75,
  };

  return {
    searchViews,
    customerActions,
    photoViews,
    ratingDistribution,
    weeklyTraffic,
    engagementMetrics,
    conversionFunnel,
    performanceHeatmap,
    categoryBreakdown,
    treemapData,
    waffleData,
    streamData,
    sunburstData,
    scatterData,
    bumpData,
    swarmData,
    calendarData,
    sankeyData,
    chordMatrix,
    chordKeys,
    circlePackingData,
    marimekkoData,
    networkNodes,
    networkLinks,
    recentReviews,
    summaryStats,
  };
}
