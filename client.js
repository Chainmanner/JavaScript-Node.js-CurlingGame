/*
 *	client.js
 *	The client code for Assignment [REDACTED].
 *	This is loaded automatically in curling.html.
 *	To execute it, start up server.js, open a browser, and go to:
 *		http://localhost:3000/curling.html
 *
 *	Gabriel Valachi ([STUDENT # REDACTED])
 *	November 6, 2018
 */

// ====== CLIENT GAME CODE ====== //

const CLIENT_TICKRATE = 1							// The rate at which the client ticks in milliseconds.

const TARGET_CENTERX = 100
const TARGET_CENTERY = 100
const TARGET_CENTERX_ZOOM = 300
const TARGET_CENTERY_ZOOM = 300

const STONE_RADIUS = 12					// The radius of the stones. Should be equal with the value on the server.

const canvas_main = document.getElementById("main-canvas")			// Main canvas.
const canvas_zoom = document.getElementById("zoom-canvas")			// Canvas that's zoomed-in on the target.

let client_stones = []			// Contains ID, color, X and Y position, destination X and Y position, and lerp time.
let client_playerOne = null		// Contains name and color.
let client_playerTwo = null		// Contains name and color.
let tempName = ""
let whoAmI = ""				// Name of the player that this client controls.
let myColor = ""

let stoneUnderTheInfluence = null	// ie. stone the player clicked to be shot.
let mouseX = 0
let mouseY = 0

// Draws the canvasses, and updates the bottom text indicating the players.
// This function's kinda long, so I suggest using the Pg Up/Down keys to traverse this.
function drawPage()
{
	// MAIN CANVAS
	const context_main = canvas_main.getContext("2d")
	context_main.strokeStyle = "black"
	context_main.fillStyle = "white";
	context_main.fillRect(0, 0, canvas_main.width, canvas_main.height)	// Erases the canvas.

	// First, let's draw the target on the main canvas.
	context_main.beginPath()
	context_main.fillStyle = "blue"
	context_main.arc( TARGET_CENTERX, TARGET_CENTERY, 75, 0, 2 * Math.PI )
	context_main.closePath()
	context_main.fill()

	context_main.beginPath()
	context_main.fillStyle = "white"
	context_main.arc( TARGET_CENTERX, TARGET_CENTERY, 55, 0, 2 * Math.PI )
	context_main.closePath()
	context_main.fill()

	context_main.beginPath()
	context_main.fillStyle = "red"
	context_main.arc( TARGET_CENTERX, TARGET_CENTERY, 35, 0, 2 * Math.PI )
	context_main.closePath()
	context_main.fill()
	
	context_main.beginPath()
	context_main.fillStyle = "white"
	context_main.arc( TARGET_CENTERX, TARGET_CENTERY, 15, 0, 2 * Math.PI )
	context_main.closePath()
	context_main.fill()

	// Now draw every stone on the canvas.
	for ( curStone of client_stones )
	{
		context_main.beginPath()
		context_main.fillStyle = "grey"
		context_main.arc( curStone.x, curStone.y, STONE_RADIUS, 0, 2 * Math.PI )
		context_main.closePath()
		context_main.fill()
		context_main.stroke()

		context_main.beginPath()
		context_main.fillStyle = curStone.color
		context_main.arc( curStone.x, curStone.y, STONE_RADIUS / 2, 0, 2 * Math.PI )
		context_main.closePath()
		context_main.fill()
	}

	// If the player wants to shoot a stone, draw a line showing the intended velocity.
	if ( stoneUnderTheInfluence !== null )
	{
		context_main.beginPath()
		context_main.moveTo( stoneUnderTheInfluence.x, stoneUnderTheInfluence.y )
		context_main.lineTo( mouseX, mouseY )
		context_main.closePath()
		context_main.stroke()
	}
	
	// ZOOMED-IN CANVAS	
	const context_zoom = canvas_zoom.getContext("2d")
	context_zoom.strokeStyle = "black"
	context_zoom.fillStyle = "white";
	context_zoom.fillRect(0, 0, canvas_zoom.width, canvas_zoom.height)	// Erases the canvas.

	// First, let's draw the target on the main canvas.
	context_zoom.beginPath()
	context_zoom.fillStyle = "blue"
	context_zoom.arc( TARGET_CENTERX_ZOOM, TARGET_CENTERY_ZOOM, 225, 0, 2 * Math.PI )
	context_zoom.closePath()
	context_zoom.fill()

	context_zoom.beginPath()
	context_zoom.fillStyle = "white"
	context_zoom.arc( TARGET_CENTERX_ZOOM, TARGET_CENTERY_ZOOM, 165, 0, 2 * Math.PI )
	context_zoom.closePath()
	context_zoom.fill()

	context_zoom.beginPath()
	context_zoom.fillStyle = "red"
	context_zoom.arc( TARGET_CENTERX_ZOOM, TARGET_CENTERY_ZOOM, 105, 0, 2 * Math.PI )
	context_zoom.closePath()
	context_zoom.fill()
	
	context_zoom.beginPath()
	context_zoom.fillStyle = "white"
	context_zoom.arc( TARGET_CENTERX_ZOOM, TARGET_CENTERY_ZOOM, 45, 0, 2 * Math.PI )
	context_zoom.closePath()
	context_zoom.fill()

	// Now draw every stone on the canvas.
	for ( curStone of client_stones )
	{
		context_zoom.beginPath()
		context_zoom.fillStyle = "grey"
		context_zoom.arc( curStone.x * 3, curStone.y * 3, STONE_RADIUS * 3, 0, 2 * Math.PI )
		context_zoom.closePath()
		context_zoom.fill()
		context_zoom.stroke()

		context_zoom.beginPath()
		context_zoom.fillStyle = curStone.color
		context_zoom.arc( curStone.x * 3, curStone.y * 3, STONE_RADIUS * 3 / 2, 0, 2 * Math.PI )
		context_zoom.closePath()
		context_zoom.fill()
	}

	// BOTTOM TEXT
	
	// First player status.
	let playerOneText = document.getElementById("playerOneText")
	playerOneText.innerHTML = "Player One (RED): " + (client_playerOne === null ? "unassigned" : client_playerOne.name)
	if ( client_playerOne !== null && client_playerOne.name === whoAmI )
		playerOneText.innerHTML += " (You)"	// Clearly indicate that this is the client, in case they forget.

	// Second player status.
	let playerTwoText = document.getElementById("playerTwoText")
	playerTwoText.innerHTML = "Player Two (YELLOW): " + (client_playerTwo === null ? "unassigned" : client_playerTwo.name)
	if ( client_playerTwo !== null && client_playerTwo.name === whoAmI )
		playerTwoText.innerHTML += " (You)"	// Clearly indicate that this is the client, in case they forget.
}

