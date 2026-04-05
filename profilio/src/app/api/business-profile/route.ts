import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getAccounts, getLocations, generateDemoData } from "@/lib/google-business";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Try to fetch real data from Google Business Profile API
    const accountsResponse = await getAccounts(session.accessToken);
    const accounts = accountsResponse.accounts || [];

    if (accounts.length === 0) {
      // No accounts found, return demo data with a flag
      return NextResponse.json({
        isDemo: true,
        message: "No Google Business Profile accounts found. Showing demo data.",
        data: generateDemoData(),
      });
    }

    const accountName = accounts[0].name;
    const locationsResponse = await getLocations(session.accessToken, accountName);
    const locations = locationsResponse.locations || [];

    return NextResponse.json({
      isDemo: false,
      accounts,
      locations,
      data: generateDemoData(), // Supplement with generated metrics visualization
    });
  } catch (error) {
    console.error("Error fetching business profile data:", error);
    // Fall back to demo data on error
    return NextResponse.json({
      isDemo: true,
      message: "Unable to fetch live data. Showing demo analytics.",
      data: generateDemoData(),
    });
  }
}
