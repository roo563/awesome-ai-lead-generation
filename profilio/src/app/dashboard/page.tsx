"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { generateDemoData } from "@/lib/google-business";

// Chart imports
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { ResponsiveFunnel } from "@nivo/funnel";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { ResponsiveWaffle } from "@nivo/waffle";
import { ResponsiveStream } from "@nivo/stream";
import { ResponsiveSunburst } from "@nivo/sunburst";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { ResponsiveBump } from "@nivo/bump";
import { ResponsiveSwarmPlot } from "@nivo/swarmplot";
import { ResponsiveCalendar } from "@nivo/calendar";
import { ResponsiveSankey } from "@nivo/sankey";
import { ResponsiveChord } from "@nivo/chord";
import { ResponsiveCirclePacking } from "@nivo/circle-packing";
import { ResponsiveMarimekko } from "@nivo/marimekko";
import { ResponsiveNetwork } from "@nivo/network";
import dynamic from "next/dynamic";

const ReactFrappeChart = dynamic(() => import("react-frappe-charts"), {
  ssr: false,
});

const nivoTheme = {
  background: "transparent",
  text: {
    fontSize: 11,
    fill: "#3E3226",
    fontFamily: "Inter, sans-serif",
  },
  axis: {
    domain: { line: { stroke: "#C4A265", strokeWidth: 1 } },
    ticks: {
      line: { stroke: "#C4A265", strokeWidth: 1 },
      text: { fontSize: 10, fill: "#6B5B3E", fontFamily: "Inter, sans-serif" },
    },
    legend: {
      text: { fontSize: 12, fill: "#3E3226", fontFamily: "Inter, sans-serif" },
    },
  },
  grid: {
    line: { stroke: "rgba(184,134,11,0.1)", strokeWidth: 1 },
  },
  legends: {
    text: { fontSize: 11, fill: "#6B5B3E", fontFamily: "Inter, sans-serif" },
  },
  tooltip: {
    container: {
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(184,134,11,0.2)",
      borderRadius: "12px",
      padding: "12px 16px",
      fontFamily: "Inter, sans-serif",
      fontSize: "12px",
      color: "#3E3226",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    },
  },
};

const goldColors = [
  "#B8860B", "#C4A265", "#D4C5A0", "#8B7355",
  "#6B5B3E", "#A0855C", "#E8DFD0", "#8B6914",
];

