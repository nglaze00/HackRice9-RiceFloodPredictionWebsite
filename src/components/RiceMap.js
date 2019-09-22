import React, { useState } from 'react';
import { ButtonGroup, Button, Card } from 'react-bootstrap'
import {Map, Marker, InfoWindow, Polygon, Polyline, GoogleApiWrapper} from 'google-maps-react';
import './RiceMap.css';

import icon from '../resources/icon.png';

class RiceMap extends React.Component {

    state = {
        center:{
            lat: 29.717501,
            lng: -95.403848
        },
        nodes:[],
        polygons:[],
        info:
            <InfoWindow
                visible={false}
            />,
        polypath: undefined,
        selected: undefined,
        pathMode: false,
        firstNode: undefined,
        secondNode: undefined
    };

    /**
     * type is the severity of flooding, 0 is none 3 is worst
     */
    onReportSubmit(event, type) {
        // alert('Form submitted')

        // let body = {
        //     "test": "test"
        // };
        //
        // fetch('http://127.0.0.1:5000/floodreport',
        //     {method: 'post',
        //         body: JSON.stringify(body)}
        // );

        let body = {
            "node": this.state.selected,
            "type": type
        };

        fetch('http://127.0.0.1:5000/floodreport',
            {method: 'post',
                body: JSON.stringify(body)}
        );

        // console.log("Flood report submitted with severity " + type)

        alert("You have submitted a flood report with severity " + type + " at location " + this.state.selected + "!")
        //
        // this.setState({
        //     // nodes: [],
        //     // polygons: []
        // })

        this.updateNodesAndPolygons();

    }

    onNodeClick(props, marker, e) {

        // console.log(marker.label);

        this.setState({
            selected: marker.name
        })

        if (this.state.pathMode) {
            if (this.state.firstNode == undefined) {
                this.setState({
                    firstNode: marker.name
                })
            } else {
                this.setState({
                    secondNode: marker.name
                })
            }
        }



    }

    // 0 is not flooded, 1 is reported flooded, 2 is flooded
    makeFloodPolygons(response) {

        let today = this.makeDate();

        let newPolygons = [];

        let keys = Object.keys(response);


        for (let key1 in keys) {

            let key = response[key1]["id"];

            let isFlooded = response[key]['is_flooded'][today];


            let pos = {
                lat: response[key]['coords'][0],
                lng: response[key]['coords'][1]
            };

            let testPolygonCoords = [
                {lat: pos.lat - 0.0002, lng: pos.lng - 0.0002},
                {lat: pos.lat - 0.0002, lng: pos.lng + 0.0002},
                {lat: pos.lat + 0.0002, lng: pos.lng + 0.0002},
                {lat: pos.lat + 0.0002, lng: pos.lng - 0.0002},
            ]

            let color;

            if (isFlooded == 2) {
                color = "#bfa92a"
            } else if (isFlooded == 1) {
                color = "#0000FF"
            } else {
                color = "#2fa14d"
            }

            let newPolygon =
                <Polygon
                    paths={testPolygonCoords}
                    strokeColor={color}
                    strokeOpacity={0.8}
                    strokeWeight={2}
                    fillColor={color}
                    fillOpacity={0.35}
                />;

            newPolygons.push(newPolygon);

        }

        this.setState({
            polygons: []
        });

        this.setState({
            polygons: newPolygons
        });

    }

    makeNodes(response) {

        let today = this.makeDate();

        // console.log(today);

        let newNodes = [];

        let keys = Object.keys(response);

        for (let key in keys) {

            // console.log(key);

            // console.log(key);
            // console.log(response[key]);

            let pos = {
                lat: response[key]['coords'][0],
                lng: response[key]['coords'][1]
            };

            let number_of_reports = response[key]['rain_data'][today].length;
            let avg_height = response[key]['avg_levels'][today];

            let info = "Average water level: " + avg_height + "\n# of reports: " + number_of_reports;

            let newMarker =
                <Marker
                    onClick = {this.onNodeClick.bind(this)}
                    title={info}
                    name={key}
                    position={pos}
                    // icon = {{
                    //     url: '../resources/icon.png',
                    //     anchor: new this.props.google.maps.Point(32,32),
                    //     scaledSize: new this.props.google.maps.Size(64,64)
                    // }}
                />;

            newNodes.push(newMarker)

        }

        this.setState({
            nodes: newNodes
        });

        this.makeFloodPolygons(response);
    }

