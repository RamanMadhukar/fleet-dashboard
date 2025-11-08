import React from 'react'
import { Map as MapIcon } from 'lucide-react';

const RouteMap = ({ trip }) => {
    if (!trip.routePoints || trip.routePoints.length === 0) {
        return (
            <div className="map-placeholder">
                <MapIcon size={48} />
                <p>No route data available</p>
            </div>
        );
    }

    const latitudes = trip.routePoints.map(p => p.lat);
    const longitudes = trip.routePoints.map(p => p.lng);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    return (
        <div className="route-map">
            <svg viewBox={`${minLng} ${minLat} ${maxLng - minLng} ${maxLat - minLat}`} preserveAspectRatio="xMidYMid meet">
                <polyline
                    points={trip.routePoints.map(p => `${p.lng},${p.lat}`).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="0.001"
                />
                <circle cx={trip.routePoints[0].lng} cy={trip.routePoints[0].lat} r="0.002" fill="#10b981" />
                <circle cx={trip.routePoints[trip.routePoints.length - 1].lng} cy={trip.routePoints[trip.routePoints.length - 1].lat} r="0.002" fill="#ef4444" />
            </svg>
            <div className="map-legend">
                <span><span className="legend-dot start"></span> Start</span>
                <span><span className="legend-dot end"></span> Current/End</span>
            </div>
        </div>
    );
};

export default RouteMap