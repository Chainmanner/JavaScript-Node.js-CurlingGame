/*
 *	server.js
 *	This is the server for Assignment [REDACTED].
 *	To run, execute (in the same directory as this):
 *		node server.js
 *
 *	Gabriel Valachi ([STUDENT # REDACTED])
 *	November 6, 2018
 */

const http = require("http")
const url = require("url")
const fs = require("fs")

const ROOT = "."					// Root directory.
const PORT = process.env.PORT || 3000

// ====== GAME CODE ====== //

const TICKRATE = 1					// The rate at which the server ticks in milliseconds.
const UPDATE_RATE = 1					// The rate at which the server sends position updates in milliseconds, when necessary.

// Dimensions of the field.
const FIELD_X = 200
const FIELD_Y = 600

// Player info contains name and color.
let playerOne = null
let playerTwo = null

let stones = []
let curStoneID = 0
const STONE_MASS = 17
const STONE_RADIUS = 12
//const KINETIC_FRICTION_COEFFICIENT = 0.1
const DECELERATION = 0.999

// Constructor for Stones.
function Stone(x, y, owner)
{
	this.id = curStoneID
	curStoneID++

	this.owner = owner;
	this.color = "black"				// Set dynamically in the code.

	this.x = x
	this.y = y
	this.velX = 0					// Measured in px/s.
	this.velY = 0					// Measured in px/s.
	//this.accelX = 0
	//this.accelY = 0
	//this.weightInNewtons = STONE_WEIGHT * 9.8	// Weight = mg
	this.mass = STONE_MASS
	this.radius = STONE_RADIUS
}

// Returns the distance between two points.
function distanceBetween( x1, y1, x2, y2 )
{
	return Math.sqrt( (x2 - x1) * (x2 - x1)
		+ (y2 - y1) * (y2 - y1) )
}

// Returns whether or not two stones are touching.
function stonesInContact( stoneA, stoneB )
{
	return ( distanceBetween( stoneA.x, stoneA.y, stoneB.x, stoneB.y ) <= stoneA.radius + stoneB.radius )
}

