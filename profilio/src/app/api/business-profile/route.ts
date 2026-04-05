import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  getAccounts,
  getLocations,
  getReviews,
  getDailyMetrics,
  transformMetricsForDashboard,
} from "@/lib/google-business";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // 1. Get accounts
    const accountsResponse = await getAccounts(session.accessToken);
    const accounts = accountsResponse?.accounts || [];

    if (accounts.length === 0) {
      return NextResponse.json({
        error: "no_accounts",
        message: "No Google Business Profile accounts found for this user.",
      }, { status: 404 });
    }

    const accountName = accounts[0].name;

    // 2. Get locations
    const locationsResponse = await getLocations(session.accessToken, accountName);
    const locations = locationsResponse?.locations || [];

    if (locations.length === 0) {
      return NextResponse.json({
        error: "no_locations",
        message: "No business locations found in your account.",
      }, { status: 404 });
    }

    const location = locations[0];
    const locationName = location.name;

    // 3. Get reviews
    const reviewsData = await getReviews(session.accessToken, accountName, locationName);

    // 4. Get performance metrics (last 6 months)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const metricsData = await getDailyMetrics(
      session.accessToken,
      locationName,
      formatDate(startDate),
      formatDate(endDate)
    );

    // 5. Transform everything for the dashboard
    const dashboardData = transformMetricsForDashboard(
      metricsData,
      reviewsData,
      location
    );

    return NextResponse.json({
      data: dashboardData,
      accountName,
      locationName: location.title || locationName,
    });
  } catch (error) {
    console.error("Error fetching business profile data:", error);
    return NextResponse.json(
      {
        error: "api_error",
        message: "Failed to fetch Google Business Profile data. Please try again.",
      },
      { status: 500 }
    );
  }
}
