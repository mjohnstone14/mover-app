import React, { useState, useMemo } from 'react';
import Map, {Layer, Source, Marker, NavigationControl, FullscreenControl, GeolocateControl, ScaleControl, Popup} from 'react-map-gl';
import driverPos from './data/driver-positions.json';
import {Coordinate} from '../interfaces/driverTrackerInterface';
import './App.css';
import flag from './images/flag.svg';
import finish from './images/finish.svg';
import Pin from './pin';

function App() {
  const driverInfo = driverPos['driver'];
  const positions = driverPos['positions'];
  const [coordinates, setCoordinates] = useState();
  const [popupInfo, setPopupInfo] : any = useState({longitude: 0, latitude: 0, timestamp: 'none'});
  const TOKEN = process.env.REACT_APP_MAP_TOKEN;

  const layerStyle : any = {
    id: 'line',
    type: 'line',
    paint: {
      'line-width': 2,
      'line-color': '#007cbf',
    }
  }
  
  /**
   * Function to filter positions on every minute and omit those that share the same minute timestamp
   * @param positions 
   * @returns 
   */
  function filterPositions(positions: Array<Coordinate>) {
    const filteredPositions = [{longitude: 0, latitude: 0, timestamp: 'none'}];
    let lastMinute = -1;
  
    positions.forEach(position => {
      const minute = new Date(position.timestamp).getMinutes();
  
      if (minute !== lastMinute) {
        filteredPositions.push(position);
        lastMinute = minute;
      }
    });
  
    return filteredPositions;
  }
  let pinPositions : Array<Coordinate> = filterPositions(driverPos['positions']);

  /**
   * Generates pins with onClick functionality to view driver information
   * using pin positions filtered on every minute
   */
  const pins = useMemo(
    () => 
      pinPositions.map((position, index) => (
        <Marker
          key={`marker-${index}`}
          longitude={position.longitude}
          latitude={position.latitude}
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation();
            setPopupInfo(position);
          }}
        >
          <Pin />
        </Marker>
      )),
    [pinPositions]
  );

  /**
   * Generate GeoJSON to plot a line mapping the driver's route from
   * start to finish
   */
  const plotLineFromDriverData = () => {
    const driverGeojson : any = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      ],
      properties: {
        driverInfo
      }
    }

    for(let i = 0; i < positions.length; i++) {
      const coord : Coordinate = positions[i];
      let current = [coord.longitude, coord.latitude]
      driverGeojson['features'][0]['geometry']['coordinates'] = [...driverGeojson['features'][0]['geometry']['coordinates'], current]
    }
    setCoordinates(driverGeojson);
    return driverGeojson;
  }

  const load = () => {
    plotLineFromDriverData();
  }

  return (
    <div className="App">
      <header className="App-header">
        Mover Driver Tracker
      </header>
      <Map
        initialViewState={{
          longitude: positions[0].longitude,
          latitude: positions[0].latitude,
          zoom: 12
        }}
        style={{width: '100vw', height: '90vh'}}
        mapStyle="mapbox://styles/mapbox/streets-v9"
        mapboxAccessToken={TOKEN}
        onLoad={load}
      > 
        <GeolocateControl position="top-left"/>
        <FullscreenControl position="top-left"/>
        <NavigationControl position="top-left"/>
        <ScaleControl/>
        
        <Marker longitude={positions[0].longitude} latitude={positions[0].latitude} anchor="bottom">
          JOURNEY START <img alt="start" src={flag}/>
        </Marker>
        <Marker longitude={positions[positions.length-1].longitude} latitude={positions[positions.length-1].latitude} anchor="bottom">
          JOURNEY END <img alt="finish" src={finish}/>
        </Marker>

        <Source id="driverNav" type="geojson" data={coordinates}>
          <Layer {...layerStyle}/>
        </Source>

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={Number(popupInfo.longitude)}
            latitude={Number(popupInfo.latitude)}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            closeOnMove={false}
          >
            <div>
              <h4>ID: {driverInfo.id}</h4>
              <p>Driver: {driverInfo.name}</p>
              <p>OS: {driverInfo.os} v{driverInfo.version}</p>
              <p>Timestamp: {new Date(popupInfo.timestamp).toString()}</p>
              <h4>Phone:</h4>
              <p>Number: {driverInfo.phone.countryCallingCode}-{driverInfo.phone.nationalNumber}</p>
            </div>
          </Popup>
        )}
        {pins}
      </Map>
    </div>
  );
}

export default App;