// Every tick, updates the stones' positions, velocities, etc. and reacts to stones colliding with walls or other stones.
function handleStonePhysics()
{
	// i = index of current stone
	// I wouldn't normally use a counter loop, but I'm retrofitting here
	// because I forgot a for-of loop iterates over ITEMS, not INDICES.
	for ( let i = 0; i < stones.length; i++ )
	{

		stones[i].x += stones[i].velX
		stones[i].y += stones[i].velY

		//if ( nextPosUpdateTime <= ticks )
		{
			// Send updates only if there's something to update.
			if ( stones[i].velX !== 0 && stones[i].velY !== 0 )
			{
				io.emit( "stoneUpdate", JSON.stringify({
									id: stones[i].id,
									x: stones[i].x,
									y: stones[i].y,
									lerpTime: UPDATE_RATE	// TODO: Lerping!
									}) )
			}

			//nextPosUpdateTime = ticks + UPDATE_RATE
		}

		//stones[i].velX += stones[i].accelX
		//stones[i].velY += stones[i].accelY
		
		// Vf = Vi + a*t
		// a = (Vf - Vi) / t
		
		// There's not enough time to accurately implement 2D kinetics,
		// so I'm settling with this, for now at least.
		stones[i].velX *= DECELERATION
		stones[i].velY *= DECELERATION
		// For optimization, make the stone go to sleep if it's below a certain threshold.
		if ( Math.abs(stones[i].velX) <= 0.0025 ) stones[i].velX = 0
		if ( Math.abs(stones[i].velY) <= 0.0025 ) stones[i].velY = 0

		// Detect if the stone's in contact with the edges of the field.
		if ( stones[i].x - stones[i].radius <= 0
			|| stones[i].x + stones[i].radius >= FIELD_X )
		{
			stones[i].velX *= -1	// Flip direction horizontally, if colliding on left or right edges.
			stones[i].x = ( stones[i].velX < 0 ? FIELD_X - stones[i].radius - 1 : stones[i].radius + 1 )
			//console.log("BOUNCE X " + stones[i].velX)
		}
		if ( stones[i].y - stones[i].radius <= 0
			|| stones[i].y + stones[i].radius >= FIELD_Y )
		{
			stones[i].velY *= -1	// Flip direction vertically, if colliding on top or bottom edges.
			stones[i].y = ( stones[i].velY < 0 ? FIELD_Y - stones[i].radius - 1 : stones[i].radius + 1 )
			//console.log("BOUNCE Y " + stones[i].velY)
		}

		// Collision between stones. Now we'll have some fun.
		// Again, counter loop for retrofitting an error.
		for ( let j = 0; j < stones.length; j++ )
		{
			if ( stonesInContact( stones[i], stones[j] ) )
			{
				// Collision physics are based off momentum.
				// Also, the collision is elastic, so no energy is lost when colliding.
				// I'm not gonna include the momentum equation here, since it's annoying to write.
				let initialVelXI = stones[i].velX
				let initialVelYI = stones[i].velY
				let initialVelXJ = stones[j].velX
				let initialVelYJ = stones[j].velY
				stones[i].velX = (initialVelXI * (stones[i].mass - stones[j].mass) + 2 * stones[j].mass * initialVelXJ) / (stones[i].mass + stones[j].mass)
				stones[i].velY = (initialVelYI * (stones[i].mass - stones[j].mass) + 2 * stones[j].mass * initialVelYJ) / (stones[i].mass + stones[j].mass)
				stones[j].velX = (initialVelXJ * (stones[j].mass - stones[i].mass) + 2 * stones[i].mass * initialVelXI) / (stones[j].mass + stones[i].mass)
				stones[j].velY = (initialVelYJ * (stones[j].mass - stones[i].mass) + 2 * stones[i].mass * initialVelYI) / (stones[j].mass + stones[i].mass)
			}
		}

	}
}

function setup()
{
	stones.push( new Stone(20, 575, "one") )
	stones.push( new Stone(50, 575, "one") )
	stones.push( new Stone(80, 575, "one") )
	stones.push( new Stone(120, 575, "two") )
	stones.push( new Stone(150, 575, "two") )
	stones.push( new Stone(180, 575, "two") )
	setInterval( tick, TICKRATE )
}

let ticks = 0
let nextPosUpdateTime = 0

// Called every TICKRATE milliseconds.
function tick()
{
	handleStonePhysics()

	// Update the stone color, depending on the owner, if necessary.
	for ( stone of stones )
	{
		if ( stone.owner === "one" && playerOne !== null )
			stone.color = "red"
		else if ( stone.owner === "two" && playerTwo !== null )
			stone.color = "yellow"
		else
			stone.color = "black"
	}
	

	ticks++
}

// ====== SOCKET SERVER CODE ====== //

const server = http.createServer( staticServerHandler )
const io = require("socket.io")(server)			// Creates the socket for this server.

// Helper function to package all the data to be sent to the client.
// This exists because it'll need to be done in multiple places.
function allData()
{
	let packageForClient = { playerOne: null, playerTwo: null, stones: [] }
	
	// Here we build the data to be sent to the player, instead of sending them directory.
	// This is because sockets (in playerOne and playerTwo) can't be transmitted,
	// and to only send the necessary data.
	if ( playerOne !== null )
		packageForClient.playerOne = { name: playerOne.name, color: playerOne.color }
	if ( playerTwo !== null )
		packageForClient.playerTwo = { name: playerTwo.name, color: playerTwo.color }
	for ( stone of stones )
	{
		if ( stone.owner === "one" && playerOne !== null )
			stone.color = "red"
		else if ( stone.owner === "two" && playerTwo !== null )
			stone.color = "yellow"
		else
			stone.color = "black"
		packageForClient.stones.push( { id: stone.id, color: stone.color, x: stone.x, y: stone.y } )
	}

	//console.log( JSON.stringify(packageForClient) )
	return packageForClient
}

