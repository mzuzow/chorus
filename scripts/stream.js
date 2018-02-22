// Description:
//   <description of the scripts functionality>
//
// Dependencies:
//   "<module name>": "<module version>"
//
// Configuration:
//   HUBOT_STREAM_HOST
//   HUBOT_STREAM_PORT
//   HUBOT_STREAM_MOUNT
//   HUBOT_STREAM_SOURCE_PASSWORD
//
// Commands:
//   hubot start party <Round ID> - Starts a listening party for a compo round
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//   <github username of the original script author>

const StreamManager = require('../lib/stream_manager');

function lastAccessed(brain) {
  let data = brain.get('lastAccessed');
  if (!data) {
    data = {};
    brain.set('lastAccessed', data);
  }

  return data;
}

let currentStream = null;

module.exports = function(robot) {
  robot.respond(/start party (.*)/i, function(res) {
    let [, round] = res.match;

    if (currentStream && !currentStream.stopped) {
      res.send('There is currently a listening party streaming. We can only stream one at a time.');
      return;
    }
    currentStream = new StreamManager(round);

    currentStream.on('playing', function(song) {
      res.send(`Playing "${song.title}" by ${song.artist}...`);
    });

    currentStream.on('compoMetadataFetching', function() {
      res.send(`Gathering round ${round} metadata...`);
    });

    currentStream.on('finish', function() {
      res.send('Finished playing...');
    });

    res.send(`Starting stream... ${currentStream.streamUrl()}`);

    currentStream.start();
  });

  robot.respond(/stop party/i, function(res) {
    if (!currentStream || currentStream.stopped) {
      res.send('There is no listening party to stop!');
      return;
    }

    currentStream.stop();
  });

  robot.respond(/skip song/i, function(res) {
    if (!currentStream || currentStream.stopped) {
      res.send('There is no listening party, currently!');
      return;
    }

    currentStream.skipSong();
  });

  robot.respond(/debug me/i, function(res) {
    let { user } = res.envelope;
    let userAccess = lastAccessed(robot.brain)[user.id];
    if (!userAccess) {
      userAccess = lastAccessed(robot.brain)[user.id] = {};
    }
    res.send(`you are user id "${user.id}", known as "${user.name}"`);
    res.send(`you last ran this command on ${userAccess.time}`);
    console.log(robot.brain.data);
    userAccess.time = new Date().toString();
  });
};