// Called when the "Join Game" button is clicked.
function onJoinGameClicked()
{
	tempName = document.getElementById("nameField").value
	let joinObj = { name: tempName }
	socket.emit( "joinGame", JSON.stringify(joinObj) )
}

// Called when the "Exit Game" button is clicked.
function onExitGameClicked()
{
	// No point in transmitting if neither player is me.
	if ( (client_playerOne !== null && client_playerOne.name === whoAmI) ||
		(client_playerTwo !== null && client_playerTwo.name === whoAmI) )
	{
		console.log( "GG NO RE" )
		socket.emit( "exitGame", JSON.stringify({ name: whoAmI }) )
		document.getElementById( "nameField" ).value = ""
		whoAmI = ""
		myColor = ""
	}
}

// Gets the stone at position (x, y).
function getStoneAtPosition(x, y)
{
	for ( stone of client_stones )
	{
		let dist = Math.sqrt( (stone.x - x) * (stone.x - x) + (stone.y - y) * (stone.y - y) )
		if ( dist <= STONE_RADIUS )
			return stone
	}

	return null
}

// Called when the first mouse button is pressed.
// Applied to canvas_main only.
function onMouseDown(e)
{
	let crect = canvas_main.getBoundingClientRect()
	console.log(window.screenLeft)
	let clickX = e.pageX - crect.left// - window.screenLeft	// WARNING: window.screenLeft not compatible with Firefox!
	let clickY = e.pageY - crect.top// - window.screenTop	// WARNING: window.screenTop not compatible with Firefox!

	console.log("MDOWN x:" + clickX + " y:" + clickY)

	// Check if we've clicked a stone, and if it's our own.
	// If we have, set it to be the stone to be shot, and activate the other mouse handlers.
	stoneUnderTheInfluence = getStoneAtPosition(clickX, clickY)
	if ( stoneUnderTheInfluence !== null && stoneUnderTheInfluence.color === myColor )
	{
		mouseX = clickX
		mouseY = clickY

		//Activate the other mouse handlers.
		//canvas_main.onmousemove = onMouseMove
		//canvas_main.onmouseup = onMouseUp
		window.onmousemove = onMouseMove
		window.onmouseup = onMouseUp
	}
	else
		stoneUnderTheInfluence = null

	e.stopPropagation()
	e.preventDefault()
}

// Called whenever the mouse is moved.
// Activated when the mouse is clicked on canvas_main.
// Applied to the whole webpage.
function onMouseMove(e)
{
	let crect = canvas_main.getBoundingClientRect()
	mouseX = e.pageX - crect.left// - window.screenLeft	// TODO: Scrolling fix ain't working for some reason.
	mouseY = e.pageY - crect.top// - window.screenTop
	//console.log("MMOVE x:" + mouseX + " y:" + mouseY)	// Too laggy to keep.

	e.stopPropagation()
}

