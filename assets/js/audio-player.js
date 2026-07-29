(function() {
	'use strict';

	var players = [];

	var formatTime = function(seconds) {
		if (!isFinite(seconds) || seconds < 0)
			seconds = 0;

		var minutes = Math.floor(seconds / 60);
		var remaining = Math.floor(seconds % 60);

		return minutes + ':' + String(remaining).padStart(2, '0');
	};

	var updatePlayer = function(player) {
		var audio = player.audio;
		var duration = audio.duration || 0;
		var current = audio.currentTime || 0;
		var progress = duration ? (current / duration) * 100 : 0;

		player.current.textContent = formatTime(current);
		player.duration.textContent = formatTime(duration);
		player.seek.value = progress;
		player.seek.style.setProperty('--progress', progress + '%');

		if (audio.paused) {
			player.card.classList.remove('is-playing');
			player.toggle.setAttribute('aria-label', 'Play ' + player.title);
			player.status.textContent = current > 0 && current < duration ? 'Paused' : 'Ready';
		} else {
			player.card.classList.add('is-playing');
			player.toggle.setAttribute('aria-label', 'Pause ' + player.title);
			player.status.textContent = 'Playing';
		}
	};

	var pauseOtherPlayers = function(activePlayer) {
		players.forEach(function(player) {
			if (player !== activePlayer)
				player.audio.pause();
		});
	};

	var initAudioPlayers = function() {
		document.querySelectorAll('[data-audio-player]').forEach(function(card) {
			var audio = card.querySelector('audio');
			var toggle = card.querySelector('[data-player-toggle]');
			var seek = card.querySelector('[data-player-seek]');
			var current = card.querySelector('[data-player-current]');
			var duration = card.querySelector('[data-player-duration]');
			var status = card.querySelector('[data-player-status]');
			var titleNode = card.querySelector('h3');
			var customPlayer = card.querySelector('.custom-player');

			if (!audio || !toggle || !seek || !current || !duration || !status)
				return;

			var player = {
				card: card,
				audio: audio,
				toggle: toggle,
				seek: seek,
				current: current,
				duration: duration,
				status: status,
				title: titleNode ? titleNode.textContent.trim() : 'demo reel'
			};

			players.push(player);
			card.classList.add('is-enhanced');

			if (customPlayer) {
				['mousedown', 'mouseup', 'mousemove', 'click', 'touchstart'].forEach(function(eventName) {
					customPlayer.addEventListener(eventName, function(event) {
						event.stopPropagation();
					});
				});
			}

			toggle.addEventListener('click', function() {
				if (audio.paused) {
					pauseOtherPlayers(player);

					var playAttempt = audio.play();

					if (playAttempt && typeof playAttempt.catch === 'function') {
						playAttempt.catch(function() {
							status.textContent = 'Ready';
						});
					}
				} else {
					audio.pause();
				}
			});

			seek.addEventListener('input', function() {
				var duration = audio.duration || 0;

				if (!duration)
					return;

				audio.currentTime = (Number(seek.value) / 100) * duration;
				updatePlayer(player);
			});

			audio.addEventListener('loadedmetadata', function() {
				updatePlayer(player);
			});

			audio.addEventListener('timeupdate', function() {
				updatePlayer(player);
			});

			audio.addEventListener('play', function() {
				pauseOtherPlayers(player);
				updatePlayer(player);
			});

			audio.addEventListener('pause', function() {
				updatePlayer(player);
			});

			audio.addEventListener('ended', function() {
				updatePlayer(player);
			});

			updatePlayer(player);
		});
	};

	var initCueRail = function() {
		var links = Array.prototype.slice.call(document.querySelectorAll('[data-cue-link]'));
		var sections = links.map(function(link) {
			return {
				link: link,
				section: document.getElementById(link.getAttribute('data-cue-link'))
			};
		}).filter(function(item) {
			return item.section;
		});

		if (!sections.length)
			return;

		var updateCue = function() {
			var viewportCenterX = window.innerWidth / 2;
			var viewportCenterY = window.innerHeight / 2;
			var active = sections[0];
			var activeDistance = Infinity;

			sections.forEach(function(item) {
				var rect = item.section.getBoundingClientRect();
				var centerX = rect.left + (rect.width / 2);
				var centerY = rect.top + (rect.height / 2);
				var distance = window.innerWidth > 980 ? Math.abs(centerX - viewportCenterX) : Math.abs(centerY - viewportCenterY);

				if (distance < activeDistance) {
					active = item;
					activeDistance = distance;
				}
			});

			sections.forEach(function(item) {
				item.link.classList.toggle('is-active', item === active);
			});
		};

		window.addEventListener('scroll', updateCue, { passive: true });
		window.addEventListener('resize', updateCue);
		updateCue();
	};

	document.addEventListener('DOMContentLoaded', function() {
		initAudioPlayers();
		initCueRail();
	});
})();