    beginPathGeneration() {
        this.setState({
            firstNode: undefined,
            secondNode: undefined,
            pathMode: true,
        });

    }

    finishPathGeneration() {

        console.log("Entered finish path generatioin");

        let body = {
            "firstNode": this.state.firstNode,
            "secondNode": this.state.secondNode
        };

        fetch('http://127.0.0.1:5000/path',
            {method: 'post',
                body: JSON.stringify(body)}
        ).then(data => data.json())
        .then(data=>this.generatePath(data))



        this.setState({
            firstNode: undefined,
            secondNode: undefined,
            pathMode: false,
        })

    }

    generatePath(pathData) {

        // console.log(pathData);

        const pathCoords = [];

        for (let coord in pathData["path_coords"]) {

            let coordData = pathData["path_coords"][coord];

            let newCoord = {
                lat: coordData[0],
                lng: coordData[1]
            };

            // console.log(newCoord);

            pathCoords.push(newCoord);

        }

        // console.log(pathCoords);

        let newline =
            <Polyline
                path={pathCoords}
                strokeColor="#0000FF"
                strokeOpacity={0.8}
                strokeWeight={3}
            />;

        this.setState({
            polypath: newline
        });

        if (pathData["path_type"] == "wet") {
            alert("Warning: No dry path could be found, this path is potentially flooded");
        }


    }

    mapClick(mapProps, map, clickEvent) {

        // clickEvent has latLng, wa, pixel, and ra

        var body = {
            "lat": clickEvent.latLng.lat(),
            "lng": clickEvent.latLng.lng()
        };

        fetch('http://127.0.0.1:5000/click',
            {method: 'post',
            body: JSON.stringify(body)}
        )

    }

    disableStuff(mapProps, map) {

        var myStyle = [
            {
                featureType: "administrative",
                elementType: "labels",
                stylers: [
                    { visibility: "off" }
                ]
            },{
                featureType: "poi",
                elementType: "labels",
                stylers: [
                    { visibility: "off" }
                ]
            },{
                featureType: "water",
                elementType: "labels",
                stylers: [
                    { visibility: "off" }
                ]
            },{
                featureType: "road",
                elementType: "labels",
                stylers: [
                    { visibility: "off" }
                ]
            },
            {
                featureType: "transit",
                elementType: "labels",
                stylers: [
                    { visibility: "off" }
                ]
            }
        ];

        map.panControl = false;
        map.zoomControl = false;
        map.streetViewControl = false;
        map.fullscreenControl = false;
        map.mapTypeControl = false;
        map.minZoom = 16;

        var sw = new this.props.google.maps.LatLng(29.711348, -95.413796);
        var ne = new this.props.google.maps.LatLng(29.723871, -95.393055);

        var bounds = new this.props.google.maps.LatLngBounds(sw, ne);

        map.set('styles', myStyle);
        map.set('restriction', {latLngBounds: bounds, strictBounds: false});
    }

    updateNodesAndPolygons() {
        console.log("Updating nodes and polygons after report");
        fetch('http://127.0.0.1:5000/nodes')
            .then(data => data.json())
            .then(data=>this.makeNodes(data))
        console.log("Finished updating nodes and polygons after report");
    }

    componentDidMount() {

        this.updateNodesAndPolygons()

    }

    makeDate() {

        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        let yyyy = String(today.getFullYear());

        return yyyy + mm + dd;

    }