type DashboardData = ReturnType<typeof generateDemoData>;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/business-profile");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        setIsDemo(json.isDemo);
      } else {
        setData(generateDemoData());
        setIsDemo(true);
      }
    } catch {
      setData(generateDemoData());
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") fetchData();
  }, [status, router, fetchData]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen luxury-bg flex items-center justify-center">
        <div className="luxury-overlay absolute inset-0" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[var(--color-gold-light)] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70 text-sm" style={{ fontFamily: "var(--font-body)" }}>
            Loading your analytics...
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const lineData = [
    { id: "Direct", color: goldColors[0], data: data.searchViews.map((d) => ({ x: d.month, y: d.direct })) },
    { id: "Discovery", color: goldColors[1], data: data.searchViews.map((d) => ({ x: d.month, y: d.discovery })) },
    { id: "Branded", color: goldColors[2], data: data.searchViews.map((d) => ({ x: d.month, y: d.branded })) },
  ];

  const barData = data.customerActions.map((d) => ({
    month: d.month, Website: d.website, Directions: d.directions, Calls: d.calls,
  }));

  return (
    <div className="min-h-screen luxury-bg relative">
      <div className="luxury-overlay fixed inset-0 z-0" />

      {/* Header */}
      <header className="relative z-10 glass-card mx-4 mt-4 mb-6 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
            Profilio
          </h1>
          {isDemo && (
            <span className="text-xs bg-[var(--color-gold)]/10 text-[var(--color-gold-dark)] px-3 py-1 rounded-full border border-[var(--color-gold)]/20">
              Demo Data
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-[var(--color-dark-brown)]">{session?.user?.name}</p>
            <p className="text-xs text-[var(--color-medium-brown)]">{session?.user?.email}</p>
          </div>
          {session?.user?.image && (
            <img src={session.user.image} alt="Profile" className="w-9 h-9 rounded-full border-2 border-[var(--color-gold-light)]/30" />
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-[var(--color-medium-brown)] hover:text-[var(--color-gold-dark)] transition-colors px-3 py-2 rounded-lg hover:bg-[var(--color-gold)]/5"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="relative z-10 px-4 pb-8 scrollbar-luxury">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: "Total Views", value: data.summaryStats.totalViews.toLocaleString(), icon: "👁" },
            { label: "Total Searches", value: data.summaryStats.totalSearches.toLocaleString(), icon: "🔍" },
            { label: "Total Actions", value: data.summaryStats.totalActions.toLocaleString(), icon: "⚡" },
            { label: "Avg Rating", value: data.summaryStats.avgRating, icon: "⭐" },
            { label: "Total Reviews", value: data.summaryStats.totalReviews.toLocaleString(), icon: "💬" },
            { label: "Response Rate", value: `${data.summaryStats.responseRate}%`, icon: "📊" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-xs text-[var(--color-medium-brown)] uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-2xl font-semibold text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* 1. Line Chart - Search Views */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Search Views Over Time
            </h3>
            <div className="h-72">
              <ResponsiveLine
                data={lineData}
                theme={nivoTheme}
                margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: "point" }}
                yScale={{ type: "linear", min: "auto", max: "auto" }}
                curve="catmullRom"
                axisBottom={{ tickSize: 5, tickPadding: 5, legend: "Month", legendOffset: 36, legendPosition: "middle" }}
                axisLeft={{ tickSize: 5, tickPadding: 5, legend: "Views", legendOffset: -50, legendPosition: "middle" }}
                colors={goldColors}
                pointSize={8}
                pointColor={{ from: "color" }}
                pointBorderWidth={2}
                pointBorderColor={{ from: "serieColor" }}
                enableArea={true}
                areaOpacity={0.1}
                useMesh={true}
                legends={[{ anchor: "bottom-right", direction: "column", translateX: 100, itemWidth: 80, itemHeight: 20, symbolSize: 10, symbolShape: "circle" }]}
              />
            </div>
          </div>

          {/* 2. Bar Chart - Customer Actions */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Customer Actions
            </h3>
            <div className="h-72">
              <ResponsiveBar
                data={barData}
                theme={nivoTheme}
                keys={["Website", "Directions", "Calls"]}
                indexBy="month"
                margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                padding={0.3}
                groupMode="grouped"
                colors={goldColors}
                borderRadius={4}
                axisBottom={{ tickSize: 5, tickPadding: 5, legend: "Month", legendPosition: "middle", legendOffset: 36 }}
                axisLeft={{ tickSize: 5, tickPadding: 5, legend: "Actions", legendPosition: "middle", legendOffset: -50 }}
                legends={[{ dataFrom: "keys", anchor: "bottom-right", direction: "column", translateX: 100, itemWidth: 80, itemHeight: 20, symbolSize: 10 }]}
                animate={true}
              />
            </div>
          </div>

          {/* 3. Pie Chart - Traffic Source */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Traffic Source Breakdown
            </h3>
            <div className="h-72">
              <ResponsivePie
                data={data.categoryBreakdown}
                theme={nivoTheme}
                margin={{ top: 20, right: 80, bottom: 40, left: 80 }}
                innerRadius={0.55}
                padAngle={2}
                cornerRadius={6}
                activeOuterRadiusOffset={8}
                colors={goldColors}
                borderWidth={1}
                borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#3E3226"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: "color" }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#fff"
              />
            </div>
          </div>

          {/* 4. Radar Chart - Engagement */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Engagement Overview
            </h3>
            <div className="h-72">
              <ResponsiveRadar
                data={data.engagementMetrics}
                theme={nivoTheme}
                keys={["value"]}
                indexBy="category"
                maxValue="auto"
                margin={{ top: 30, right: 60, bottom: 30, left: 60 }}
                curve="linearClosed"
                borderWidth={2}
                borderColor={goldColors[0]}
                gridLevels={5}
                gridShape="circular"
                gridLabelOffset={16}
                dotSize={8}
                dotColor={{ theme: "background" }}
                dotBorderWidth={2}
                dotBorderColor={goldColors[0]}
                colors={[goldColors[0]]}
                fillOpacity={0.15}
                blendMode="multiply"
              />
            </div>
          </div>

          {/* 5. Stream Chart - Metrics Flow */}
          <div className="chart-container lg:col-span-2">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Metrics Flow Over Time
            </h3>
            <div className="h-72">
              <ResponsiveStream
                data={data.streamData}
                theme={nivoTheme}
                keys={["Search Views", "Maps Views", "Website Clicks", "Phone Calls", "Direction Requests"]}
                margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                axisBottom={{ tickSize: 5, tickPadding: 5, legend: "Month", legendOffset: 36, legendPosition: "middle" }}
                axisLeft={{ tickSize: 5, tickPadding: 5, legend: "Volume", legendOffset: -50, legendPosition: "middle" }}
                offsetType="diverging"
                colors={goldColors}
                fillOpacity={0.7}
                borderColor={{ theme: "background" }}
                legends={[{ anchor: "bottom-right", direction: "column", translateX: 100, itemWidth: 90, itemHeight: 20, symbolSize: 10 }]}
              />
            </div>
          </div>

          {/* 6. Heatmap - Performance by Day/Hour */}
          <div className="chart-container lg:col-span-2">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Performance Heatmap (Day / Hour)
            </h3>
            <div className="h-80">
              <ResponsiveHeatMap
                data={data.performanceHeatmap}
                theme={nivoTheme}
                margin={{ top: 20, right: 60, bottom: 60, left: 60 }}
                axisTop={null}
                axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45 }}
                colors={{ type: "sequential", scheme: "oranges", minValue: 0, maxValue: 100 }}
                emptyColor="#F5F0E8"
                borderRadius={3}
                borderWidth={1}
                borderColor="rgba(184,134,11,0.1)"
              />
            </div>
          </div>

          {/* 7. Funnel Chart */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Conversion Funnel
            </h3>
            <div className="h-72">
              <ResponsiveFunnel
                data={data.conversionFunnel}
                theme={nivoTheme}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                colors={goldColors}
                borderWidth={8}
                borderColor={{ from: "color", modifiers: [] }}
                borderOpacity={0.3}
                labelColor={{ from: "color", modifiers: [["darker", 3]] }}
                enableBeforeSeparators={true}
                enableAfterSeparators={true}
                beforeSeparatorLength={40}
                afterSeparatorLength={40}
                currentPartSizeExtension={10}
                currentBorderWidth={20}
                motionConfig="gentle"
              />
            </div>
          </div>

          {/* 8. TreeMap */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Interaction Breakdown
            </h3>
            <div className="h-72">
              <ResponsiveTreeMap
                data={data.treemapData}
                theme={nivoTheme}
                identity="name"
                value="value"
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                labelSkipSize={12}
                labelTextColor={{ from: "color", modifiers: [["darker", 3]] }}
                parentLabelPosition="left"
                parentLabelTextColor={{ from: "color", modifiers: [["darker", 3]] }}
                colors={goldColors}
                borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
                borderWidth={2}
                nodeOpacity={0.85}
              />
            </div>
          </div>

          {/* 9. Waffle Chart */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Rating Distribution
            </h3>
            <div className="h-72">
              <ResponsiveWaffle
                data={data.waffleData}
                theme={nivoTheme}
                total={100}
                rows={10}
                columns={10}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                colors={goldColors}
                borderRadius={3}
                borderWidth={1}
                borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
                animate={true}
                motionStagger={2}
                legends={[{ anchor: "bottom", direction: "row", translateY: 0, itemWidth: 70, itemHeight: 14, symbolSize: 10 }]}
              />
            </div>
          </div>

          {/* 10. Sunburst Chart */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Business Metrics Hierarchy
            </h3>
            <div className="h-72">
              <ResponsiveSunburst
                data={data.sunburstData}
                theme={nivoTheme}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                id="name"
                value="value"
                cornerRadius={4}
                borderWidth={2}
                borderColor={{ theme: "background" }}
                colors={goldColors}
                childColor={{ from: "color", modifiers: [["brighter", 0.3]] }}
                enableArcLabels={true}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
              />
            </div>
          </div>

          {/* 11. Scatter Plot */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Reviews vs Views Correlation
            </h3>
            <div className="h-72">
              <ResponsiveScatterPlot
                data={data.scatterData}
                theme={nivoTheme}
                margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: "linear", min: 0, max: "auto" }}
                yScale={{ type: "linear", min: 0, max: "auto" }}
                axisBottom={{ tickSize: 5, tickPadding: 5, legend: "Reviews", legendOffset: 36, legendPosition: "middle" }}
                axisLeft={{ tickSize: 5, tickPadding: 5, legend: "Views", legendOffset: -50, legendPosition: "middle" }}
                colors={goldColors}
                nodeSize={10}
                useMesh={true}
                legends={[{ anchor: "bottom-right", direction: "column", translateX: 100, itemWidth: 100, itemHeight: 20, symbolSize: 10, symbolShape: "circle" }]}
              />
            </div>
          </div>

          {/* 12. Bump Chart */}
          <div className="chart-container lg:col-span-2">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Channel Rankings Over Time
            </h3>
            <div className="h-72">
              <ResponsiveBump
                data={data.bumpData}
                theme={nivoTheme}
                margin={{ top: 20, right: 100, bottom: 50, left: 60 }}
                colors={goldColors}
                lineWidth={3}
                activeLineWidth={5}
                inactiveLineWidth={2}
                inactiveOpacity={0.3}
                pointSize={10}
                activePointSize={14}
                inactivePointSize={6}
                pointColor={{ theme: "background" }}
                pointBorderWidth={3}
                activePointBorderWidth={3}
                pointBorderColor={{ from: "serie.color" }}
                axisBottom={{ tickSize: 5, tickPadding: 5, legend: "Month", legendPosition: "middle", legendOffset: 36 }}
                axisLeft={{ tickSize: 5, tickPadding: 5, legend: "Rank", legendPosition: "middle", legendOffset: -40 }}
              />
            </div>
          </div>

          {/* 13. Sankey Diagram */}
          <div className="chart-container lg:col-span-2">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Customer Journey Flow
            </h3>
            <div className="h-80">
              <ResponsiveSankey
                data={data.sankeyData}
                theme={nivoTheme}
                margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
                colors={goldColors}
                nodeOpacity={1}
                nodeHoverOthersOpacity={0.35}
                nodeThickness={18}
                nodeSpacing={24}
                nodeBorderWidth={0}
                nodeBorderRadius={3}
                linkOpacity={0.4}
                linkHoverOthersOpacity={0.1}
                linkContract={3}
                enableLinkGradient={true}
                labelPosition="outside"
                labelOrientation="horizontal"
                labelPadding={12}
                labelTextColor={{ from: "color", modifiers: [["darker", 1]] }}
              />
            </div>
          </div>

          {/* 14. Calendar Chart */}
          <div className="chart-container lg:col-span-2">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Daily Activity Calendar
            </h3>
            <div className="h-48">
              <ResponsiveCalendar
                data={data.calendarData}
                theme={nivoTheme}
                from="2024-01-01"
                to="2024-12-31"
                emptyColor="#F5F0E8"
                colors={["#E8DFD0", "#D4C5A0", "#C4A265", "#B8860B", "#8B6914"]}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                yearSpacing={40}
                monthBorderColor="#fff"
                dayBorderWidth={2}
                dayBorderColor="#fff"
              />
            </div>
          </div>

          {/* 15. Chord Diagram */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Channel Interactions
            </h3>
            <div className="h-72">
              <ResponsiveChord
                data={data.chordMatrix}
                keys={data.chordKeys}
                theme={nivoTheme}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                padAngle={0.04}
                innerRadiusRatio={0.96}
                innerRadiusOffset={0.02}
                arcOpacity={1}
                arcBorderWidth={1}
                arcBorderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
                ribbonOpacity={0.5}
                ribbonBorderWidth={1}
                ribbonBorderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
                colors={goldColors}
                enableLabel={true}
                label="id"
                labelOffset={12}
                labelRotation={-90}
                labelTextColor={{ from: "color", modifiers: [["darker", 1]] }}
              />
            </div>
          </div>

          {/* 16. Circle Packing */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Metrics Distribution
            </h3>
            <div className="h-72">
              <ResponsiveCirclePacking
                data={data.circlePackingData}
                theme={nivoTheme}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                id="name"
                value="value"
                colors={goldColors}
                childColor={{ from: "color", modifiers: [["brighter", 0.4]] }}
                padding={4}
                enableLabels={true}
                labelsFilter={(n) => n.node.depth === 2}
                labelsSkipRadius={10}
                labelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                borderWidth={1}
                borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
              />
            </div>
          </div>

          {/* 17. Swarm Plot */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Activity Distribution by Channel
            </h3>
            <div className="h-72">
              <ResponsiveSwarmPlot
                data={data.swarmData}
                theme={nivoTheme}
                groups={["Search", "Maps", "Direct", "Social"]}
                value="value"
                valueScale={{ type: "linear", min: 0, max: 100 }}
                size={{ key: "volume", values: [5, 20], sizes: [6, 20] }}
                forceStrength={4}
                simulationIterations={100}
                margin={{ top: 20, right: 40, bottom: 50, left: 60 }}
                colors={goldColors}
                borderColor={{ from: "color", modifiers: [["darker", 0.6]] }}
                axisBottom={{ tickSize: 5, tickPadding: 5, legend: "Channel", legendPosition: "middle", legendOffset: 36 }}
                axisLeft={{ tickSize: 5, tickPadding: 5, legend: "Activity Score", legendPosition: "middle", legendOffset: -50 }}
              />
            </div>
          </div>

          {/* 18. Marimekko Chart */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Quarterly Channel Distribution
            </h3>
            <div className="h-72">
              <ResponsiveMarimekko
                data={data.marimekkoData}
                theme={nivoTheme}
                id="statement"
                value="Search"
                dimensions={[
                  { id: "Search", value: "Search" },
                  { id: "Maps", value: "Maps" },
                  { id: "Direct", value: "Direct" },
                  { id: "Social", value: "Social" },
                ]}
                margin={{ top: 20, right: 80, bottom: 50, left: 80 }}
                colors={goldColors}
                borderWidth={1}
                borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                axisBottom={{ tickSize: 5, tickPadding: 5 }}
                axisLeft={{ tickSize: 5, tickPadding: 5 }}
                legends={[{ anchor: "bottom-right", direction: "column", translateX: 80, itemWidth: 60, itemHeight: 18, symbolSize: 10 }]}
              />
            </div>
          </div>

          {/* 19. Network Diagram */}
          <div className="chart-container lg:col-span-2">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Business Metrics Network
            </h3>
            <div className="h-80">
              <ResponsiveNetwork
                data={{ nodes: data.networkNodes, links: data.networkLinks }}
                theme={nivoTheme}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                linkDistance={(e: { distance?: number }) => e.distance || 60}
                centeringStrength={0.4}
                repulsivity={6}
                nodeSize={(n: { radius?: number }) => n.radius || 10}
                activeNodeSize={(n: { radius?: number }) => (n.radius || 10) * 1.5}
                nodeColor={(e: { color?: string }) => e.color || "#B8860B"}
                nodeBorderWidth={1}
                nodeBorderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
                linkThickness={2}
                linkBlendMode="multiply"
                motionConfig="wobbly"
              />
            </div>
          </div>

          {/* 20. Photo Views - Bar */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Photo Views Comparison
            </h3>
            <ReactFrappeChart
              type="bar"
              colors={["#B8860B", "#C4A265"]}
              height={250}
              data={{
                labels: data.photoViews.map((d) => d.month),
                datasets: [
                  { name: "Owner Photos", values: data.photoViews.map((d) => d.owner) },
                  { name: "Customer Photos", values: data.photoViews.map((d) => d.customer) },
                ],
              }}
            />
          </div>

          {/* 21. Weekly Traffic - Line */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Weekly Traffic Pattern
            </h3>
            <ReactFrappeChart
              type="line"
              colors={["#B8860B"]}
              height={250}
              lineOptions={{ regionFill: 1, dotSize: 5 }}
              data={{
                labels: data.weeklyTraffic.map((d) => d.day),
                datasets: [{ name: "Visits", values: data.weeklyTraffic.map((d) => d.visits) }],
              }}
            />
          </div>

          {/* 22. Rating Breakdown - Percentage */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Rating Breakdown
            </h3>
            <ReactFrappeChart
              type="percentage"
              colors={["#B8860B", "#C4A265", "#D4C5A0", "#8B7355", "#6B5B3E"]}
              height={120}
              data={{
                labels: data.ratingDistribution.map((d) => d.rating),
                datasets: [{ values: data.ratingDistribution.map((d) => d.count) }],
              }}
            />
          </div>

          {/* 23. Activity Heatmap */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Activity Heatmap
            </h3>
            <ReactFrappeChart
              type="heatmap"
              colors={["#D4C5A0", "#C4A265", "#B8860B", "#8B6914", "#6B5B3E"]}
              height={200}
              data={{
                dataPoints: Object.fromEntries(
                  Array.from({ length: 365 }, (_, i) => {
                    const date = new Date(2024, 0, 1);
                    date.setDate(date.getDate() + i);
                    return [Math.floor(date.getTime() / 1000), Math.floor(Math.random() * 5)];
                  })
                ),
                start: new Date(2024, 0, 1),
                end: new Date(2024, 11, 31),
              }}
            />
          </div>

          {/* 24. Combined Metrics - Mixed */}
          <div className="chart-container lg:col-span-2">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Combined Performance Metrics
            </h3>
            <ReactFrappeChart
              type="axis-mixed"
              colors={["#B8860B", "#C4A265", "#8B7355"]}
              height={280}
              data={{
                labels: data.customerActions.map((d) => d.month),
                datasets: [
                  { name: "Website Clicks", chartType: "bar", values: data.customerActions.map((d) => d.website) },
                  { name: "Direction Requests", chartType: "bar", values: data.customerActions.map((d) => d.directions) },
                  { name: "Phone Calls", chartType: "line", values: data.customerActions.map((d) => d.calls) },
                ],
              }}
            />
          </div>

          {/* 25. Source Distribution - Pie */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Source Distribution
            </h3>
            <ReactFrappeChart
              type="pie"
              colors={["#B8860B", "#C4A265", "#D4C5A0", "#8B7355"]}
              height={250}
              data={{
                labels: data.categoryBreakdown.map((d) => d.label),
                datasets: [{ values: data.categoryBreakdown.map((d) => d.value) }],
              }}
            />
          </div>

          {/* 26. Donut Chart */}
          <div className="chart-container">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Actions Donut View
            </h3>
            <ReactFrappeChart
              type={"donut" as "pie"}
              colors={["#B8860B", "#C4A265", "#D4C5A0", "#8B7355", "#6B5B3E"]}
              height={250}
              data={{
                labels: ["Website", "Calls", "Directions", "Bookings", "Messages"],
                datasets: [
                  {
                    values: [
                      data.summaryStats.totalActions * 0.35,
                      data.summaryStats.totalActions * 0.25,
                      data.summaryStats.totalActions * 0.2,
                      data.summaryStats.totalActions * 0.12,
                      data.summaryStats.totalActions * 0.08,
                    ].map(Math.floor),
                  },
                ],
              }}
            />
          </div>

          {/* 27. Recent Reviews */}
          <div className="chart-container lg:col-span-2">
            <h3 className="text-lg mb-4 text-[var(--color-dark-brown)]" style={{ fontFamily: "var(--font-display)" }}>
              Recent Reviews
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto scrollbar-luxury">
              {data.recentReviews.map((review, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/50 border border-[var(--color-glass-border)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-[var(--color-dark-brown)]">{review.author}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i} className="text-[var(--color-gold)] text-xs">★</span>
                      ))}
                      {Array.from({ length: 5 - review.rating }).map((_, i) => (
                        <span key={i} className="text-[var(--color-warm-beige)] text-xs">★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-medium-brown)] leading-relaxed">{review.text}</p>
                  <p className="text-xs text-[var(--color-light-brown)] mt-1">{review.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="text-center py-6">
          <p className="text-xs text-white/30 tracking-widest uppercase">Profilio Analytics Dashboard</p>
        </footer>
      </div>
    </div>
  );
}
