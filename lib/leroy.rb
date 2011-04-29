require 'rubygems'
require 'bundler/setup'
require 'eventmachine'
require 'amqp'
require 'uuid'
require 'json'

ENV['RACK_ENV'] ||= 'development'

$LOAD_PATH.unshift(File.expand_path('lib'))

EM.next_tick do
  AMQP.connect(:host => "localhost", :user => "guest", :pass => "guest", :vhost => "/")
end

module Leroy; end