    render() {

        let nodeDate = undefined;

        return (
            <div className={"RiceMap"}>

                <div className={"RiceMap-controls"}>
                    <Card bg="secondary" text="white" style={{ width: 'fill', height: 'fill'}}>
                        <Card.Header><b>Put It In Rice</b></Card.Header>
                    </Card>
                    <Card bg="primary" text="white" style={{ width: 'fill', height: 'fill'}}>
                        {/*<Card.Header>Put It In Rice</Card.Header>*/}
                        <Card.Body>
                            <Card.Title>Report Flooding</Card.Title>
                            <Card.Text>
                                Select a location on the right to report flooding!
                            </Card.Text>
                            <Card.Text>
                                <b>Current selected location:</b> {this.state.selected == undefined ? "None" : this.state.selected}
                            </Card.Text>
                            <Card.Text>
                                Once selected, choose the severity below.
                            </Card.Text>
                        </Card.Body>
                        <ButtonGroup vertical size="sm" style={{minWidth: '90%', margin: 'auto'}}>
                            <Button onClick={(e) => {this.onReportSubmit(e, 0)}} variant={"success"} disabled={!this.state.selected} >not flooded (less than 2 inches)</Button>
                            <Button onClick={(e) => {this.onReportSubmit(e, 1)}} variant={"secondary"} disabled={!this.state.selected}>wet but walkable (2 to 4 inches)</Button>
                            <Button onClick={(e) => {this.onReportSubmit(e, 2)}} variant={"warning"} disabled={!this.state.selected}>wouldn't walk it (4 to 6 inches)</Button>
                            <Button onClick={(e) => {this.onReportSubmit(e, 3)}} variant={"danger"} disabled={!this.state.selected}>miss me (more than 6 inches)</Button>
                        </ButtonGroup>
                        <div><br/></div>
                    </Card>
                    <Card bg="info" text="white" style={{ width: 'fill', height: 'fill'}}>
                        <Card.Body>
                            <Card.Title>Path Generator</Card.Title>
                            <Card.Text>
                                Choose two locations and have a dry path between them generated!<br/>
                                To begin, select 'begin path' below, press two nodes, then click 'generate path'.
                            </Card.Text>
                            <Card.Text>
                                <b>Start location: </b> {this.state.firstNode == undefined ? "unselected" : this.state.firstNode}
                            </Card.Text>
                            <Card.Text>
                                <b>End location: </b> {this.state.secondNode == undefined ? "unselected" : this.state.secondNode}
                            </Card.Text>
                            <Card.Text>
                                (To restart, simply press 'begin path' again!)
                            </Card.Text>
                            <Button onClick={this.beginPathGeneration.bind(this)} variant={"primary"} disabled={false} >begin path</Button>
                            <Button onClick={this.finishPathGeneration.bind(this)} variant={"secondary"} disabled={!this.state.secondNode} >generate path</Button>
                        </Card.Body>
                    </Card>
                    <Card bg="light" text="black" style={{ width: 'fill', height: 'fill'}}>
                        <Card.Body>
                            <Card.Title>Legend</Card.Title>
                            <div className="row">
                                <div className="column"><div className="RiceMap-colorbox" style={{backgroundColor: '#2fa14d', marginLeft: 'auto', marginRight: 'auto', marginTop: '1%'}}/></div>
                                <div className="column"> <p style={{textAlign: "left", margin: 'auto'}}>not flooded</p></div>
                            </div>
                            <div className="row">
                                <div className="column"><div className="RiceMap-colorbox" style={{backgroundColor: '#0000FF', marginLeft: 'auto', marginRight: 'auto', marginTop: '1%'}}/></div>
                                <div className="column"> <p style={{textAlign: "left", margin: 'auto'}}>reported flooded</p></div>
                            </div>
                            <div className="row">
                                <div className="column"><div className="RiceMap-colorbox" style={{backgroundColor: '#bfa92a', marginLeft: 'auto', marginRight: 'auto', marginTop: '1%'}}/></div>
                                <div className="column"> <p style={{textAlign: "left", margin: 'auto'}}>predicted flooded</p></div>
                            </div>
                        </Card.Body>
                    </Card>
                    <Card bg="dark" text="white" style={{ width: 'fill', height: 'fill'}}>
                        <Card.Body>
                            <Card.Title>Credits</Card.Title>
                            <Card.Text>
                                Created by Nicholas Glaze (Rice '22), Artun Bayer (Rice '22), Eli Smith (Rice '21), Liam Bonnage (Rice '20) as part of HackRice 9
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </div>

                <Map
                    google={this.props.google}
                    zoom={16}
                    initialCenter={this.state.center}
                    onReady={this.disableStuff.bind(this)}
                    onClick={this.mapClick.bind(this)}
                    className={"RiceMap-map"}
                >
                    {this.state.nodes}
                    {this.state.info}
                    {this.state.polygons}
                    {this.state.polypath}
                </Map>

            </div>

        )
    }

}

export default GoogleApiWrapper({
    apiKey: 'AIzaSyAtCVota3mJ8TlzhDbNyrpPTsyJv0AqIYA'
})(RiceMap);