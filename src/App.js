// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, Truck, AlertTriangle, MapPin, Gauge, Clock, TrendingUp, Upload } from 'lucide-react';
import './App.css';
import FileUpload from './components/FileUpload';
import MetricCard from './components/MetricCard';
import TripCard from './components/TripCard';

const processEvents = (events, currentTime) => {
  if (!currentTime) return { tripStates: [], visibleEvents: [] };

  const visibleEvents = events.filter(event => event.parsedTimestamp <= currentTime);
  const states = {};

  visibleEvents.forEach(event => {
    const tripId = event.trip_id;

    if (!states[tripId]) {
      states[tripId] = {
        id: tripId,
        name: event.tripName || tripId,
        vehicle: event.vehicle_id,
        driver: event.driver_name || 'Unknown Driver',
        progress: 0,
        distance: 0,
        speed: 0,
        fuel: 100,
        battery: 100,
        status: 'active',
        lastUpdate: null,
        alerts: [],
        eventCount: 0,
        lastLocation: null,
        heading: 0,
        signalQuality: 'unknown',
        totalDuration: 0
      };
    }

    const state = states[tripId];
    state.eventCount++;
    state.lastUpdate = event.parsedTimestamp;

    // Update based on event type
    switch (event.event_type) {
      case 'location_ping':
        state.lastLocation = event.location;
        state.speed = event.movement?.speed_kmh || 0;
        state.heading = event.movement?.heading_degrees || 0;
        state.distance = event.distance_travelled_km || 0;
        state.signalQuality = event.signal_quality || 'unknown';
        state.battery = event.device?.battery_level || state.battery;
        if (event.overspeed) {
          state.alerts.push({ type: 'overspeed', time: event.parsedTimestamp });
        }
        break;

      case 'trip_started':
        state.status = 'active';
        state.startTime = event.parsedTimestamp;
        break;

      case 'trip_completed':
        state.status = 'completed';
        state.distance = event.total_distance_km || state.distance;
        state.totalDuration = event.total_duration_hours || 0;
        state.fuel = 100 - (event.fuel_consumed_percent || 0);
        state.progress = 100;
        break;

      case 'trip_cancelled':
        state.status = 'cancelled';
        state.progress = (state.distance / 5000) * 100;
        break;

      case 'speed_violation':
      case 'device_error':
      case 'battery_low':
      case 'fuel_level_low':
        state.alerts.push({ type: event.event_type, time: event.parsedTimestamp });
        break;
      default:
        break;
    }

    // Calculate progress for active trips
    if (state.status === 'active' && state.distance > 0) {
      state.progress = Math.min(100, (state.distance / 5000) * 100);
    }

    // Estimate fuel consumption
    if (state.status === 'active' && state.distance > 0) {
      state.fuel = Math.max(0, 100 - (state.distance / 5000) * 90);
    }
  });

  return { tripStates: Object.values(states), visibleEvents };
};

