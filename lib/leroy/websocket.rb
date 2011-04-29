require File.expand_path('lib/leroy')
require 'leroy/version'
require 'em-websocket'

uuid = UUID.new

ENV['HOST'] ||= '0.0.0.0'
ENV['PORT'] ||= '8080'

puts ">> Leroy WebSockets server (v#{Leroy::VERSION})"
puts ">> Listening to ws://#{ENV['HOST']}:#{ENV['PORT']}/, CTRL+C to stop"

EventMachine::WebSocket.start(:host => ENV['HOST'], :port => ENV['PORT'].to_i) do |ws|
  ws.onopen do
    puts "WebSocket opened"

    mq = MQ.new
    mq.queue(uuid.generate).bind(mq.fanout("leroy.test")).subscribe do |message|
      puts message
      ws.send message
    end
  end

  ws.onclose do
    puts "WebSocket closed"
  end
end
