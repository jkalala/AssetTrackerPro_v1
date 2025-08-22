"use client"
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TeamAnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [assets, setAssets] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const teamId = "YOUR_TEAM_ID"; // TODO: Replace with actual team ID from context or route

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      const [summaryRes, assetsRes] = await Promise.all([
        fetch(`/api/teams/${teamId}/analytics/summary`).then(r => r.json()),
        fetch(`/api/teams/${teamId}/analytics/assets`).then(r => r.json()),
      ]);
      setSummary(summaryRes);
      setAssets(assetsRes);
      setLoading(false);
    }
    fetchAnalytics();
  }, [teamId]);

  if (loading) return <div>Loading team analytics...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Analytics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {summary ? (
            <ul className="space-y-2">
              <li>Total Assets: {summary.totalAssets}</li>
              <li>Active Assets: {summary.activeAssets}</li>
              <li>Total Users: {summary.totalUsers}</li>
              <li>Asset Status Breakdown: <pre>{JSON.stringify(summary.assetStatusBreakdown, null, 2)}</pre></li>
              <li>Recent Activity: <pre>{JSON.stringify(summary.recentActivity, null, 2)}</pre></li>
            </ul>
          ) : (
            <div>No summary data.</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Asset Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          {assets ? (
            <ul className="space-y-2">
              <li>By Category: <pre>{JSON.stringify(assets.byCategory, null, 2)}</pre></li>
              <li>Total Value: {assets.totalValue}</li>
              <li>Average Value: {assets.avgValue}</li>
              <li>Assets Added Per Month: <pre>{JSON.stringify(assets.byMonth, null, 2)}</pre></li>
            </ul>
          ) : (
            <div>No asset analytics data.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 