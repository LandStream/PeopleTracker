function Request(function_name, opt_argv) 
{

	// If optional arguments was not provided, create it as empty
	if (!opt_argv)
		opt_argv = new Array();

	// Find if the last arg is a callback function; save it
	var callback = null;
	var len = opt_argv.length;
	if (len > 0 && typeof opt_argv[len - 1] == 'function') {
		callback = opt_argv[len - 1];
		opt_argv.length--;
	}
	var async = (callback != null);

	// Encode the arguments in to a URI
	var query = 'action=' + encodeURIComponent(function_name);
	for ( var i = 0; i < opt_argv.length; i++) {
		var key = 'arg' + i;
		var val = JSON.stringify(opt_argv[i]);
		query += '&' + key + '=' + encodeURIComponent(val);
	}
	query += '&time=' + new Date().getTime(); // IE cache workaround

	// See http://en.wikipedia.org/wiki/XMLHttpRequest to make this
	// cross-browser compatible
	var req = new XMLHttpRequest();

	// Create a 'GET' request w/ an optional callback handler
	req.open('GET', '/rpc?' + query, async);

	if (async) {
		req.onreadystatechange = function() {
			if (req.readyState == 4 && req.status == 200) {
				var response = null;
				try {
					response = JSON.parse(req.responseText);
				} catch (e) {
					response = req.responseText;
				}
				callback(response);
			}
		}
	}

	// Make the actual request
	req.send(null);
}

//Adds a stub function that will pass the arguments to the AJAX call
function InstallFunction(obj, functionName) {
  obj[functionName] = function() { Request(functionName, arguments); }
}

// Server object that will contain the callable methods
var server = {};

// Insert 'Add' as the name of a callable method
InstallFunction(server, 'SetLocation');
InstallFunction(server, 'GetAllMarkers');
InstallFunction(server, 'GetMarkerInfo');
InstallFunction(server, 'GetCurrentUser');