var es = require('event-stream');
var JSONStream = require('JSONStream');
var lodash = require('lodash');
var rateLimit = require('function-rate-limit');
var request = require('request');

var FirechatDeleter = function(firechatUrl, firechatSecret, rateLimitParams) {
  this.firechatUrl = firechatUrl;
  this.firechatSecret = firechatSecret;
};

lodash.assign(FirechatDeleter.prototype, {
  deleteOlder: function(oldestTimestamp) {
    this._getRoomsStream().pipe(
      es.mapSync(function(room) {
        this._getMessagesStream(room).pipe(
          es.mapSync(function(message, messageId) {
            if (message.timestamp < oldestTimestamp) {
              this._deleteMessage(room, message);
            }
          }.bind(this))
        );
      }.bind(this))
    );
  },

  _getRoomsStream: function() {
    return es.readArray([
      {id: "-JZKhsBsZqjtlv64-yN5"},
      {id: "-JZLODE1YXYl7XUbfHCS"}
    ]);

    return request({url: this._getAllRoomsUrl()}).
      pipe(JSONStream.parse('*'));
  },

  _getMessagesStream: function(room) {
    return request({url: this._getAllMessagesUrl(room.id)}).
      pipe(JSONStream.parse('*', function(message, messageIdTuple) {
        return lodash.assign({id: messageIdTuple[0]}, message);
      }));
  },

  _deleteMessage: function(room, message) {
    console.log("DELETE", this._messageUrl(room.id, message.id), message.timestamp);
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
