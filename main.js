//let currLocation = [32.7157, -117.1611];  //default to San Diego
let topSpots;
document.getElementById('sorted').onchange = handleSort;
getLocationAndLoadData();

//Determine the user's actual location
function getLocationAndLoadData() {
    $("body").css("cursor", "progress");
    let error = document.getElementById("locError");
    error.innerHTML = "";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        error.innerHTML = "Geolocation is not supported by this browser. Distances are from downtown San Diego.";
    }
    function showPosition(position) {
        currLocation = [position.coords.latitude, position.coords.longitude];
        //After we've loaded the user's location & the document is ready, load the data and render it
        $(document).ready(function() {
            let json_req = $.getJSON('data.json', (data) => {
                insertInfo(data, false);
                topSpots = data;
                handleSort();
            });
        });
        $("body").css("cursor", "default"); 
        }
    function showError(error) {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            error.innerHTML = "User denied the request for Geolocation. Distances are from downtown San Diego."
            break;
          case error.POSITION_UNAVAILABLE:
            error.innerHTML = "Location information is unavailable. Distances are from downtown San Diego."
            break;
          case error.TIMEOUT:
            error.innerHTML = "The request to get user location timed out. Distances are from downtown San Diego."
            break;
          case error.UNKNOWN_ERROR:
            error.innerHTML = "An unknown error occurred. Distances are from downtown San Diego."
            break;
        }
        $("body").css("cursor", "default"); 
        }
}

//Add additional information to array, such as distance from currLocation, original
//  sort order, and a marker for the Top Spot on a Google map.  If updateDistOnly is
//  true, just update the distance information
function insertInfo(data, updateDistOnly) {
    data.forEach((obj, i) => {
        obj["distance"] = distance(...obj["location"], ...currLocation, "M");
        if (!updateDistOnly) {
            obj["origOrder"] = i;
            obj["marker"] = {lat: obj["location"][0], lng: obj["location"][1]};
        }
    });
}

//Depending on whether Sort by Distance is checked or not, either sort by distance or
//  by original order.  Then render the table.
function handleSort() {
    if (document.getElementById('sorted').checked) {
        topSpots.sort((a,b) => {
            return (a["distance"] - b["distance"]);
        });  //sort the array by distance
    } else {
        topSpots.sort((a,b) => {
            return a["origOrder"] - b["origOrder"];
        }); //sort the array by origOrder
    }
    updateTable(topSpots);
}

//Delete the table if it already existed, then build the table of data
function updateTable (data) {
    let table = document.getElementById('table_body');
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }

    data.forEach((obj) => {
        let row = document.createElement("tr")
        let rowStr = "";
        rowStr += `<td>${obj["name"]}</td>`;
        rowStr += `<td>${obj["description"]}</td>`;
        rowStr += `<td class="button"><a href="https://www.google.com/maps?q=${obj["location"][0]},${obj["location"][1]}" target="_blank" rel="_noopener"><button>Open in Google Maps</button></a></td>`;
        rowStr += `<td class="distance">${obj["distance"].toFixed()}</td>`
        row.innerHTML = rowStr;
        table.appendChild(row);
    });
}

//Calculate the distance from one gps coordinate to another, in miles
//Algorithm from https://www.geodatasource.com, licensed under LGPLv3.
function distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

//Display Google map with pins in it for Top Spots.  Include ToolTips of name of location.
function initMap() {
    let map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 32.7157, lng: -117.1611},  //center map on San Diego
        zoom: 12
    });
    topSpots.forEach((topSpot) => {
        let newMarker = new google.maps.Marker({position: topSpot["marker"], map: map});
        newMarker.setTitle(topSpot["name"]);
    });
}
 