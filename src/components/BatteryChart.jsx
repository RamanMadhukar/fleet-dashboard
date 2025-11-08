import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Battery } from 'lucide-react';

const BatteryChart = ({ data }) => {
    const chartData = data.slice(-50);

    return (
        <div className="chart-container">
            <h4><Battery size={18} /> Battery Level</h4>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        labelStyle={{ color: '#94a3b8' }}
                    />
                    <Area type="monotone" dataKey="battery" stroke="#eab308" fill="#eab30833" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BatteryChart