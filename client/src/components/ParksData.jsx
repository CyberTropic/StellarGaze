//Store parks state and handle display
import React, { Component } from "react";
import ParkForm from "./ParkForm";
import ParkTable from "./ParkTable";
import ParkMap from "./ParkMap";
import { BrowserRouter as Router, Route } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import { Spring, animated } from "react-spring/renderprops";

class BaseParksData extends Component {
	state = {
		parks: [],
		fetchReq: [],
		moon: "",
		moonType: "",
		isMapLoaded: false,
		isFetchingParks: false,
		hideForm: false,
		hideMap: true,
		sortedBy: "dist"
	};
	/* Note - park object is:
        {
            distance: number,
            id: number,
            lat: number,
            lng: number,
            light_pol: number,
            name: string,
            osmid: number,
        }
    */
	constructor(props) {
		super(props);
		this.googleMap = false;
		//I don't think markers should go in the state because, like googleMap,
		// They're referenced in odd places and may update at weird times from the rest of doms
		// Since they're google map things
		this.markers = {};
	}

	inRange(x, min, max) {
		return (x - min) * (x - max) <= 0;
	}

	handleMapLoaded = googleMapActual => {
		this.googleMap = googleMapActual;
		this.setState({ ...this.state, isMapLoaded: true });
	};

	//Request parks from server
	//getParkData is a function, weird react notation perhaps?
	//note, reqData could be X, just a variable name! int x=

	//YOU NEED THE / in the ADDRESS!!
	//don't put "getParkData", must be "/name"
	//getParkData gets called, and does a fetch to
	//app.post("/api/getParkData")
	getParkData = reqData => {
		console.log(reqData);
		// this.updateHistoryQuery(reqData);
		this.setState({ isFetchingParks: true });
		let storageKey = JSON.stringify(reqData);
		let localData = sessionStorage.getItem(storageKey);

		if (localData) {
			//Check if it's expired
			let data = JSON.parse(localData);
			let now = new Date();
			let expiration = new Date(data.timestamp);
			expiration.setMinutes(expiration.getMinutes() + 60);
			if (!data.timestamp || now.getTime() > expiration.getTime()) {
				console.log("Removing expired data from storage:", data);
				localData = false;
				sessionStorage.removeItem(storageKey);
			}
		}
		if (localData) {
			console.log("Loaded from storage:", JSON.parse(localData));
			this.setState({
				parks: JSON.parse(localData).parks,
				moon: JSON.parse(localData).moonPercent,
				moonType: JSON.parse(localData).moonType,

				fetchReq: reqData,
				isFetchingParks: false
			});
		} else {
			// let fetchingState = this.state;
			// fetchingState.isFetching = true;
			// this.setState(fetchingState);
			axios
				.post("/api/getParkData", reqData)
				.then(response => {
					console.log(response.data);
					for (var i = 0; i < response.data.parks.length; i++) {
						response.data.parks[i].score = this.parkScore(
							response.data.moonPercent,
							response.data.parks[i].weather.humidity / 100,
							response.data.parks[i].weather.clouds / 100,
							response.data.parks[i].light_pol / 100
						);
					}
					this.setState({
						parks: response.data.parks,
						moon: response.data.moonPercent,
						moonType: response.data.moonType,
						fetchReq: reqData,
						isFetchingParks: false
					});
					let d = new Date();
					response.data.timestamp = d.getTime();
					sessionStorage.setItem(
						JSON.stringify(reqData),
						JSON.stringify(response.data)
					);
					console.log("Saved to storage:", response.data);
				})
				.catch(err => {
					console.error(err);
					this.setState({ isFetchingParks: false });
				});
		}
	};

	parkScore = (moon, humidity, cloudCov, lightPol) => {
		// console.log("MOON IS !!!!!!!!!!!!!!",moon)
		// console.log("CLOUD COV IS !!!!!!!!!!!!!!",cloudCov)
		// console.log("LIGHT POL IS !!!!!!!!!!!!!!",lightPol)
		// console.log("humidity COV IS !!!!!!!!!!!!!!",humidity)
		var moonScore = 0.45 * (-1 * (2 * moon - 1));
		var lightPolScore = 0.25 * (((-1 * 1) / 3) * (lightPol - 3));
		var humidityScore = 0;
		if (humidity < 0.4) {
			humidityScore += 0.15 * 1;
		} else if (this.inRange(humidity, 0.4, 0.8)) {
			humidityScore += 0.15 * (-2.5 * humidity + 2);
		} else if (0.8 < humidity) {
			humidityScore += 0;
		}
		var cloudScore = 0;
		if (cloudCov < 0.2) {
			cloudScore += 0.15 * 1;
		} else if (this.inRange(cloudCov, 0.2, 0.4)) {
			cloudScore += 0.15 * (-5 * cloudCov + 2);
		} else if (0.4 < cloudCov) {
			cloudScore += 0;
		}

		const finalScore =
			moonScore + cloudScore + humidityScore + lightPolScore;
		console.log(
			"Moon score, cloudscore, humidity, lightpolscore ",
			moonScore,
			cloudScore,
			humidityScore,
			lightPolScore
		);
		console.log("final score: ", finalScore);
		return finalScore;
	};

	//Clear button handler
	clearParks = () => {
		this.setState({ parks: [], fetchReq: [] });
	};

