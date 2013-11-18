/*
Screen of the snake game that shows all the action.
This snake game allows one presenter and two
controller. 
*/

define(['../../lib/multi', '/socket.io/socket.io.js', './game', '../sound', '../layout'], function (multiModule, socketio, Game, sound, layout) {

	var SESSION_TOKEN = 'snake-multiplayer';

	var multiOptions = {
		io: socketio,
		server: 'http://tinelaptopsony/',
		session: {
			minPlayerNeeded: 3,
			maxPlayerAllowed: 3,
			token: {
				// static token because we only need a single session
				func: 'staticToken',
				args: [SESSION_TOKEN]
			}
		}
	};

	// init and try to create the session
	var multi = multiModule.init(multiOptions);
	multi.createSession().then(onSession, onSessionFailed).done();


	// created a session
	function onSession(session) {

		var game;
		showJoinUrl();

		// waiting for our players
		session.on('aboveMinPlayerNeeded', onAboveMinPlayerNeeded);
		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
		session.on('playerJoined', onPlayerJoined);
		session.once('destroyed', onSessionDestroyed);


		function showJoinUrl() {
			// show url to join this session
			var url = window.location.host + '/snakemp';
			$('#waiting .controllerUrl').text(url);
			$('#waiting .controllerUrl').attr('href', 'http://' + url);
			layout.showSection('#waiting');
		}

		function startGame() {
			sound.onStartGame();
			game = new Game(session);
			game.on('stop', onGameFinished);
			game.start();
		}

		function onAgain() {
			// player wants to play again
			startGame();
		}

		function onGameFinished() {
			// assuming the game is finished here
			sound.onGameOver();
			layout.showSection('#finished');
			session.message('finished');
			session.once('again', onAgain);
		}

		function onPlayerJoined(event) {
			sound.onConnect();
			var color = layout.colors[event.player.number-1];
			var p = $('<div class="player"></div>');
			p.css('background-color', color.hex);
			$('#waiting .players').append(p);
			event.player.on('disconnected', function () {
				sound.onDisconnect();
				p.remove();
			});
			// event.player.attributes.color = color;
		}

		function onAboveMinPlayerNeeded() {
			// we have all players we need and can start the game now
			startGame();
		}

		function onBelowMinPlayerNeeded() {
			// we don't have enough players any longer
			game.off('stop', onGameFinished);
			game.stop();
			layout.showSection('#waiting');
		}

		function onSessionDestroyed() {
			// something went wrong - my session does not longer exist
			sound.onDisconnect();
			layout.showError('Ooops. The connection dropped. Try to reload.');
		}
	}

	// creating a session failed
	function onSessionFailed(error) {
		if (error instanceof multiModule.NoConnectionError) {
			layout.showError('There is no server connection. Please try again later.');
		} else {
			layout.showError('Something went terribly wrong. Please try again.');
		}
	}

});