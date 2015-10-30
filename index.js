var async = require('async');
var es = require('event-stream');
var JSONStream = require('JSONStream');
var lodash = require('lodash');
var rateLimit = require('function-rate-limit');
var request = require('request');

var FirechatDeleter = function(firechatUrl, firechatSecret, rateLimitParams) {
  this.firechatUrl = firechatUrl;
  this.firechatSecret = firechatSecret;

  if (rateLimitParams) {
    this._deleteMessage = rateLimit(
      rateLimitParams.count,
      rateLimitParams.interval,
      this._deleteMessage
    );
  }
};

var totalCount = 0;
var deletedCount = 0;

lodash.assign(FirechatDeleter.prototype, {
  deleteOlder: function(oldestTimestamp) {
    var queue = async.queue(function(room, roomCallback) {
      console.log('downloading messages for', room.name);
      var messagesStream = this._getMessagesStream(room);
      messagesStream.pipe(
        es.map(function(message, messageCallback) {
          if (message.timestamp < oldestTimestamp) {
            this._deleteMessage(room, message, function() {
              messageCallback();
            });
          } else {
            messageCallback();
          }
        }.bind(this))
      ).on('end', function() { roomCallback(); });
    }.bind(this));

    this._getRoomsStream().pipe(
      es.mapSync(function(room) {
        queue.push(room);
      })
    )
  },

  _getRoomsStream: function() {
    return request({url: this._getAllRoomsUrl() + '?auth=' + this.firechatSecret}).
      pipe(JSONStream.parse('*'));
  },

  _getMessagesStream: function(room) {
    return request({url: this._getAllMessagesUrl(room.id) + '?auth=' + this.firechatSecret}).
      pipe(JSONStream.parse('*', function(message, messageIdTuple) {
        return lodash.assign({id: messageIdTuple[0]}, message);
      }));
  },

  _deleteMessage: function(room, message, callback) {
    var url = this._messageUrl(room.id, message.id);

    request.del(url + '?auth=' + this.firechatSecret).
      on('error', function(err) { console.error(err, url); }).
      on('response', function(response, body) {
        if (response.statusCode !== 200) console.error(response.statusCode, url, body);
        if (!(++count % 100)) {
          console.log('deleted', count, 'messages');
          callback();
        }
      });
  },

  _getAllRoomsUrl: function() {
    return this.firechatUrl + "/room-metadata.json";
  },

  _getAllMessagesUrl: function(roomId) {
    return this.firechatUrl + "/room-messages/" + roomId + ".json";
  },

  _messageUrl: function(roomId, messageId) {
    return this.firechatUrl + "/room-messages/" + roomId + "/" + messageId + ".json";
  },
});

module.exports = FirechatDeleter;