	renderParkMap = () => {
		return (
			<Spring
				native
				//force
				//config={{ tension: 2000, friction: 100, precision: 1 }}
				from={{
					transform: this.state.hideMap
						? "translate3d(40px,0,0)"
						: "translate3d(0,0,0)",
					opacity: this.state.hideMap ? 0 : 1
				}}
				to={{
					transform: this.state.hideMap
						? "translate3d(0,0,0)"
						: "translate3d(40px,0,0)",
					opacity: this.state.hideMap ? 1 : 0
				}}
			>
				{props => (
					<animated.div className="ParkMapStyle" style={props}>
						<ParkMap
							parkList={this.state.parks}
							markers={this.markers}
							location={this.state.fetchReq}
							onMapLoaded={this.handleMapLoaded}
						/>
					</animated.div>
				)}
			</Spring>
		);
	};

	renderParkForm = () => {
		if (true) {
			return (
				<div className="ParkFormStyle">
					<ParkForm
						fetchParks={this.getParkData}
						clearParks={this.clearParks}
						isFetchingParks={this.state.isFetchingParks}
						googleMap={this.googleMap}
						markers={this.markers}
					/>
				</div>
			);
		}
	};

	sortParksDist = () => {
		let parksArray = this.state.parks;
		parksArray.sort((a, b) =>
			a.distance > b.distance ? 1 : b.distance > a.distance ? -1 : 0
		);
		this.setState({ parks: parksArray, sortedBy: "dist" });
	};

	sortParksScore = () => {
		let parksArray = this.state.parks;
		parksArray.sort((a, b) =>
			a.score > b.score ? 1 : b.score > a.score ? -1 : 0
		);
		this.setState({ parks: parksArray, sortedBy: "score" });
	};

	//recursively calls render on it's children
	render() {
		console.log("ParksData - rendered");

		//"copies" into temp array parks
		// const parks = this.state.parks;

		//let clearButtonClass = this.clearButtonClass();
		//bind(this,reqData) passes reqData to getParkData
		//bind seems to be needed for onClick buttons /w args

		return (
			<MainContentWrapper
				active={this.state.hideForm}
				hideMap={this.state.hideMap}
			>
				{this.renderParkMap()}
				<div className="Placeholder1">I'm just a placeholder</div>
				<div className="RightSideContainer">
					<button
						onClick={() => {
							this.setState({ hideForm: !this.state.hideForm });
						}}
					>
						Toggle form
					</button>
					{this.renderParkForm()}

					<div className="MoonStyle">MOON</div>

					<div className="ParkTableStyle">
						<b>Sort by:</b>
						<button
							onClick={this.sortParksDist}
							disabled={this.state.sortedBy === "dist"}
						>
							Dist
						</button>
						<button
							onClick={this.sortParksScore}
							disabled={this.state.sortedBy === "score"}
						>
							Score
						</button>
						<ParkTable
							parkList={this.state.parks}
							moon={this.state.moon}
							moonType={this.state.moonType}
							googleMap={this.googleMap}
							markers={this.markers}
							isLoadingParks={this.state.isFetchingParks}
						/>
					</div>
				</div>
			</MainContentWrapper>
		);
	}
}

const ParksData = parkProps => (
	<Router>
		<Route
			path="/"
			render={routerProps => (
				//Combine props passed to parkForm with router props
				<BaseParksData {...{ ...parkProps, ...routerProps }} />
			)}
		/>
	</Router>
);

export default ParksData;

//////////////////////////////////////////

const MainContentWrapper = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-column-gap: 10px;
	grid-row-gap: 10px;
	grid-template-areas: "map rightSide";

	.ParkMapStyle {
		grid-area: map;
		max-height: 100%;
		background-color: maroon;
	}
	.Placeholder1 {
		display: none;
		grid-area: placeholder1;
		background-color: azure;
	}
	.RightSideContainer {
		grid-area: rightSide;
		overflow-y: scroll;
		overflow-x: hidden;
		background-color: whitesmoke;
	}
	.ParkFormStyle {
		grid-area: form;
		${({ active }) => active && `display: none;`}
	}
	/* .MoonStyle {
		grid-area: moon;
		background-color: orange;
	} */
	.ParkTableStyle {
		${({ active }) => {
			if (active) return `max-height:600px;`;
			else return `max-height:300px`;
		}}
	}

	margin: 0 auto 0 auto;
	margin-top: 8rem;
	overflow: hidden;
	width: 85%;
	@media screen and (max-width: 769px) {
		width: 95%;
		grid-template-columns: 1fr;
		grid-template-rows: ${props =>
			props.hideMap ? "0px auto" : "50% auto"};
		grid-template-areas:
			"map"
			"rightSide";
		.Placeholder1 {
			display: none;
			grid-area: placeholder1;
			background-color: azure;
		}
		.RightSideContainer {
			overflow-y: visible;
		}

		.ParkMapStyle {
			display: ${props => (props.hideMap ? "none" : "fixed")};
		}
	}
	@media screen and (min-width: 769px) and (max-width: 1300px) {
		grid-template-columns: 1fr 1fr;
		grid-template-rows: auto auto;
		grid-template-areas:
			"map rightSide"
			"placeholder1 rightSide";
		.Placeholder1 {
			display: block;
			grid-area: placeholder1;
			background-color: azure;
		}
	}
`;
