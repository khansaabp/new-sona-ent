import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../utils/api';
import StatCard from '../components/StatCard';
import './DashboardInsights.css';

const COLORS = ['#00D9C0', '#FFB627', '#5B9DFF', '#4ADE80', '#FF5C5C', '#C792EA', '#5C6E7A', '#F97316', '#22D3EE', '#A78BFA'];

const DashboardInsights = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/customer-insights').then(res => setData(res.data));
  }, []);

  if (!data) return <div className="empty-state">Loading insights...</div>;
const {
  cityDistribution,
  streetDistribution,
  productMentions,
  topKeywords,
  sentimentOverview,
  totalCustomersWithNotes,
  totalCustomersWithAddress
} = data;

const totalSentiments = sentimentOverview
  ? sentimentOverview.positive + sentimentOverview.negative + sentimentOverview.neutral
  : 0;

  const maxKeywordCount = Math.max(...topKeywords.map(k => k.count), 1);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Customer Insights</h1>
          <p className="text-muted">Derived from customer addresses and admin notes</p>
        </div>
      </div>

    <div className="stat-grid">
  <StatCard label="Customers with Address" value={totalCustomersWithAddress} tone="cyan" />
  <StatCard label="Customers with Notes" value={totalCustomersWithNotes} tone="amber" />
  <StatCard label="Products Mentioned in Notes" value={productMentions.length} tone="green" />
</div>

{totalSentiments > 0 && (
  <div className="card sentiment-card">
    <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Note sentiment overview</h2>
    <div className="sentiment-bar">
      {sentimentOverview.positive > 0 && (
        <div
          className="sentiment-segment sentiment-segment--positive"
          style={{ width: `${(sentimentOverview.positive / totalSentiments) * 100}%` }}
          title={`Positive: ${sentimentOverview.positive}`}
        />
      )}
      {sentimentOverview.neutral > 0 && (
        <div
          className="sentiment-segment sentiment-segment--neutral"
          style={{ width: `${(sentimentOverview.neutral / totalSentiments) * 100}%` }}
          title={`Neutral: ${sentimentOverview.neutral}`}
        />
      )}
      {sentimentOverview.negative > 0 && (
        <div
          className="sentiment-segment sentiment-segment--negative"
          style={{ width: `${(sentimentOverview.negative / totalSentiments) * 100}%` }}
          title={`Negative: ${sentimentOverview.negative}`}
        />
      )}
    </div>
    <div className="sentiment-legend">
      <span><span className="sentiment-dot sentiment-dot--positive"></span> Positive ({sentimentOverview.positive})</span>
      <span><span className="sentiment-dot sentiment-dot--neutral"></span> Neutral ({sentimentOverview.neutral})</span>
      <span><span className="sentiment-dot sentiment-dot--negative"></span> Negative ({sentimentOverview.negative})</span>
    </div>
  </div>
)}

      <div className="dash-grid">
        {/* City distribution */}
        <div className="card chart-card">
          <h2>Customers by city</h2>
          {cityDistribution.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>No address data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cityDistribution} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232E38" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#5C6E7A', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="city" type="category" width={100} tick={{ fill: '#93A4B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1A222B', border: '1px solid #232E38', borderRadius: 8, fontSize: 13 }}
                  formatter={(value) => [value, 'Customers']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {cityDistribution.map((entry, index) => (
                    <Cell key={entry.city} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

{/* Street distribution */}
<div className="card chart-card">
  <h2>Customers by area</h2>
  {streetDistribution.length === 0 ? (
    <div className="empty-state" style={{ padding: 24 }}>No address data yet.</div>
  ) : (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={streetDistribution} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232E38" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#5C6E7A', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis dataKey="street" type="category" width={140} tick={{ fill: '#93A4B0', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#1A222B', border: '1px solid #232E38', borderRadius: 8, fontSize: 13 }}
          formatter={(value) => [value, 'Customers']}
        />
        <Bar dataKey="count" fill="#5B9DFF" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )}
</div>

        {/* Product mentions */}
        <div className="card chart-card chart-card--wide">
          <h2>Most mentioned products in customer notes</h2>
          {productMentions.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              No product mentions found yet. Add notes on customer profiles that reference product names.
            </div>
          ) : (
            <div className="mention-list">
              {productMentions.map((p, i) => (
                <div className="mention-item" key={p.name}>
                  <div className="mention-item__rank">#{i + 1}</div>
                  <div className="mention-item__body">
                    <div className="mention-item__name">{p.name}</div>
                    <div className="mention-item__bar-track">
                      <div
                        className="mention-item__bar-fill"
                        style={{ width: `${(p.count / productMentions[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <div className="mention-item__customers text-muted">
                      Mentioned for: {p.customers.slice(0, 3).join(', ')}
                      {p.customers.length > 3 && ` +${p.customers.length - 3} more`}
                    </div>
                  </div>
                  <div className="mention-item__count mono">{p.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Keyword cloud */}
        <div className="card chart-card chart-card--wide">
          <h2>Common themes in customer notes</h2>
          {topKeywords.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>No notes to analyze yet.</div>
          ) : (
            <div className="keyword-cloud">
              {topKeywords.map(k => {
                const scale = 0.75 + (k.count / maxKeywordCount) * 1.25; // font scale between 0.75x and 2x
                return (
                  <span
                    key={k.word}
                    className="keyword-tag"
                    style={{ fontSize: `${scale * 13}px` }}
                    title={`Mentioned ${k.count} time${k.count !== 1 ? 's' : ''}`}
                  >
                    {k.word}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardInsights;