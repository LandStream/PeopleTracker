var geocoder;
var map;
var locationMarkers = {};
var markerInfoWindows = {};

function jqEncode(value){
	  value = value.replace( ".", "\\.")
	  return value.replace( "@", "\\@")
	  
	}



function updateMap() 
{
	server.GetAllMarkers( "all", onGetAllMarkersSuccess);
}

function listProperties(obj) {
	var propList = "";
	for ( var propName in obj) {
		if (typeof (obj[propName]) != "undefined") {
			propList += (propName + ", ");
		}
	}
	alert(propList);
}

function updateUserList( users )
{
	for ( var i = 0; i < users.length; i++) 
	{
		if( $('li#'+jqEncode(users[i])).length == 0 )
		{
			//alert( users[i] + $('li#'+users[i]).length )
			var newListItem = document.createElement('li');
			
			newListItem.id = users[i];
			newListItem.innerHTML = users[i];		
			$( 'ol#user_list' ).append( newListItem );			
		}		
	}
}

//callback that handles the server's response to "GetAllMarkers"
function onGetAllMarkersSuccess(response)
{
	var users = [];
	for ( var i = 0; i < response.length; i++) 
	{
		var numbers = response[i].latLong.split(',')
			
		var location = new google.maps.LatLng( parseFloat( numbers[0]), parseFloat( numbers[1] ) );
		
		users.push( response[i].user );
		
		if ( locationMarkers[response[i].user] )
		{
			locationMarkers[response[i].user].setAnimation(null);
			locationMarkers[response[i].user].setPosition( location );		
			server.GetMarkerInfo( response[i].user, onGetMarkerInfo );
		}
		else
		{
			var marker = new google.maps.Marker(
					{ position: location,
					  map: map,
					  title: response[i].user
					} );
			
			attachInfoWindow( marker )
			
			locationMarkers[response[i].user] = marker;
			
		}
		
	}
	
	updateUserList( users );
	
}

//
function attachInfoWindow( marker )
{
	var user = marker.getTitle();
	
	//create a new InfoWindow
	infoWindow = new google.maps.InfoWindow();
	
	//put it in the associative array, keyed on the user
	markerInfoWindows[user] = infoWindow
	

	
	//add a 'click' listener on the marker that opens the InfoWindow and populates it with sweet infos
	google.maps.event.addListener(marker, 'click', function(event) 
	{
		server.GetMarkerInfo( user, onGetMarkerInfoOpen );
	});
}

//callback that handles the server's response to "GetMarkerInfo"
function onGetMarkerInfoOpen( response )
{
	markerInfo = response;
		
	marker = locationMarkers[ markerInfo.user ];
	
	var user = marker.getTitle();
	
	var dateTime = new Date( response.dateTime );
	
	content = 'User: ' + user + '<br>Date: ' +  dateTime.toDateString() + '<br>Time: ' + dateTime.toTimeString()
	
	if( marker )
	{
		if ( markerInfoWindows[user] )
		{
			markerInfoWindows[user].setContent( content );
			markerInfoWindows[user].open( map, marker ); 	
		}			
	}
}


// callback that handles the server's response to "GetMarkerInfo"
function onGetMarkerInfo( response )
{
	markerInfo = response;
		
	marker = locationMarkers[ markerInfo.user ];
	
	var user = marker.getTitle();
	
	
	var dateTime = new Date( response.dateTime );
	
	content = 'User: ' + user + '<br>Date: ' +  dateTime.toDateString() + '<br>Time: ' + dateTime.toTimeString()
	
	if( marker )
	{
		if ( markerInfoWindows[user] )
		{
			markerInfoWindows[user].setContent( content );
		}			
	}
}


function setLocation( location )
{		
	if( $("li.ui-selected").length )
	{
		$( "li.ui-selected" ).each( function(){
			server.SetLocation( location, {user: this.id} );
		})
	}
	else
	{
		server.SetLocation( location );		
	}
	
	
	updateMap();
}

function codeAddress() {
	var address = document.getElementById("address").value;
	geocoder.geocode({
		'address' : address
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			map.setCenter(results[0].geometry.location);
			setLocation( results[0].geometry.location );
		} else {
			alert("Geocode was not successful for the following reason: "
					+ status);
		}
	});
}


function UserListControl(controlDiv, map) 
{	
	
	// Set CSS styles for the DIV containing the control
	// Setting padding to 5 px will offset the control
	// from the edge of the map
	controlDiv.style.padding = '5px';

	// Set CSS for the control border
	var controlUI = document.createElement('DIV');
	controlUI.style.backgroundColor = 'white';
	controlUI.style.borderStyle = 'solid';
	controlUI.style.borderWidth = '2px';
	controlUI.style.cursor = 'pointer';
	controlUI.style.textAlign = 'center';
	controlUI.title = 'Click to set the map to Home';
	controlDiv.appendChild(controlUI);

	// Set CSS for the control interior
	var controlText = document.createElement('DIV');
	controlText.style.fontFamily = 'Arial,sans-serif';
	controlText.style.fontSize = '12px';
	controlText.style.paddingLeft = '4px';
	controlText.style.paddingRight = '4px';
	controlText.innerHTML = 'Home';
	controlUI.appendChild(controlText);

	// Setup the click event listeners: simply set the map to Chicago
	google.maps.event.addDomListener(controlUI, 'click', function() {
		map.setCenter(chicago)
	});
	
}	

function onUserSelected()
{
	locationMarkers[this.id].setAnimation( google.maps.Animation.BOUNCE );
}

function initialize() {
	
	
	var latlng = new google.maps.LatLng(35.4675602, -97.51642759999);
		var myOptions = {
				zoom : 7,
				center : latlng,
				mapTypeId : google.maps.MapTypeId.ROADMAP
			}

		map = new google.maps.Map(document.getElementById("map_canvas"),
				myOptions);
		//ui stuff
		$("#user_list").selectable({
			stop : function() {
				$(".ui-selected", this).each(onUserSelected);
			},
			unselected : function(event, ui) {
				locationMarkers[ui.unselected.id].setAnimation( null );
			}
		});
		
		var userListControlDiv = document.createElement('DIV');
		userListControlDiv.index = 1;
		userListControlDiv.appendChild($("ol#user_list").get(0));
		map.controls[google.maps.ControlPosition.RIGHT_TOP].push(userListControlDiv);
		
					
		google.maps.event.addListener(map, 'click', function(event) {
			setLocation(event.latLng);
		});
		
		updateMap();
		
		

	geocoder = new google.maps.Geocoder();
	
	updateMap();
	
}