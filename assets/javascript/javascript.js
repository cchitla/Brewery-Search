//arrays to store searched brewery results
let breweryArray = [];
let displayInfoArray = [];
let currentSearch;

let statesShort = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
let statesLong = ["Alabama", "Alaska", "Arizona", "Arkansas", "California",
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

let allStates = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "Alabama", "Alaska", "Arizona", "Arkansas", "California",
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

let validateStates = allStates.map(item => item.toUpperCase());

var icon = 'assets/images/hop-icon.png';

let submitButton = document.getElementById("searchButton");



submitButton.addEventListener("click", e => {
  e.preventDefault();
  TweenMax.to(window, 1, { scrollTo: ".scrollHere" });
  breweryArray = [];
  searchCityInput = document.getElementById("searchCity").value;
  searchStateInput = document.getElementById("searchState").value;  
  let searchStateUpper = searchStateInput.toUpperCase();
  

  // prevents searching the same thing twice
  if (currentSearch === `${searchCityInput} ${searchStateInput}`) {
    return;
  }
  currentSearch = `${searchCityInput} ${searchStateInput}`;


  let searchCity = searchCityInput.replace(/ /g, "_");
  //if state input is 2 letters, parse to the full name
  let searchState;
  if (searchStateInput.length === 2) {
    searchState = parseStateName(searchStateUpper).replace(/ /g, "_");
  } else {
    searchState = searchStateInput.replace(/ /g, "_");
  };

  //call openbrewDB api
  getBreweries(searchCity, searchState);

});

//if state input is two letters this changes it to the full name
function parseStateName(searchStateUpper) {
  let fullStateName;

  for (let i = 0; i < statesShort.length; i++) {
    if (statesShort[i] === searchStateUpper) {
      fullStateName = statesLong[i];
    };
  };
  return fullStateName;
};

//takes the locations in breweryArray and calculates the average lat and lng
//so the new map can center on their position
function calcAvgCenter() {
  let sumLat = 0;
  for (let i = 0; i < breweryArray.length; i++) {
    sumLat += breweryArray[i][1];
  };
  let sumLng = 0;
  for (let i = 0; i < breweryArray.length; i++) {
    sumLng += breweryArray[i][2];
  };

  let avgLat = (sumLat / breweryArray.length);
  let avgLng = (sumLng / breweryArray.length);
  let avgCenter = { lat: avgLat, lng: avgLng };
  return avgCenter;
};

//calculate the max distance between lats and lngs to determine map zoom
function calcMapZoom() {
  let latArray = [];
  for (let i = 0; i < breweryArray.length; i++) {
    latArray.push(breweryArray[i][1]);
  };

  let lngArray = [];
  for (let i = 0; i < breweryArray.length; i++) {
    lngArray.push(breweryArray[i][2]);
  };
  let diffLat = Math.max.apply(null, latArray) - Math.min.apply(null, latArray);
  let diffLng = Math.max.apply(null, lngArray) - Math.min.apply(null, lngArray);
  let maxDistance = Math.max(diffLat, diffLng);

  let zoom = 10;
  if (maxDistance < 0.10) {
    zoom = 12;
  } else if (maxDistance < 0.15) {
    zoom = 11;
  } else if (maxDistance < 0.5) {
    zoom = 9.8
  } else if (maxDistance < 1.5) {
    zoom = 8;
  } else if (maxDistance > 10) {
    zoom = 3.8;
  } else if (maxDistance > 4) {
    zoom = 5.5;
  } else if (maxDistance > 2) {
    zoom = 6;
  };
  return zoom;
};

//default map on page load
function initMap() {
  let centerUS = { lat: 39.8283, lng: -98.5795 };

  let map = new google.maps.Map(document.getElementById('map'), {
    center: centerUS,
    zoom: 3.7,
    styles: mapStyle,
  });
};

function getBreweries(searchCity, searchState) {
  let queryCity = searchCity;
  let queryState = searchState;
  let queryURL = `https://api.openbrewerydb.org/breweries?by_city=${queryCity}&by_state=${queryState}&per_page=10`;
  $.ajax({
    url: queryURL,
    method: "GET"
  }).then(async function (response) {
    // if response is empty, tell user to enter valid city and/or state
    if (response.length === 0) {
      console.log("empty response");
      return;
      
    }
    displayInfoArray = [];
    breweryArray = [];
    for (let i = 0; i < response.length; i++) {
      let newBreweryLoc = [];
      newBreweryLoc.push(response[i].name);
      let street = response[i].street.replace(/#/g, "");

      //this skips to next iteration in case there is no street address
      if (street.length == 0) {
        continue;
      };

      

      let newAddress = `${street},${response[i].state}`;
      let codedAddress = await getGeocode(newAddress);

      newBreweryLoc.push(codedAddress.lat);
      newBreweryLoc.push(codedAddress.lng);
      newBreweryLoc.push(newAddress);
      breweryArray.push(newBreweryLoc);


      let displayInfoBrewery = [];
      displayInfoBrewery.push(response[i].name); // 0
      displayInfoBrewery.push(street); // 1
      displayInfoBrewery.push(response[i].phone); // 2
      let type = response[i].brewery_type;
      let breweryType = type.charAt(0).toUpperCase() + type.slice(1);
      displayInfoBrewery.push(breweryType); // 3
      displayInfoBrewery.push(response[i].website_url); // 4
      displayInfoArray.push(displayInfoBrewery);
    };
    

    //display cards to DOM
    $(".searchResults").empty();

    for (let i = 0; i < displayInfoArray.length; i++) {
      let card = $("<div>");
      card.attr("class", "card");
      let cardBody = $("<div>");
      cardBody.attr("class", "card-body p-4");

      cardBody.css("padding", "20px");
      card.append(cardBody);
      var h = $("<h5>").text(displayInfoArray[i][0]);
      h.addClass("pb-3");
      cardBody.append(h);

      var cardText = $("<p>").html(displayInfoArray[i][1] + "<br><b> Phone Number: </b>" + displayInfoArray[i][2] + "<br><b>Type:</b> " + displayInfoArray[i][3]);
      cardBody.append(cardText);
      cardText.css("margin-left", "60px");

      var a = $("<a>")
      var links = $("<button>");
      a.append(links);
      links.attr("class", "btn btn-warning hvr-sweep-to-right");

      if (displayInfoArray[i][4] === "") {
        searchName = displayInfoArray[i][0].replace(/ /g, "+");
        a.attr("href", `https://www.google.com/search?q=${searchName}`)
      } else {
        a.attr("href", displayInfoArray[i][4]);
      };

      a.css({ "target": "_blank", "float": "right", "margin-right": "165px" });
      links.html(`View Website<i class="fas fa-arrow-right"></i>`);
      cardBody.append(a);

      var img = $('<img src="assets/images/hop-icon.png" id="resultIcon">');
      cardBody.prepend(img);
      $(".searchResults").append(card);
    };


    let mapZoom = calcMapZoom();

    //makes a new map based on locations stored in breweryArray
    map = new google.maps.Map(document.getElementById('map'), {
      center: calcAvgCenter(),
      zoom: mapZoom,
      styles: mapStyle,
    });

    let infoWindow = new google.maps.InfoWindow(), marker, i;

    //generate markers and infowindow for each location in breweryArray
    for (let i = 0; i < breweryArray.length; i++) {
      let newLocation = { lat: breweryArray[i][1], lng: breweryArray[i][2] };
      marker = new google.maps.Marker({
        position: newLocation,
        map: map,
        icon: icon,
        title: breweryArray[i][0],
      });

      google.maps.event.addListener(marker, 'click', (function (marker, i) {
        return function () {
          infoWindow.setContent(marker.title);
          infoWindow.open(map, marker);
        };
      })(marker, i));
    };

  }, function (error) {
    console.log(error);
  });
};


// converts address input to geocode coordinates
function getGeocode(address) {
  return new Promise(function (resolve, reject) {
    let apiKey = "AIzaSyB09A6zOM3XKtwH__oAlIUAUr1IbyXIQUY";
    let addressQuery = address;
    let queryURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${addressQuery}&key=${apiKey}`;
    $.ajax({
      url: queryURL,
      method: "GET"
    }).then(function (response) {
      let latitude = response.results[0].geometry.location.lat;
      let longitude = response.results[0].geometry.location.lng;
      // console.log(latitude, longitude);

      var latLong = { lat: 41.4925374, lng: -99.9018131 };
      latLong.lat = latitude;
      latLong.lng = longitude;
      // console.log(latLong);
      resolve(latLong);
    }).catch(function (error) {
      reject(error);
    });
  });
};



TweenMax.to(".logo", 1, { left: 0 });
TweenMax.to(".headerText", 4, { opacity: 1 });

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      },
      {
        "weight": 0.5
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffdb0f"
      },
      {
        "saturation": -15
      },
      {
        "lightness": 60
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffdb0f"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  }
]