// Called when a client connects.
io.on("connection", function(socket) {
	console.log( "CONNECTED: " + socket )
	//socket.emit("connect_RECVDATA", JSON.stringify({ stones: stones }))	// Let's not assume they're ready for data until they ask for it...
	
	// Client wants to join a game.
	socket.on("joinGame", function(data) {	// Joining a game.
		console.log("PLAYER JOINING GAME WITH DATA: " + data)
		let parsedData = JSON.parse(data)			// Contains only a name.
		if ( playerOne === null )		// If playerOne's empty, stick the incoming player in this slot.
		{
			console.log( " - ATTEMPTING TO SET PLAYER ONE TO " + parsedData.name )
			if ( playerTwo !== null && (playerTwo.name === parsedData.name || playerTwo.socket === socket) )
			{
				// Joining player's already in the other slot.
				console.log("- - FAILED: PLAYER ALREADY PLAYER TWO")
				socket.emit("joinGame_FAIL_ALREADYIN", JSON.stringify({ name: parsedData.name }))
				return
			}
			playerOne = { name: parsedData.name, color: "red", socket: socket }
			console.log("- - SUCCESS")
			io.emit( "joinGame_SUCCESS", JSON.stringify({ name: parsedData.name, color: "red", player: "one" }) )

			// Success! Update the game information on all clients.
			for ( stone of stones )	// Person joining generally causes colors to update.
			{
				if ( stone.owner === "one" && playerOne !== null )
					stone.color = "red"
				else if ( stone.owner === "two" && playerTwo !== null )
					stone.color = "yellow"
				else
					stone.color = "black"
			}
			io.emit( "allInfo", JSON.stringify( allData() ) )
		}
		else if ( playerTwo === null )		// If playerTwo's empty, stick the incoming player in this slot.
		{
			console.log( " - ATTEMPTING TO SET PLAYER TWO TO " + parsedData.name )
			if ( playerOne !== null && (playerOne.name === parsedData.name || playerOne.socket === socket) )
			{
				// Joining player's already in the other slot.
				console.log("- - FAILED: PLAYER ALREADY PLAYER ONE")
				socket.emit("joinGame_FAIL_ALREADYIN", JSON.stringify({ name: parsedData.name}))
				return
			}
			playerTwo = { name: parsedData.name, color: "yellow", socket: socket }
			console.log("- - SUCCESS")
			io.emit( "joinGame_SUCCESS", JSON.stringify({ name: parsedData.name, color: "yellow",  player: "two" }) )

			// Success! Update the game information on all clients.
			for ( stone of stones )	// Person joining generally causes colors to update.
			{
				if ( stone.owner === "one" && playerOne !== null )
					stone.color = "red"
				else if ( stone.owner === "two" && playerTwo !== null )
					stone.color = "yellow"
				else
					stone.color = "black"
			}
			io.emit( "allInfo", JSON.stringify( allData() ) )
		}
		else	// No slots available.
		{
			console.log( " - FAILED: BOTH PLAYER SPACES OCCUPIED" )
			io.emit( "joinGame_FAIL_NOSPACE", JSON.stringify({ name: parsedData.name }) )
		}
	})

	// Client wants to exit a game.
	socket.on( "exitGame", function(data) {
		let parsedData = JSON.parse(data)	// Contains the name of the player relinquishing control.
		if ( playerOne !== null && playerOne.name === parsedData.name && playerOne.socket === socket )
		{
			console.log( "REMOVING PLAYER ONE: " + playerOne.name )
			playerOne = null
			io.emit( "allInfo", JSON.stringify( allData() ) )	// Send the update to all connected clients.
		}
		else if ( playerTwo !== null && playerTwo.name === parsedData.name && playerTwo.socket === socket )
		{
			console.log( "REMOVING PLAYER TWO: " + playerTwo.name )
			playerTwo = null
			io.emit( "allInfo", JSON.stringify( allData() ) )	// Send the update to all connected clients.
		}
	})

	// Client has disconnected.
	socket.on( "disconnect", function(reason) {
		// Same code as if the user clicked "Exit Game".
		if ( playerOne !== null && playerOne.socket === socket )
		{
			console.log( "PLAYER ONE DISCONNECTED: " + playerOne.name )
			playerOne = null
			io.emit( "allInfo", JSON.stringify( allData() ) )
		}
		else if ( playerTwo !== null && playerTwo.socket === socket )
		{
			console.log( "PLAYER TWO DISCONNECTED: " + playerTwo.name )
			playerTwo = null
			io.emit( "allInfo", JSON.stringify( allData() ) )
		}
	})

	// Client requests info on players and stones.
	socket.on( "requestInfo", function(data) {
		socket.emit( "allInfo", JSON.stringify( allData() ) )
	})

	// Client's shooting a stone.
	socket.on( "impulseStone", function(data) {
		let parsedData = JSON.parse(data)	// Contains stone id and velocity impulse.
		let foundStone = false
		let stoneIndex
		for ( stoneIndex = 0; stoneIndex < stones.length; stoneIndex++ )
		{
			if ( stones[ stoneIndex ].id === parsedData.id )
			{
				foundStone = true
				break
			}
		}
		if ( foundStone )
		{
			console.log( "IMPULSE id:" + parsedData.id + " index:" + stoneIndex
				+ " impulseX:" + parsedData.impulseX + " impulseY:" + parsedData.impulseY )
			// Only allow the impulse if the sender is the owner of the stone.
			if ( (stones[ stoneIndex ].owner === "one" && playerOne !== null && playerOne.socket === socket) ||
				(stones[ stoneIndex ].owner === "two" && playerTwo !== null && playerTwo.socket === socket) )
			{
				stones[ stoneIndex ].velX = parsedData.impulseX
				stones[ stoneIndex ].velY = parsedData.impulseY
			}
			else
				console.log("IMPULSE FAILED!")
		}
	})
})

