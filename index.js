var es = require('event-stream');
var JSONStream = require('JSONStream');
var lodash = require('lodash');
var rateLimit = require('function-rate-limit');
var request = require('request');

var FirechatDeleter = function(args) {
  this.firechatUrl = args.url;
  this.firechatSecret = args.secret;
  var rateLimitParams = args.rateLimit;

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
  totalCount: 0,
  deletedCount: 0,

  deleteOlder: function(oldestTimestamp) {
    var messagesStream = this._getMessagesStream();
    messagesStream.pipe(
      es.mapSync(function(message) {
        ++totalCount;
        if (message.timestamp < oldestTimestamp) {
          this._deleteMessage(message);
        }
      }.bind(this))
    );
  },

  _getMessagesStream: function() {
    return request({url: this._getEverythingUrl() + '?auth=' + this.firechatSecret}).
      pipe(JSONStream.parse(['room-messages', true, true], function(message, keyPath) {
        return lodash.assign({id: keyPath[2], roomId: keyPath[1]}, message);
      }));
  },

  _deleteMessage: function(message) {
    var url = this._messageUrl(message.roomId, message.id);
    request.del(url + '?auth=' + this.firechatSecret).
      on('error', function(err) { console.error(err, url); }).
      on('response', function(response, body) {
        if (response.statusCode !== 200) {
          process.stderr.write(response.statusCode + " deleting " + url + ": " + body + "\n");
        }
        if (!(++this.deletedCount % 100)) {
          process.stdout.write("deleted " + this.deletedCount + " of " + this.totalCount + " messages\n");
        }
      }.bind(this));
  },

  _getEverythingUrl: function() {
    return this.firechatUrl + ".json";
  },

  _messageUrl: function(roomId, messageId) {
    return this.firechatUrl + "/room-messages/" + roomId + "/" + messageId + ".json";
  },
});

module.exports = FirechatDeleter;
