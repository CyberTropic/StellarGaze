//Displays parks google map
import React, { Component, createRef } from "react";
// import PropTypes from "prop-types";
// import Modal from "react-modal";
// import ReactDOM from "react-dom";
import ParkMapModal from "./ParkMapModal";
import Reviews from "./Reviews";
import FavPark from "./FavPark";

/* Notes:
Couldn't figure out how to make google.etc work, 
instead you have to use window.google.etc
*/

// const google = window.google;

class ParkMap extends Component {
	state = {
		mapLoaded: false
	};

	//Initialize google map here
	googleMapRef = createRef();

	constructor(props) {
		super(props);
		this.parkModalChild = React.createRef();
		this.modalContent = "No content";
		this.markers = [];
		// this.currentLocationMarker = null;
	}

	componentDidMount() {
		const googleMapScript = document.createElement("script");
		//NOTE: Find a better way to secure the api key
		googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${
			process.env.REACT_APP_DUSTINMAPKEY //TODO: See if this can be hidden better
		}`;
		window.document.body.appendChild(googleMapScript);
		googleMapScript.addEventListener("load", () => {
			this.googleMap = this.createGoogleMap();
			this.googleMapBounds = new window.google.maps.LatLngBounds();
			// this.googleMapInfowindow = null;
			this.googleMap.setOptions({ styles: styleSelector.lunar });
			this.setState({ mapLoaded: true });
			this.props.onMapLoaded(this.googleMap);
		});
	}

	createGoogleMap = () => {
		return new window.google.maps.Map(this.googleMapRef.current, {
			zoom: 10,
			center: {
				lat: 43.64,
				lng: -79.38
			}
			//disableDefaultUI: true
		});
	};

	/**
	 * Add marker to initial location, passed in through prop
	 */
	addCurrentLocationMarker = () => {
		let location = {
			lat: this.props.location.lat,
			lng: this.props.location.lng
		};
		this.props.markers.currentLocation = new window.google.maps.Marker({
			position: location,
			icon: {
				url:
					"http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png",
				anchor: new window.google.maps.Point(15, 17)
			},
			map: this.googleMap
		});
	};

	//Unfortunately, due to the way markers are, opening modal needs to be done from here
	openModal = content => {
		this.parkModalChild.current.openModal(content);
	};

	closeModal = () => {
		this.parkModalChild.current.closeModal();
	};

	/**
	 * Create a marker for the park on this.googleMap object.
	 * Additionally, creates infobox listener, adds park coordinate to map bounds,
	 * and pushes the marker object into this.parks array
	 */
	addParkMarker = park => {
		//TODO: See if possible to modularize this function
		//MAKE SURE ITS A FLOAT FROM DATABASE!

		let location = { lat: parseFloat(park.lat), lng: parseFloat(park.lng) };

		if (this.props.markers[park.id]) {
			console.log("Park marker already on map!");
		} else {
			var marker = new window.google.maps.Marker({
				position: location,
				map: this.googleMap,
				title: park.name,
				icon: {
					url: `http://maps.google.com/mapfiles/kml/paddle/${park.cluster +
						1}-lv.png`
				}
				// icon: {
				// 	url:
				// 		park.name === "Unknown"
				// 			? "http://maps.google.com/mapfiles/kml/pal2/icon12.png"
				// 			: "http://maps.google.com/mapfiles/kml/pal2/icon4.png",
				// 	anchor: new window.google.maps.Point(16, 16),
				// 	scaledSize: new window.google.maps.Size(21, 21)
				// }
			});

			marker.addListener("click", () => {
				console.log("Clicked marker at", marker.title);
				let lighPolStatus = () => {
					if (park.light_pol > 2) {
						return <b className="bg-danger text-white">bad</b>;
					} else if (park.light_pol > 1) {
						return <b className="bg-warning text-dark">okay</b>;
					} else {
						return <b className="bg-success text-white">perfect</b>;
					}
				};
				let newModalContent = (
					<React.Fragment>
						<div className="modal-header">
							<h1>
								{park.name === "Unknown" && park.name_alt
									? park.name_alt
									: park.name}
							</h1>
						</div>
						<FavPark parkID={park.id} />
						<div className="modal-body">
							<img
								src={
									"https://placeimg.com/400/400/nature?" +
									Math.random()
								}
								className="img-responsive"
							/>
							<p>
								{" "}
								This park is located at {location.lat},{" "}
								{location.lng}. The light pollution level here
								is {park.light_pol}, which is {lighPolStatus()}.{" "}
							</p>
							<Reviews parkID={park.id} />
						</div>
					</React.Fragment>
				);
				this.openModal(newModalContent);
			});
			this.props.markers[park.id] = marker; //Maybe this can be moved out of the function
		}
	};

	/**
	 * Center map on initial location passed in through prop
	 */
	centerMap = () => {
		if (
			Object.keys(this.props.markers).length > 1 &&
			this.props.markers.currentLocation
		) {
			this.googleMap.panToBounds(this.googleMapBounds);
			this.googleMap.fitBounds(this.googleMapBounds);
		} else {
			this.googleMap.setCenter(
				this.props.markers.currentLocation.position
			);
			this.googleMap.setZoom(10);
		}
	};

	loadMarkers = () => {
		//Clear existing markers
		//TODO: Definitely possible to optimize
		// -Not deleting markers when there's no change? But then have to check for changes
		console.log("#Markers:", Object.keys(this.props.markers).length);
		if (this.props.markers.currentLocation) {
			this.props.markers.currentLocation.setMap(null);
			delete this.props.markers.currentLocation;
		}
		// console.log(this.props.parkList.map(park => park.id.toString()));
		for (let markerKey in this.props.markers) {
			if (
				!this.props.parkList
					.map(park => park.id.toString())
					.includes(markerKey)
			) {
				// console.log("Deleting marker:", markerKey);
				this.props.markers[markerKey].setMap(null);
				delete this.props.markers[markerKey];
			}
		}

		//Add new markers if possible
		if (this.props.location.length !== 0) {
			console.log("Adding markers..");
			// this.googleMapBounds = new window.google.maps.LatLngBounds();
			this.addCurrentLocationMarker();
			//Sometimes crashes here, probably because parkList is JSON and not an array
			//Crash is fixed I think? Notify if it happens again
			console.log("Drawing parks:", this.props.parkList);
			// this.googleMapBounds = new window.google.maps.LatLngBounds();
			this.props.parkList.map(this.addParkMarker);
			if (
				Object.keys(this.props.markers).length > 1 &&
				this.props.markers.currentLocation
			) {
				this.googleMapBounds = new window.google.maps.LatLngBounds();
				for (let marker in this.props.markers) {
					this.googleMapBounds.extend(
						this.props.markers[marker].position
					);
				}
				this.googleMap.panToBounds(this.googleMapBounds);
				this.googleMap.fitBounds(this.googleMapBounds);
			} else {
				this.googleMap.setCenter(
					this.props.markers.currentLocation.position
				);
				this.googleMap.setZoom(10);
			}
		}
	};

	render() {
		console.log("ParkMap - rendered");
		//NOTE: mapStyles is NEEDED for map to display
		const mapStyles = {
			width: "100%",
			height: "100%"
		};
		//IMPORTANT: Have to wait until the map finished loading before accessing it
		if (this.state.mapLoaded) {
			this.loadMarkers();
		}
		return (
			<React.Fragment>
				<div
					ref={this.googleMapRef}
					// className="border border-primary"
					style={{ width: "100%", height: "100%" }}
				/>

				<ParkMapModal ref={this.parkModalChild} />
			</React.Fragment>
		);
	}
}

//TODO: Move the style to a different place
const styleSelector = {
	lunar: [
		{
			stylers: [
				{
					hue: "#ff1a00"
				},
				{
					invert_lightness: true
				},
				{
					saturation: -100
				},
				{
					lightness: 33
				},
				{
					gamma: 0.5
				}
			]
		},
		{
			featureType: "water",
			elementType: "geometry",
			stylers: [
				{
					color: "#2D333C"
				}
			]
		}
	],
	retro: [
		{ elementType: "geometry", stylers: [{ color: "#ebe3cd" }] },
		{ elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
		{ elementType: "labels.text.stroke", stylers: [{ color: "#f5f1e6" }] },
		{
			featureType: "administrative",
			elementType: "geometry.stroke",
			stylers: [{ color: "#c9b2a6" }]
		},
		{
			featureType: "administrative.land_parcel",
			elementType: "geometry.stroke",
			stylers: [{ color: "#dcd2be" }]
		},
		{
			featureType: "administrative.land_parcel",
			elementType: "labels.text.fill",
			stylers: [{ color: "#ae9e90" }]
		},
		{
			featureType: "landscape.natural",
			elementType: "geometry",
			stylers: [{ color: "#dfd2ae" }]
		},
		{
			featureType: "poi",
			elementType: "geometry",
			stylers: [{ color: "#dfd2ae" }]
		},
		{
			featureType: "poi",
			elementType: "labels.text.fill",
			stylers: [{ color: "#93817c" }]
		},
		{
			featureType: "poi.business",
			stylers: [{ visibility: "off" }]
		},

		{
			featureType: "poi.park",
			elementType: "geometry.fill",
			stylers: [{ color: "#a5b076" }]
		},
		{
			featureType: "poi.park",
			elementType: "labels.text.fill",
			stylers: [{ color: "#447530" }]
		},
		{
			featureType: "road",
			elementType: "geometry",
			stylers: [{ color: "#f5f1e6" }]
		},
		{
			featureType: "road.arterial",
			elementType: "geometry",
			stylers: [{ color: "#fdfcf8" }]
		},
		{
			featureType: "road.highway",
			elementType: "geometry",
			stylers: [{ color: "#f8c967" }]
		},
		{
			featureType: "road.highway",
			elementType: "geometry.stroke",
			stylers: [{ color: "#e9bc62" }]
		},
		{
			featureType: "road.highway.controlled_access",
			elementType: "geometry",
			stylers: [{ color: "#e98d58" }]
		},
		{
			featureType: "road.highway.controlled_access",
			elementType: "geometry.stroke",
			stylers: [{ color: "#db8555" }]
		},
		{
			featureType: "road.local",
			elementType: "labels.text.fill",
			stylers: [{ color: "#806b63" }]
		},
		{
			featureType: "transit.line",
			elementType: "geometry",
			stylers: [{ color: "#dfd2ae" }]
		},
		{
			featureType: "transit.line",
			elementType: "labels.text.fill",
			stylers: [{ color: "#8f7d77" }]
		},
		{
			featureType: "transit.line",
			elementType: "labels.text.stroke",
			stylers: [{ color: "#ebe3cd" }]
		},
		{
			featureType: "transit.station",
			elementType: "geometry",
			stylers: [{ color: "#dfd2ae" }]
		},
		{
			featureType: "water",
			elementType: "geometry.fill",
			stylers: [{ color: "#b9d3c2" }]
		},
		{
			featureType: "water",
			elementType: "labels.text.fill",
			stylers: [{ color: "#92998d" }]
		}
	]
};

export default ParkMap;
