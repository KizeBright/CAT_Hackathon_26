import { useState } from 'react';
import { Card } from '../components/ui/primitives';
import { StatCard } from '../components/ui/StatCard';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { buildForecast } from '../lib/business';
import { historicalRentalsByType } from '../data/mockData';

const TYPES = Object.keys(historicalRentalsByType);

const insightColors: Record<string, string> = {
  warning: 'border-l-orange-400 bg-orange-50',
  info: 'border-l-blue-400 bg-blue-50',
  success: 'border-l-green-400 bg-green-50',
};

export default function DemandForecast() {
  const [selectedType, setSelectedType] = useState(TYPES[0]);
  const forecastData = buildForecast(selectedType);

  const lastHistorical = forecastData.filter(d => d.historical !== null).slice(-1)[0];
  const firstForecast = forecastData.find(d => d.forecast !== null && d.historical === null);
  const peakForecast = forecastData.reduce((max, d) => (d.forecast ?? 0) > (max.forecast ?? 0) ? d : max, forecastData[0]);
  const trend = firstForecast && lastHistorical
    ? (((firstForecast.forecast ?? 0) - (lastHistorical.historical ?? 0)) / (lastHistorical.historical ?? 1) * 100).toFixed(1)
    : '0';

  const insights = [
    { icon: '📈', title: `${selectedType} Demand Trend`, text: `Forecast shows ${parseFloat(trend) > 0 ? '+' : ''}${trend}% change from last historical month. Moving average window: 3 months.`, type: parseFloat(trend) > 5 ? 'warning' : 'info' },
    { icon: '🏗️', title: 'Peak Demand Month', text: `Highest forecasted demand: ${peakForecast.month} with ${peakForecast.forecast?.toFixed(1)} units. Pre-position equipment accordingly.`, type: 'warning' },
    { icon: '✅', title: 'Forecast Method', text: '3-month moving average with +3% monthly growth trend applied. Replace with ML model by swapping buildForecast() in src/lib/business.ts.', type: 'success' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-secondary uppercase tracking-tight">Demand Forecast</h1>
        <p className="text-gray-500 text-sm mt-0.5">Moving-average projection from historical rental data</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Forecast Trend" value={`${parseFloat(trend) > 0 ? '+' : ''}${trend}%`} icon={<TrendingUp size={18} />} change="vs last historical month" trend={parseFloat(trend) > 0 ? 'up' : 'down'} />
        <StatCard label="Peak Month" value={peakForecast.month} icon={<AlertTriangle size={18} />} change={`${peakForecast.forecast?.toFixed(1)} units projected`} trend="neutral" />
        <StatCard label="Forecast Window" value="3-mo MA" icon={<CheckCircle size={18} />} change="Moving average method" trend="neutral" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold text-secondary text-sm uppercase tracking-wide">Historical vs Forecasted Demand</h3>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white">
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="historical" fill="#000000" radius={[2, 2, 0, 0]} name="Historical" />
            <Line type="monotone" dataKey="forecast" stroke="#FFCD11" strokeWidth={2.5}
              strokeDasharray="6 3" dot={{ fill: '#FFCD11', r: 4 }} name="Forecast (3-mo MA)" connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-2">Dashed line = moving-average forecast · Bars = actual historical rentals</p>
      </Card>

      <div>
        <h3 className="font-semibold text-secondary mb-3 text-sm uppercase tracking-wide">Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.map((ins, i) => (
            <div key={i} className={`rounded-sm border-l-4 p-4 ${insightColors[ins.type]}`}>
              <div className="flex items-start gap-2">
                <span className="text-xl">{ins.icon}</span>
                <div>
                  <p className="font-bold text-sm text-secondary">{ins.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{ins.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
