import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type EngagementDataPoint = {
  name: string;
  likes: number;
  comments: number;
  shares: number;
};

interface EngagementChartProps {
  data: EngagementDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-sm">
        <p className="font-medium text-gray-900">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function EngagementChart({ data }: EngagementChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fill: '#666' }} />
        <YAxis tick={{ fill: '#666' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        <Bar dataKey="likes" name="Likes" fill="#FF5722" radius={[3, 3, 0, 0]} />
        <Bar dataKey="comments" name="Comments" fill="#FFC107" radius={[3, 3, 0, 0]} />
        <Bar dataKey="shares" name="Shares" fill="#E64A19" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
