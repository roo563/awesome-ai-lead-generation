/* eslint-disable @typescript-eslint/no-explicit-any */

const ACCOUNT_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const BUSINESS_INFO_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const PERFORMANCE_API = "https://businessprofileperformance.googleapis.com/v1";

async function apiFetch(url: string, accessToken: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`API error ${res.status} for ${url}:`, text);
    return null;
  }
  return res.json();
}

// ---- Core API calls ----

export async function getAccounts(accessToken: string) {
  return apiFetch(`${ACCOUNT_API}/accounts`, accessToken);
}

export async function getLocations(accessToken: string, accountName: string) {
  return apiFetch(
    `${BUSINESS_INFO_API}/${accountName}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,metadata,regularHours,categories`,
    accessToken
  );
}

export async function getReviews(accessToken: string, accountName: string, locationName: string) {
  // The reviews API uses the account-level path
  const locationId = locationName.split("/").pop();
  return apiFetch(
    `${ACCOUNT_API}/${accountName}/locations/${locationId}/reviews`,
    accessToken
  );
}

export async function getDailyMetrics(
  accessToken: string,
  locationName: string,
  startDate: string,
  endDate: string
) {
  const metrics = [
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "BUSINESS_CONVERSATIONS",
    "BUSINESS_DIRECTION_REQUESTS",
    "CALL_CLICKS",
    "WEBSITE_CLICKS",
    "BUSINESS_BOOKINGS",
    "BUSINESS_FOOD_ORDERS",
  ];

  const metricParams = metrics.map((m) => `dailyMetrics=${m}`).join("&");
  const url = `${PERFORMANCE_API}/${locationName}:fetchMultiDailyMetricsTimeSeries?${metricParams}&dailyRange.startDate.year=${startDate.split("-")[0]}&dailyRange.startDate.month=${startDate.split("-")[1]}&dailyRange.startDate.day=${startDate.split("-")[2]}&dailyRange.endDate.year=${endDate.split("-")[0]}&dailyRange.endDate.month=${endDate.split("-")[1]}&dailyRange.endDate.day=${endDate.split("-")[2]}`;

  return apiFetch(url, accessToken);
}

// ---- Data transformation for charts ----

function monthName(m: number): string {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] || `M${m}`;
}

interface DailyMetric {
  dailyMetric: string;
  timeSeries?: {
    datedValues?: Array<{
      date: { year: number; month: number; day: number };
      value?: string;
    }>;
  };
}

