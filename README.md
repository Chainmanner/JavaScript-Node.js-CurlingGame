# [CLASS REDACTED] - Assignment [REDACTED] - Curling Game
------------------------------------------------------------------------------------------

# Project Info
Author: Gabriel Valachi
Student ID: [REDACTED]
Email: gabriel.valachi2@gmail.com [SCHOOL E-MAIL REDACTED]
Date Written: November 6, 2018
Node.js Version: v8.11.4
OS Tested On: XUbuntu 18.04, 64-bit
Socket.io Version: 2.1.1

Additional Dependencies
------------------------------------------------------------------------------------------
socket.io

Installing Dependencies
------------------------------------------------------------------------------------------
To install, cd to the same directory as client.js and server.js and enter:
		npm install socket.io
	
The program was written using socket.io 2.1.1.

Launching
------------------------------------------------------------------------------------------
	To launch the server, cd to the directory containing server.js and execute:
		node server.js

Testing/Usage
------------------------------------------------------------------------------------------
	To test the client code, execute the server and connect with a web browser to:
		http://localhost:3000/curling.html
	
	To join the game, enter a name and click on "Join Game (if slot available)".
	To shoot a stone of your color, click it, pull back, and release. Velocity
	depends on the distance of your pull.
	To exit the game and give up control of one of the player slots, either
	disconnect or click "Exit Game (relinquish slot)".

(Potential) Issues
------------------------------------------------------------------------------------------
	- Server: Stones going too fast might sometimes get stuck in each other.
		Best way to fix it is to shoot one of the stones with a very high
		impulse.
	- Server: Stone collision only works between TWO stones at a time.

	- Client: Might be occasionally sluggish. Could have to do with transmission,
		rendering, or Google Chrome.

	- Client-Servers Comms: A more-efficient solution to sending updates -
		client-side prediction - was in the works, but there was not enough
		time to make it happen. Some of the code from it is left over. The
		solution I settled with was to send updates to all clients every tick
		for stones that are moving (ie. nonzero velocity), which may not be
		the most efficient method (especially on a TCP connection).

	- Uncertain: When slowing down, stones might appear to stop at a different
		position than they actually stop at. Source of this problem is
		undetermined.

Additional Notes
------------------------------------------------------------------------------------------
There should be no copyrighted code in the uploaded files.
To discourage plagiarism, I removed as many identifying marks as possible about my university or the class this project was made for.
