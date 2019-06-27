//Input form
import React, { Component } from "react";

class ParkForm extends Component {
	state = {
		reqData: {
			lat: "",
			lng: "",
			dist: "25",
			lightpol: "",
			error: ""
		},
		isLoadingLocation: false,
		formErrors: {}
	};

	//componentDidMount runs RIGHT after post-render
	componentDidMount() {
		this.getMyLocation();
	}

	//   In order to have access to  this.state inside
	//    getCurrentPosition's callback, you either need to
	//    bind the success callback or make use of arrow function.
	getMyLocation = e => {
		this.setState({ ...this.state, isLoadingLocation: true });
		navigator.geolocation.getCurrentPosition(
			position => {
				this.setState({
					...this.state,
					reqData: {
						...this.state.reqData,
						lat: position.coords.latitude,
						lng: position.coords.longitude,
						error: null
					},
					isLoadingLocation: false
				});
			},
			error => {
				this.setState({
					...this.state,
					reqData: { ...this.state.reqData, error: error.message },
					isLoadingLocation: false
				});
			},
			{ enableHighAccuracy: true }
		);
	};

	handleDistanceChange = changeEvent => {
		this.setState({
			reqData: { ...this.state.reqData, dist: changeEvent.target.value }
		});
	};

	handleLatChange = changeEvent => {
		this.setState({
			reqData: { ...this.state.reqData, lat: changeEvent.target.value }
		});
	};

	handleLngChange = changeEvent => {
		this.setState({
			reqData: { ...this.state.reqData, lng: changeEvent.target.value }
		});
	};

	handleLightPolChange = changeEvent => {
		this.setState({
			reqData: {
				...this.state.reqData,
				lightpol: changeEvent.target.value
			}
		});
	};

	//props to send one-way information to parksComponent
	//this.state is the "X" in getParks()
	//fetchP(x) --> getparks(x)
	onSubmit = e => {
		e.preventDefault();
		//console.log(this.state.reqData);
		const errors = this.validate(this.state.reqData);
		if (errors.length === 0) {
			this.setState({ ...this.state, formErrors: [] });
			this.props.fetchParks(this.state.reqData);
		} else {
			this.setState({ ...this.state, formErrors: errors });
		}
		//getparks(reqdata) of parent
	};

	validate = reqData => {
		const errors = [];
		if (
			reqData.lat === "" ||
			reqData.lat < -90 ||
			reqData.lat > 90 ||
			reqData.lng === "" ||
			reqData.lng < -180 ||
			reqData.lng > 180
		)
			errors.push("Invalid location");
		if (reqData.dist === "" || reqData.dist < 0 || reqData.dist > 300)
			errors.push("Invalid distance");
		if (
			reqData.lightpol === "" ||
			reqData.lightpol < 0 ||
			reqData.lightpol > 40
		)
			errors.push("Invalid light pollution");
		return errors;
	};

	renderLocationSpinner = () => {
		if (this.state.isLoadingLocation) {
			return <span class="spinner-border spinner-border-sm" />;
		}
	};

	renderFormErrors = () => {
		if (Object.keys(this.state.formErrors).length > 0) {
			return (
				<React.Fragment>
					<b class="text-danger">
						{this.state.formErrors.join(", ")}
					</b>
					<br />
				</React.Fragment>
			);
		}
	};

	render() {
		return (
			<div className="border border-primary">
				{/* <br />
				lat: {this.state.reqData.lat}, lng: {this.state.reqData.lng}
				<br />
				dist: {this.state.reqData.dist}, lightpol:{" "}
				{this.state.reqData.lightpol}
				<br /> */}
				<h3>Input Form</h3>
				<form />
				<button
					// onClick={this.getParks.bind(this, this.state.formInput)}
					className="btn btn-primary m-1"
					type="button"
					disabled={this.state.isLoadingLocation}
					onClick={this.getMyLocation}
				>
					<strong>Get location {this.renderLocationSpinner()}</strong>
				</button>
				<br />
				<input
					placeholder="Latitude"
					type="number"
					min="-90"
					max="90"
					step="any"
					value={this.state.reqData.lat}
					id="Lat"
					name="lat"
					required
					//does this character by character, each char is a new 'event'
					onChange={this.handleLatChange}
				/>
				<input
					placeholder="Longitude"
					type="number"
					min="-180"
					max="180"
					step="any"
					value={this.state.reqData.lng}
					id="Long"
					name="lng"
					required
					onChange={this.handleLngChange}
				/>
				<br />
				<br />
				<b>Distance:</b>
				<br />
				<input
					type="radio"
					value="5"
					name="dist"
					required
					checked={this.state.reqData.dist === "5"}
					onChange={this.handleDistanceChange}
				/>
				less than 5 km
				<br />
				<input
					type="radio"
					value="25"
					name="dist"
					checked={this.state.reqData.dist === "25"}
					onChange={this.handleDistanceChange}
				/>
				less than 25 km
				<br />
				<input
					type="radio"
					value="50"
					name="dist"
					checked={this.state.reqData.dist === "50"}
					onChange={this.handleDistanceChange}
				/>
				less than 50 km
				<br />
				<input
					type="radio"
					value="100"
					name="dist"
					checked={this.state.reqData.dist === "100"}
					onChange={this.handleDistanceChange}
				/>
				less than 100 km
				<br />
				<input
					type="radio"
					value="200"
					name="dist"
					checked={this.state.reqData.dist === "200"}
					onChange={this.handleDistanceChange}
				/>
				less than 200 km
				<br />
				<input
					type="radio"
					value="300"
					name="dist"
					checked={this.state.reqData.dist === "300"}
					onChange={this.handleDistanceChange}
				/>
				less than 300 km
				<br />
				<br />
				<input
					placeholder="Max Light Pollution"
					type="number"
					min="0"
					max="40"
					step="any"
					id="lightpoll"
					name="lightpol"
					value={this.state.reqData.lightpol}
					required
					onChange={this.handleLightPolChange}
				/>
				<br />
				{this.renderFormErrors()}
				<button
					className="btn btn-primary m-2"
					onClick={e => this.onSubmit(e)}
				>
					Submit
				</button>
				<button
					className="btn btn-danger m-2"
					onClick={this.props.clearParks}
					// className={this.clearButtonClass()}
					// disabled={this.state.parks.length === 0}
					type="button"
				>
					<strong>Clear</strong>
				</button>
				<form />
			</div>
		);
	}
}

export default ParkForm;