function App() {
  const [allEvents, setAllEvents] = useState([]);
  const [currentTime, setCurrentTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const handleFilesLoaded = (events) => {
    setAllEvents(events);
    if (events.length > 0) {
      setCurrentTime(events[0].parsedTimestamp);
      setDataLoaded(true);
    }
  };

  const { tripStates, visibleEvents } = useMemo(() =>
    processEvents(allEvents, currentTime),
    [allEvents, currentTime]
  );

  const fleetMetrics = useMemo(() => {
    const total = tripStates.length;
    const active = tripStates.filter(t => t.status === 'active').length;
    const completed = tripStates.filter(t => t.status === 'completed').length;
    const cancelled = tripStates.filter(t => t.status === 'cancelled').length;
    const over50 = tripStates.filter(t => t.progress >= 50).length;
    const over80 = tripStates.filter(t => t.progress >= 80).length;
    const totalAlerts = tripStates.reduce((sum, t) => sum + t.alerts.length, 0);
    const avgSpeed = total > 0 ? tripStates.reduce((sum, t) => sum + t.speed, 0) / total : 0;
    const totalDistance = tripStates.reduce((sum, t) => sum + t.distance, 0);

    return { total, active, completed, cancelled, over50, over80, totalAlerts, avgSpeed, totalDistance };
  }, [tripStates]);

  useEffect(() => {
    if (!isPlaying || allEvents.length === 0) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + (1000 * playbackSpeed);
        const maxTime = Math.max(...allEvents.map(e => e.parsedTimestamp));

        if (next >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, allEvents]);

  const handleReset = () => {
    if (allEvents.length > 0) {
      setCurrentTime(Math.min(...allEvents.map(e => e.parsedTimestamp)));
      setIsPlaying(false);
    }
  };

  const formatEventType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!dataLoaded) {
    return <FileUpload onFilesLoaded={handleFilesLoaded} />;
  }

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1 className="title">
            <Truck />
            Fleet Tracking Dashboard
          </h1>
          <p className="subtitle">Real-time monitoring of {fleetMetrics.total} simultaneous trips</p>
        </div>
        <button
          onClick={() => {
            setDataLoaded(false);
            setAllEvents([]);
            setCurrentTime(null);
          }}
          className="btn-upload"
        >
          <Upload size={18} />
          Load New Data
        </button>
      </div>

      <div className="metrics-grid">
        <MetricCard icon={<Truck size={20} />} label="Active Trips" value={fleetMetrics.active} color="color-green" />
        <MetricCard icon={<TrendingUp size={20} />} label="Completed" value={fleetMetrics.completed} color="color-blue" />
        <MetricCard icon={<AlertTriangle size={20} />} label="Cancelled" value={fleetMetrics.cancelled} color="color-red" />
        <MetricCard icon={<MapPin size={20} />} label=">50% Done" value={fleetMetrics.over50} color="color-yellow" />
        <MetricCard icon={<MapPin size={20} />} label=">80% Done" value={fleetMetrics.over80} color="color-orange" />
        <MetricCard icon={<AlertTriangle size={20} />} label="Total Alerts" value={fleetMetrics.totalAlerts} color="color-red" />
        <MetricCard icon={<Gauge size={20} />} label="Avg Speed" value={`${Math.round(fleetMetrics.avgSpeed)} km/h`} color="color-cyan" />
        <MetricCard icon={<TrendingUp size={20} />} label="Total Distance" value={`${Math.round(fleetMetrics.totalDistance)} km`} color="color-purple" />
      </div>

      <div className="playback-controls">
        <div className="controls-left">
          <button onClick={() => setIsPlaying(!isPlaying)} className="btn-play">
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button onClick={handleReset} className="btn-reset">
            <RotateCcw size={24} />
          </button>
          <div className="time-display">
            <Clock size={20} />
            <span>{new Date(currentTime).toLocaleString()}</span>
          </div>
        </div>
        <div className="controls-right">
          {[1, 5, 10, 50, 100].map(speed => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`btn-speed ${playbackSpeed === speed ? 'active' : ''}`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className="progress-info">
        Processing {visibleEvents.length.toLocaleString()} of {allEvents.length.toLocaleString()} events
      </div>

      <div className="trips-grid">
        {tripStates.map(trip => (
          <TripCard
            key={trip.id}
            trip={trip}
            isSelected={selectedTrip === trip.id}
            onClick={() => setSelectedTrip(selectedTrip === trip.id ? null : trip.id)}
          />
        ))}
      </div>

      {selectedTrip && (
        <div className="trip-details">
          <h3>Trip Details: {tripStates.find(t => t.id === selectedTrip)?.name}</h3>
          <div className="events-grid">
            {visibleEvents
              .filter(e => e.trip_id === selectedTrip)
              .slice(-12)
              .reverse()
              .map((event, idx) => (
                <div key={idx} className="event-card">
                  <div className="event-time">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="event-type">
                    {formatEventType(event.event_type)}
                  </div>
                  {event.movement && (
                    <div className="event-data">
                      <div>Speed: {Math.round(event.movement.speed_kmh)} km/h</div>
                      <div>Heading: {Math.round(event.movement.heading_degrees)}°</div>
                    </div>
                  )}
                  {event.location && (
                    <div className="event-location">
                      📍 {event.location.lat.toFixed(4)}, {event.location.lng.toFixed(4)}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;