
if(typeof Function.prototype.scopedTo == 'undefined'){
  Function.prototype.scopedTo = function(context, args){
    var f = this;
    return function(){
      return f.apply(context, Array.prototype.slice.call(args || [])
        .concat(Array.prototype.slice.call(arguments)));
    };
  };
};

function generateUUID() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

var Push = function(access_token, options) {
  var defaults = {
    host: 'localhost',
    port: 80,
    secure: false,
    timeout: 1000
  };
  this.access_token = access_token;
  this.settings = $.extend(true, defaults, options);
  this.channels = new Push.Channels();
  this.uuid = generateUUID();
  return this;
};

Push.prototype = {
  subscribe: function(channel_name) {
    var channel = this.channels.add(channel_name, this);
    channel.connect();
    return channel;
  },
  
  unsubscribe: function(channel_name) {
    this.channels.remove(channel_name);
  },

  url: function(channel_name) {
    if(this.settings.secure) {
      return 'https://' + this.settings.host + ':' + this.settings.port + '/' + channel_name + '?access_token=' + this.access_token + '&uuid=' + this.uuid;
    } else {
      return 'http://' + this.settings.host + ':' + this.settings.port + '/' + channel_name + '?access_token=' + this.access_token + '&uuid=' + this.uuid;
    }
  }
};

Push.Channels = function() {
  this.channels = {};
};

Push.Channels.prototype = {
  add: function(channel_name, client) {
    var existing_channel = this.find(channel_name);
    if (!existing_channel) {
      var channel = new Push.Channel(channel_name, client);
      this.channels[channel_name] = channel;
      return channel;
    } else {
      return existing_channel;
    }
  },

  find: function(channel_name) {
    return this.channels[channel_name];
  },

  remove: function(channel_name) {
    delete this.channels[channel_name];
  }
};

Push.Channel = function(channel_name, client) {
  this.client = client;
  this.name = channel_name;
  this.handlers = {};
  this.global_handlers = [];
  this.connected = false;
  return this;
}

Push.Channel.prototype = {
  connect: function() {
    if(!this.connected)
      setTimeout(this.listen.scopedTo(this), 1000);
  },

  bind: function(event_name, handler) {
    this.handlers[event_name] = this.handlers[event_name] || [];
    this.handlers[event_name].push(handler);
    return this;
  },

  bind_all: function(handler) {
    this.global_handlers.push(handler);
    return this;
  },

  trigger: function(event_name, data) {
    this.dispatch(event_name, data);
    this.dispatch_global_handlers(event_name, data);
    return this;
  },

  dispatch: function(event_name, data) {
    var handlers = this.handlers[event_name];
    if(handlers) {
      for(var i = 0; i < handlers.length; i++) {
        handlers[i](data);
      }
    }
  },

  dispatch_global_handlers: function(event_name, data) {
    for(var i = 0; i < this.global_handlers.length; i++) {
      this.global_handlers[i](event_name, data);
    }
  },

  listen: function() {
    console.log('Listening to channel ' + this.name);
    $.ajax({
      type: "GET",
      url: this.client.url(this.name),
      async: true,
      cache: false,
      timeout:50000,
      success: function(data){
        try {
          var event = $.parseJSON(data);
          if(event) {
            console.log('Event on channel ' + this.name);
            this.trigger(event[0], event[1]);
            this.listen();
          } else {
            console.log('Empty response from channel' + this.name);
            setTimeout(this.listen.scopedTo(this), this.client.settings.timeout);
          }
        } catch(e) {
          console.log('Invalid JSON data in channel ' + this.name);
          setTimeout(this.listen.scopedTo(this), this.client.settings.timeout);
        }
      }.scopedTo(this),
      error: function(XMLHttpRequest, textStatus, errorThrown){
        console.log(textStatus + " (" + errorThrown + ")");
        setTimeout(this.listen.scopedTo(this), this.client.settings.timeout);
      }.scopedTo(this),
    });
    this.connected = true;
  }
};