function aggregateMetricsByMonth(metricsData: any): Record<string, Record<string, number>> {
  const byMonth: Record<string, Record<string, number>> = {};

  if (!metricsData?.multiDailyMetricTimeSeries) return byMonth;

  for (const series of metricsData.multiDailyMetricTimeSeries as DailyMetric[]) {
    const metric = series.dailyMetric;
    const values = series.timeSeries?.datedValues || [];

    for (const dv of values) {
      const key = `${dv.date.year}-${String(dv.date.month).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = {};
      byMonth[key][metric] = (byMonth[key][metric] || 0) + parseInt(dv.value || "0", 10);
    }
  }

  return byMonth;
}

function aggregateMetricsByDayOfWeek(metricsData: any): Record<string, Record<string, number>> {
  const byDay: Record<string, Record<string, number>> = {};
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!metricsData?.multiDailyMetricTimeSeries) return byDay;

  for (const series of metricsData.multiDailyMetricTimeSeries as DailyMetric[]) {
    const metric = series.dailyMetric;
    const values = series.timeSeries?.datedValues || [];

    for (const dv of values) {
      const d = new Date(dv.date.year, dv.date.month - 1, dv.date.day);
      const dayName = dayNames[d.getDay()];
      if (!byDay[dayName]) byDay[dayName] = {};
      byDay[dayName][metric] = (byDay[dayName][metric] || 0) + parseInt(dv.value || "0", 10);
    }
  }

  return byDay;
}

function getDailyValues(metricsData: any): Array<{ date: string; metrics: Record<string, number> }> {
  const byDate: Record<string, Record<string, number>> = {};

  if (!metricsData?.multiDailyMetricTimeSeries) return [];

  for (const series of metricsData.multiDailyMetricTimeSeries as DailyMetric[]) {
    const metric = series.dailyMetric;
    const values = series.timeSeries?.datedValues || [];

    for (const dv of values) {
      const key = `${dv.date.year}-${String(dv.date.month).padStart(2, "0")}-${String(dv.date.day).padStart(2, "0")}`;
      if (!byDate[key]) byDate[key] = {};
      byDate[key][metric] = parseInt(dv.value || "0", 10);
    }
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, metrics]) => ({ date, metrics }));
}

export function transformMetricsForDashboard(
  metricsData: any,
  reviewsData: any,
  locationData: any
) {
  const monthlyData = aggregateMetricsByMonth(metricsData);
  const weeklyData = aggregateMetricsByDayOfWeek(metricsData);
  const dailyData = getDailyValues(metricsData);

  const sortedMonths = Object.keys(monthlyData).sort();

  // -- Search Views Over Time (Line chart) --
  const searchViews = sortedMonths.map((key) => {
    const d = monthlyData[key];
    return {
      month: monthName(parseInt(key.split("-")[1])),
      direct: (d.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) + (d.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0),
      discovery: (d.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 0) + (d.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 0),
      branded: d.BUSINESS_CONVERSATIONS || 0,
    };
  });

  // -- Customer Actions (Bar chart) --
  const customerActions = sortedMonths.map((key) => {
    const d = monthlyData[key];
    return {
      month: monthName(parseInt(key.split("-")[1])),
      website: d.WEBSITE_CLICKS || 0,
      directions: d.BUSINESS_DIRECTION_REQUESTS || 0,
      calls: d.CALL_CLICKS || 0,
    };
  });

  // -- Photo Views (reuse impressions data as proxy) --
  const photoViews = sortedMonths.map((key) => {
    const d = monthlyData[key];
    return {
      month: monthName(parseInt(key.split("-")[1])),
      owner: d.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0,
      customer: d.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0,
    };
  });

  // -- Reviews processing --
  const reviews = reviewsData?.reviews || [];
  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const starMap: Record<string, number> = {
    ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
  };

  for (const r of reviews) {
    const rating = starMap[r.starRating] || 0;
    if (rating >= 1 && rating <= 5) ratingCounts[rating]++;
  }

  const ratingDistribution = [
    { rating: "5 Stars", count: ratingCounts[5] },
    { rating: "4 Stars", count: ratingCounts[4] },
    { rating: "3 Stars", count: ratingCounts[3] },
    { rating: "2 Stars", count: ratingCounts[2] },
    { rating: "1 Star", count: ratingCounts[1] },
  ];

  // -- Weekly Traffic --
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyTraffic = dayOrder.map((day) => {
    const d = weeklyData[day] || {};
    const total = Object.values(d).reduce((sum, v) => sum + v, 0);
    return { day, visits: total };
  });

  // -- Engagement Metrics (Radar) --
  const totalByMetric: Record<string, number> = {};
  for (const monthVals of Object.values(monthlyData)) {
    for (const [metric, val] of Object.entries(monthVals)) {
      totalByMetric[metric] = (totalByMetric[metric] || 0) + val;
    }
  }

  const engagementMetrics = [
    { category: "Search", value: (totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) + (totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0) },
    { category: "Maps", value: (totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 0) + (totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 0) },
    { category: "Website", value: totalByMetric.WEBSITE_CLICKS || 0 },
    { category: "Calls", value: totalByMetric.CALL_CLICKS || 0 },
    { category: "Directions", value: totalByMetric.BUSINESS_DIRECTION_REQUESTS || 0 },
  ];

  // Normalize engagement for radar (0-100 scale)
  const maxEngagement = Math.max(...engagementMetrics.map((e) => e.value), 1);
  const normalizedEngagement = engagementMetrics.map((e) => ({
    category: e.category,
    value: Math.round((e.value / maxEngagement) * 100),
  }));

  // -- Conversion Funnel --
  const totalImpressions = (totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) +
    (totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0) +
    (totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 0) +
    (totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 0);
  const totalActions = (totalByMetric.WEBSITE_CLICKS || 0) +
    (totalByMetric.CALL_CLICKS || 0) +
    (totalByMetric.BUSINESS_DIRECTION_REQUESTS || 0);
  const totalConversions = (totalByMetric.BUSINESS_BOOKINGS || 0) + (totalByMetric.BUSINESS_FOOD_ORDERS || 0);

  const conversionFunnel = [
    { id: "impressions", label: "Impressions", value: totalImpressions || 1 },
    { id: "views", label: "Profile Views", value: Math.round(totalImpressions * 0.6) || 1 },
    { id: "actions", label: "Actions Taken", value: totalActions || 1 },
    { id: "conversions", label: "Conversions", value: totalConversions || Math.round(totalActions * 0.15) || 1 },
  ];

  // -- Heatmap (day x simplified hours buckets) --
  const performanceHeatmap = dayOrder.map((day) => {
    const d = weeklyData[day] || {};
    // Create hourly buckets from the daily data (distribute evenly for approximation)
    const totalForDay = Object.values(d).reduce((sum, v) => sum + v, 0);
    return {
      id: day,
      data: Array.from({ length: 24 }, (_, hour) => ({
        x: `${hour}:00`,
        y: Math.round(totalForDay * (hour >= 8 && hour <= 20 ? 0.07 : 0.02)),
      })),
    };
  });

  // -- Category Breakdown (Pie) --
  const categoryBreakdown = [
    { id: "Search", label: "Search", value: (totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) + (totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0) },
    { id: "Maps", label: "Maps", value: (totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 0) + (totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 0) },
    { id: "Website", label: "Website", value: totalByMetric.WEBSITE_CLICKS || 0 },
    { id: "Calls", label: "Calls", value: totalByMetric.CALL_CLICKS || 0 },
  ].filter((d) => d.value > 0);
  if (categoryBreakdown.length === 0) {
    categoryBreakdown.push({ id: "No Data", label: "No Data", value: 1 });
  }

  // -- TreeMap --
  const treemapData = {
    name: "interactions",
    children: [
      {
        name: "Discovery",
        children: [
          { name: "Search Views", value: (totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) + (totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0) || 1 },
          { name: "Maps Views", value: (totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 0) + (totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 0) || 1 },
        ],
      },
      {
        name: "Actions",
        children: [
          { name: "Website Clicks", value: totalByMetric.WEBSITE_CLICKS || 1 },
          { name: "Call Clicks", value: totalByMetric.CALL_CLICKS || 1 },
          { name: "Direction Requests", value: totalByMetric.BUSINESS_DIRECTION_REQUESTS || 1 },
        ],
      },
    ],
  };

  // -- Waffle (rating %) --
  const totalReviewCount = reviews.length || 1;
  const waffleData = [
    { id: "5-star", label: "5 Star", value: Math.round((ratingCounts[5] / totalReviewCount) * 100), color: "#B8860B" },
    { id: "4-star", label: "4 Star", value: Math.round((ratingCounts[4] / totalReviewCount) * 100), color: "#C4A265" },
    { id: "3-star", label: "3 Star", value: Math.round((ratingCounts[3] / totalReviewCount) * 100), color: "#D4C5A0" },
    { id: "2-star", label: "2 Star", value: Math.round((ratingCounts[2] / totalReviewCount) * 100), color: "#8B7355" },
    { id: "1-star", label: "1 Star", value: Math.round((ratingCounts[1] / totalReviewCount) * 100), color: "#6B5B3E" },
  ];
  // Ensure total is 100
  const waffleSum = waffleData.reduce((s, d) => s + d.value, 0);
  if (waffleSum < 100 && waffleData[0]) waffleData[0].value += 100 - waffleSum;

  // -- Stream Data --
  const streamData = sortedMonths.map((key) => {
    const d = monthlyData[key];
    return {
      "Search Views": (d.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) + (d.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0),
      "Maps Views": (d.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 0) + (d.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 0),
      "Website Clicks": d.WEBSITE_CLICKS || 0,
      "Phone Calls": d.CALL_CLICKS || 0,
      "Direction Requests": d.BUSINESS_DIRECTION_REQUESTS || 0,
    };
  });

  // -- Sunburst --
  const sunburstData = {
    name: "Business",
    children: [
      {
        name: "Discovery",
        children: [
          { name: "Desktop Search", value: totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 1 },
          { name: "Mobile Search", value: totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 1 },
          { name: "Desktop Maps", value: totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 1 },
          { name: "Mobile Maps", value: totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 1 },
        ],
      },
      {
        name: "Actions",
        children: [
          { name: "Website", value: totalByMetric.WEBSITE_CLICKS || 1 },
          { name: "Calls", value: totalByMetric.CALL_CLICKS || 1 },
          { name: "Directions", value: totalByMetric.BUSINESS_DIRECTION_REQUESTS || 1 },
          { name: "Bookings", value: totalByMetric.BUSINESS_BOOKINGS || 1 },
        ],
      },
    ],
  };

  // -- Scatter Plot (daily website clicks vs impressions) --
  const scatterData = [
    {
      id: "Clicks vs Impressions",
      data: dailyData.slice(-60).map((d) => ({
        x: (d.metrics.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) + (d.metrics.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0),
        y: d.metrics.WEBSITE_CLICKS || 0,
      })),
    },
  ];
  if (scatterData[0].data.length === 0) {
    scatterData[0].data = [{ x: 0, y: 0 }];
  }

  // -- Bump Chart (monthly ranking of channels) --
  const channelKeys = ["Search", "Maps", "Website", "Calls", "Directions"];
  const bumpData = channelKeys.map((channel) => ({
    id: channel,
    data: sortedMonths.map((key) => {
      const d = monthlyData[key];
      const values: Record<string, number> = {
        Search: (d.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) + (d.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0),
        Maps: (d.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 0) + (d.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 0),
        Website: d.WEBSITE_CLICKS || 0,
        Calls: d.CALL_CLICKS || 0,
        Directions: d.BUSINESS_DIRECTION_REQUESTS || 0,
      };
      const sorted = Object.entries(values).sort(([, a], [, b]) => b - a);
      const rank = sorted.findIndex(([k]) => k === channel) + 1;
      return { x: monthName(parseInt(key.split("-")[1])), y: rank };
    }),
  }));

  // -- Swarm Plot --
  const swarmData = dailyData.slice(-30).flatMap((d, i) => {
    const entries = [
      { id: `s${i}`, group: "Search", value: (d.metrics.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) + (d.metrics.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0), volume: 10 },
      { id: `m${i}`, group: "Maps", value: (d.metrics.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 0) + (d.metrics.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 0), volume: 10 },
      { id: `w${i}`, group: "Website", value: d.metrics.WEBSITE_CLICKS || 0, volume: 8 },
      { id: `c${i}`, group: "Calls", value: d.metrics.CALL_CLICKS || 0, volume: 6 },
    ];
    return entries.filter((e) => e.value > 0);
  });
  if (swarmData.length === 0) {
    swarmData.push({ id: "empty", group: "Search", value: 0, volume: 5 });
  }

  // -- Calendar data --
  const calendarData = dailyData.map((d) => {
    const total = Object.values(d.metrics).reduce((s, v) => s + v, 0);
    return { day: d.date, value: total };
  });

  // -- Sankey --
  const sankeyData = {
    nodes: [
      { id: "Desktop Search" },
      { id: "Mobile Search" },
      { id: "Desktop Maps" },
      { id: "Mobile Maps" },
      { id: "Profile" },
      { id: "Website" },
      { id: "Calls" },
      { id: "Directions" },
    ],
    links: [
      { source: "Desktop Search", target: "Profile", value: totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 1 },
      { source: "Mobile Search", target: "Profile", value: totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 1 },
      { source: "Desktop Maps", target: "Profile", value: totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 1 },
      { source: "Mobile Maps", target: "Profile", value: totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 1 },
      { source: "Profile", target: "Website", value: totalByMetric.WEBSITE_CLICKS || 1 },
      { source: "Profile", target: "Calls", value: totalByMetric.CALL_CLICKS || 1 },
      { source: "Profile", target: "Directions", value: totalByMetric.BUSINESS_DIRECTION_REQUESTS || 1 },
    ],
  };

  // -- Chord --
  const chordKeys = ["Search", "Maps", "Website", "Calls", "Directions"];
  const chordMatrix = chordKeys.map((from) => {
    return chordKeys.map((to) => {
      if (from === to) return 0;
      const fromVal = engagementMetrics.find((e) => e.category === from)?.value || 0;
      const toVal = engagementMetrics.find((e) => e.category === to)?.value || 0;
      return Math.round(Math.sqrt(fromVal * toVal) * 0.1) || 1;
    });
  });

  // -- Circle Packing --
  const circlePackingData = {
    name: "Metrics",
    children: [
      {
        name: "Impressions",
        children: [
          { name: "Desktop Search", value: totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 1 },
          { name: "Mobile Search", value: totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 1 },
          { name: "Desktop Maps", value: totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 1 },
          { name: "Mobile Maps", value: totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 1 },
        ],
      },
      {
        name: "Actions",
        children: [
          { name: "Website", value: totalByMetric.WEBSITE_CLICKS || 1 },
          { name: "Calls", value: totalByMetric.CALL_CLICKS || 1 },
          { name: "Directions", value: totalByMetric.BUSINESS_DIRECTION_REQUESTS || 1 },
        ],
      },
    ],
  };

  // -- Marimekko --
  const marimekkoData = sortedMonths.slice(-4).map((key) => {
    const d = monthlyData[key];
    return {
      statement: monthName(parseInt(key.split("-")[1])),
      Search: (d.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) + (d.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0),
      Maps: (d.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 0) + (d.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 0),
      Website: d.WEBSITE_CLICKS || 0,
      Calls: d.CALL_CLICKS || 0,
    };
  });
  if (marimekkoData.length === 0) {
    marimekkoData.push({ statement: "N/A", Search: 1, Maps: 1, Website: 1, Calls: 1 });
  }

  // -- Network --
  const networkNodes = [
    { id: "Business", radius: 20, color: "#B8860B" },
    { id: "Search", radius: Math.max(8, Math.min(18, Math.round(Math.sqrt(totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 1)))), color: "#C4A265" },
    { id: "Maps", radius: Math.max(8, Math.min(18, Math.round(Math.sqrt(totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 1)))), color: "#D4C5A0" },
    { id: "Reviews", radius: Math.max(8, Math.min(16, Math.round(Math.sqrt(reviews.length * 10 || 1)))), color: "#8B7355" },
    { id: "Website", radius: Math.max(8, Math.min(16, Math.round(Math.sqrt(totalByMetric.WEBSITE_CLICKS || 1)))), color: "#6B5B3E" },
    { id: "Calls", radius: Math.max(8, Math.min(14, Math.round(Math.sqrt(totalByMetric.CALL_CLICKS || 1)))), color: "#A0855C" },
    { id: "Directions", radius: Math.max(8, Math.min(14, Math.round(Math.sqrt(totalByMetric.BUSINESS_DIRECTION_REQUESTS || 1)))), color: "#8B6914" },
  ];
  const networkLinks = [
    { source: "Business", target: "Search", distance: 60 },
    { source: "Business", target: "Maps", distance: 60 },
    { source: "Business", target: "Reviews", distance: 70 },
    { source: "Business", target: "Website", distance: 70 },
    { source: "Business", target: "Calls", distance: 70 },
    { source: "Business", target: "Directions", distance: 70 },
  ];

  // -- Recent Reviews --
  const recentReviews = reviews.slice(0, 10).map((r: any) => ({
    author: r.reviewer?.displayName || "Anonymous",
    rating: starMap[r.starRating] || 0,
    text: r.comment || "No comment",
    date: r.createTime ? r.createTime.split("T")[0] : "Unknown",
  }));

  // -- Summary Stats --
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + (starMap[r.starRating] || 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  const reviewsWithReply = reviews.filter((r: any) => r.reviewReply).length;
  const responseRate = reviews.length > 0 ? Math.round((reviewsWithReply / reviews.length) * 100) : 0;

  const summaryStats = {
    totalViews: totalImpressions,
    totalSearches: (totalByMetric.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) + (totalByMetric.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0),
    totalActions,
    avgRating,
    totalReviews: reviews.length,
    responseRate,
  };

  // -- Location info --
  const location = locationData
    ? {
        name: locationData.title || "Your Business",
        address: locationData.storefrontAddress?.addressLines?.join(", ") || "",
        city: locationData.storefrontAddress?.locality || "",
        phone: locationData.phoneNumbers?.primaryPhone || "",
        website: locationData.websiteUri || "",
        category: locationData.categories?.primaryCategory?.displayName || "",
      }
    : null;

  return {
    searchViews,
    customerActions,
    photoViews,
    ratingDistribution,
    weeklyTraffic,
    engagementMetrics: normalizedEngagement,
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
    location,
  };
}