setup()
server.listen(PORT)	// Done setup, now let people connect to the server.
console.log("Server now connected on port " + PORT + ".")
console.log("To test, please connect to:")
console.log("    http://localhost:" + PORT + "/curling.html")

// ====== STATIC SERVER CODE ====== //

const MIMES = {
  css: "text/css",
  gif: "image/gif",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "application/javascript",
  json: "application/json",
  png: "image/png",
  svg: "image/svg+xml",
  txt: "text/plain"
}

const getMime = function(fname) {
  //Use file extension to determine the correct response MIME type
  for (let type in MIMES) {
    if (fname.indexOf(type, fname.length - type.length) !== -1) {
       return MIMES[type]
    }
  }
  return MIMES["txt"]
}

// Handler for the static server, ie. the one sending files to the client.
function staticServerHandler(request, response)
{
	let urlObj = url.parse(request.url, true, false)
	console.log("\n----------------------------------------")
	console.log("REQUEST: " + urlObj.pathname)
	console.log("TYPE: " + request.method)

	let incomingData = ""
	request.on("data", function(fragment) {
		incomingData += fragment
	})

	request.on("end", function() {
		console.log(" - DATA: " + incomingData)

		if ( request.method === "GET" )
		{
			let urlFilepath = ROOT + decodeURIComponent(urlObj.pathname)
			if ( urlObj.pathname === "/" )
				urlFilepath = ROOT + "/index.html"
			// This is to prevent directory traversal.
			urlFilepath = urlFilepath.replace(/^\.\.[\/\\]+/g, "")

			fs.readFile( urlFilepath, function(error, data) {
				if ( error )
				{
					console.log("!! ERROR: " + JSON.stringify(error))
					response.writeHead(404)
					response.end(JSON.stringify(error))
					return
				}
				response.writeHead( 200, "Content-Type:" + getMime(urlFilepath) )
				response.end(data)
			})
		}
	})
}