// Called whenever the mouse is released.
// Activated when the mouse is clicked on canvas_main.
// Applied to the whole webpage.
function onMouseUp(e)
{
	console.log("MUP")

	e.stopPropagation()

	// Disable the other mouse handlers, since they're only needed when the mouse is down.
	//canvas_main.onmousemove = null
	//canvas_main.onmouseup = null
	window.onmousemove = null
	window.onmouseup = null

	let total = Math.sqrt( (stoneUnderTheInfluence.x - mouseX) * (stoneUnderTheInfluence.x - mouseX)
				+ (stoneUnderTheInfluence.y - mouseY) * (stoneUnderTheInfluence.y - mouseY) )
	let impulseX = (stoneUnderTheInfluence.x - mouseX) / 50
	let impulseY = (stoneUnderTheInfluence.y - mouseY) / 50
	console.log("- IMPULSE id:" + stoneUnderTheInfluence.id + " x:" + impulseX + " y:" + impulseY)
	
	// Let's send a message to the server to invoke the velocity.
	socket.emit( "impulseStone", JSON.stringify( { id: stoneUnderTheInfluence.id, impulseX: impulseX, impulseY: impulseY } ) )

	stoneUnderTheInfluence = null
}

// TODO: Lerping stones from position updates sent by the server.

let client_ticks = 0

// Called every CLIENT_TICKRATE milliseconds.
function tick()
{
	drawPage()

	client_ticks++
}

// ====== SOCKET-BASED CLIENT INTERACTION ====== //

// The called functions will know what this is by the time they use it, so no need to declare this at the top.
let socket = io( "http://" + window.document.location.host )

// === COMMS: JOINING/EXITING A GAME === //

// Failed - Already playing.
socket.on( "joinGame_FAIL_ALREADYIN", function(data) {
	let parsedData = JSON.parse(data)
	if ( parsedData.name === tempName )
	{
		console.log( "FAILED TO JOIN - ALREADY IN" )
		document.getElementById( "nameField" ).value = ""
	}
})

// Failed - No slots available.
socket.on( "joinGame_FAIL_NOSPACE", function(data) {
	let parsedData = JSON.parse(data)
	if ( parsedData.name === tempName )
	{
		console.log( "FAILED TO JOIN - NO SLOTS AVAILABLE" )
		document.getElementById( "nameField" ).value = ""
	}
})

// Success!
socket.on( "joinGame_SUCCESS", function(data) {
	let parsedData = JSON.parse(data)	// Contains name and color.
	
	// Updates the player info, regardless of whether or not the joining player is this client.
	if ( parsedData.player === "one" )
	{
		client_playerOne = { name: parsedData.name, color: parsedData.color }
		console.log( client_playerOne.name + " IS NOW PLAYER ONE" )
		if ( client_playerOne.name === tempName )	// That's me!
		{
			whoAmI = client_playerOne.name		// Make the name official.
			myColor = client_playerOne.color	// Set my color to the official playerOne color.
			console.log( "THAT'S YOU" )
			document.getElementById( "nameField" ).value = ""	// Clear the name field.
		}
	}
	else if ( parsedData.player === "two" )
	{
		client_playerTwo = { name: parsedData.name, color: parsedData.color }
		console.log( client_playerTwo.name + " IS NOW PLAYER TWO" )
		if ( client_playerTwo.name === tempName )	// That's me!
		{
			whoAmI = client_playerTwo.name		// Make the name official.
			myColor = client_playerTwo.color	// Set my color to the official playerTwo color.
			console.log( "THAT'S YOU" )
			document.getElementById( "nameField" ).value = ""	// Clear the name field.
		}
	}
	else
	{
		console.log( "SOMEBODY MESSED UP - PLAYER DATA RECEIVED BUT WRONG SLOT GIVEN" )
	}
})

// === COMMS: GAME DATA === //

// Server is sending ALL data to the client.
socket.on( "allInfo", function(data) {
	let parsedData = JSON.parse(data)
	client_playerOne = parsedData.playerOne
	client_playerTwo = parsedData.playerTwo
	client_stones = parsedData.stones
	//console.log( "RECEIVED DATA FROM SERVER" )
})

// Server's sending updates for a stone only.
socket.on( "stoneUpdate", function(data) {
	let parsedData = JSON.parse(data)
	for ( stone of client_stones )
	{
		if ( stone.id === parsedData.id )
		{
			// TODO: Lerping!
			stone.x = parsedData.x	// FIXME: For now, let's see if this works.
			stone.y = parsedData.y	// FIXME: For now, let's see if this works.
			
			// TODO: Add these in when lerping is implemented.
			//stone.lerpX = parsedData.x
			//stone.lerpY = parsedData.y
			//stone.lerpTime = parsedData.lerpTime
		}
	}
})



// Called when the window is done loading.
window.onload = (function() {
	console.log("PAGE LOADED")
	document.getElementById("main-canvas").onmousedown = onMouseDown
	socket.emit( "requestInfo", null )	// At this point, we're ready to retrieve the game data from the server.
	setInterval( tick, CLIENT_TICKRATE )
	drawPage()
})
