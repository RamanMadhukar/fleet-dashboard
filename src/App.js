// src/App.jsx - ENHANCED VERSION with all features
import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, Truck, AlertTriangle, MapPin, Clock, TrendingUp, Upload, Fuel, Zap } from 'lucide-react';
import './App.css';
import EventTimeline from './components/EventTimeline';
import MetricCard from './components/MetricCard';
import FileUpload from './components/FileUpload';
import TripCard from './components/TripCard';
import RouteMap from './components/RouteMap';
import SpeedChart from './components/SpeedChart';
import FuelChart from './components/FuelChart';
import BatteryChart from './components/BatteryChart';
import TelemetryPanel from './components/TelemetryPanel';

const processEvents = (events, currentTime) => {
  if (!currentTime) return { tripStates: [], visibleEvents: [], telemetryData: {} };

  const visibleEvents = events.filter(event => event.parsedTimestamp <= currentTime);
  const states = {};
  const telemetryData = {};

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
        totalDuration: 0,
        stopDuration: 0,
        refuelingCount: 0,
        signalLosses: 0,
        speedViolations: 0,
        lastTelemetry: null,
        stops: [],
        refuelings: [],
        speedHistory: [],
        fuelHistory: [],
        batteryHistory: [],
        routePoints: []
      };

      telemetryData[tripId] = {
        speedData: [],
        fuelData: [],
        batteryData: [],
        telemetryPoints: []
      };
    }

    const state = states[tripId];
    const telemetry = telemetryData[tripId];
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

        // Add to route points
        if (event.location) {
          state.routePoints.push({
            lat: event.location.lat,
            lng: event.location.lng,
            timestamp: event.parsedTimestamp
          });
        }

        // Add to time series data
        const timeStr = new Date(event.parsedTimestamp).toLocaleTimeString();
        telemetry.speedData.push({ time: timeStr, speed: state.speed });
        telemetry.fuelData.push({ time: timeStr, fuel: state.fuel });
        telemetry.batteryData.push({ time: timeStr, battery: state.battery });

        if (event.overspeed) {
          state.alerts.push({ type: 'overspeed', time: event.parsedTimestamp, data: event });
          state.speedViolations++;
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
        state.alerts.push({ type: 'trip_cancelled', time: event.parsedTimestamp, data: event });
        break;

      case 'vehicle_stopped':
        state.stops.push({ startTime: event.parsedTimestamp, location: event.location });
        state.alerts.push({ type: 'vehicle_stopped', time: event.parsedTimestamp, data: event });
        break;

      case 'vehicle_moving':
        const lastStop = state.stops[state.stops.length - 1];
        if (lastStop && !lastStop.endTime) {
          lastStop.endTime = event.parsedTimestamp;
          lastStop.duration = event.stop_duration_minutes || 0;
          state.stopDuration += lastStop.duration;
        }
        state.alerts.push({ type: 'vehicle_moving', time: event.parsedTimestamp, data: event });
        break;

      case 'speed_violation':
        state.alerts.push({ type: 'speed_violation', time: event.parsedTimestamp, data: event });
        state.speedViolations++;
        break;

      case 'signal_lost':
        state.signalLosses++;
        state.alerts.push({ type: 'signal_lost', time: event.parsedTimestamp, data: event });
        break;

      case 'signal_recovered':
        state.alerts.push({ type: 'signal_recovered', time: event.parsedTimestamp, data: event });
        break;

      case 'refueling_started':
        state.refuelings.push({ startTime: event.parsedTimestamp, location: event.location });
        state.alerts.push({ type: 'refueling_started', time: event.parsedTimestamp, data: event });
        break;

      case 'refueling_completed':
        const lastRefuel = state.refuelings[state.refuelings.length - 1];
        if (lastRefuel && !lastRefuel.endTime) {
          lastRefuel.endTime = event.parsedTimestamp;
          lastRefuel.duration = event.refuel_duration_minutes || 0;
          lastRefuel.fuelAdded = event.fuel_added_percent || 0;
          lastRefuel.finalLevel = event.fuel_level_after_refuel || 0;
          state.refuelingCount++;
          state.fuel = lastRefuel.finalLevel;
        }
        state.alerts.push({ type: 'refueling_completed', time: event.parsedTimestamp, data: event });
        break;

      case 'device_error':
      case 'battery_low':
      case 'fuel_level_low':
        state.alerts.push({ type: event.event_type, time: event.parsedTimestamp, data: event });
        break;

      case 'vehicle_telemetry':
        state.lastTelemetry = event.telemetry;
        telemetry.telemetryPoints.push({
          time: new Date(event.parsedTimestamp).toLocaleTimeString(),
          ...event.telemetry
        });
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

  return { tripStates: Object.values(states), visibleEvents, telemetryData };
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

  const { tripStates, visibleEvents, telemetryData } = useMemo(() =>
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
    const totalViolations = tripStates.reduce((sum, t) => sum + t.speedViolations, 0);
    const totalRefuelings = tripStates.reduce((sum, t) => sum + t.refuelingCount, 0);

    return { total, active, completed, cancelled, over50, over80, totalAlerts, avgSpeed, totalDistance, totalViolations, totalRefuelings };
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

  if (!dataLoaded) {
    return <FileUpload onFilesLoaded={handleFilesLoaded} />;
  }

  const selectedTripData = tripStates.find(t => t.id === selectedTrip);
  const selectedTripTelemetry = selectedTrip ? telemetryData[selectedTrip] : null;

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
            setSelectedTrip(null);
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
        <MetricCard icon={<Zap size={20} />} label="Speed Violations" value={fleetMetrics.totalViolations} color="color-red" />
        <MetricCard icon={<Fuel size={20} />} label="Refuelings" value={fleetMetrics.totalRefuelings} color="color-cyan" />
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

      {selectedTripData && selectedTripTelemetry && (
        <div className="trip-details-enhanced">
          <div className="details-header">
            <h2>{selectedTripData.name}</h2>
            <button onClick={() => setSelectedTrip(null)} className="btn-close">✕</button>
          </div>

          {/* Route Map */}
          <div className="detail-section">
            <RouteMap trip={selectedTripData} />
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <SpeedChart data={selectedTripTelemetry.speedData} />
            <FuelChart data={selectedTripTelemetry.fuelData} />
            <BatteryChart data={selectedTripTelemetry.batteryData} />
          </div>

          {/* Telemetry & Timeline */}
          <div className="telemetry-timeline-grid">
            <TelemetryPanel trip={selectedTripData} />
            <EventTimeline trip={selectedTripData} />
          </div>

          {/* Detailed Stats */}
          <div className="detailed-stats">
            <div className="stats-section">
              <h4><Clock size={18} /> Stop History</h4>
              {selectedTripData.stops.length === 0 ? (
                <p className="empty-message">No stops recorded</p>
              ) : (
                <div className="stops-list">
                  {selectedTripData.stops.map((stop, idx) => (
                    <div key={idx} className="stop-item">
                      <div className="stop-time">
                        {new Date(stop.startTime).toLocaleTimeString()}
                        {stop.endTime && ` - ${new Date(stop.endTime).toLocaleTimeString()}`}
                      </div>
                      {stop.duration && (
                        <div className="stop-duration">{stop.duration} minutes</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="stats-section">
              <h4><Fuel size={18} /> Refueling History</h4>
              {selectedTripData.refuelings.length === 0 ? (
                <p className="empty-message">No refuelings recorded</p>
              ) : (
                <div className="refueling-list">
                  {selectedTripData.refuelings.map((refuel, idx) => (
                    <div key={idx} className="refuel-item">
                      <div className="refuel-time">
                        {new Date(refuel.startTime).toLocaleTimeString()}
                      </div>
                      {refuel.fuelAdded && (
                        <div className="refuel-amount">+{refuel.fuelAdded}% fuel</div>
                      )}
                      {refuel.duration && (
                        <div className="refuel-duration">{refuel.duration} min</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;