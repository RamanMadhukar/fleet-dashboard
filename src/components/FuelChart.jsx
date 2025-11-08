import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Fuel } from 'lucide-react';

const FuelChart = ({ data }) => {
    const chartData = data.slice(-50);

    return (
        <div className="chart-container">
            <h4><Fuel size={18} /> Fuel Consumption</h4>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        labelStyle={{ color: '#94a3b8' }}
                    />
                    <Area type="monotone" dataKey="fuel" stroke="#10b981" fill="#10b98133" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FuelChart