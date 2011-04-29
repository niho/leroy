require 'rubygems'
require 'sinatra/base'
require 'sinatra/async'
require File.expand_path('lib/leroy')

module Leroy
  class Server < Sinatra::Base
    register Sinatra::Async

    set :root, File.expand_path(File.join(File.dirname(__FILE__), '../..'))
    set :public, Proc.new { File.expand_path(File.join(root, 'lib/leroy/server/public')) }
    set :views, Proc.new { File.expand_path(File.join(root, 'lib/leroy/server/views')) }

    helpers do
      def uuid
        @uuid ||= UUID.new
      end
    end

    aget '/:channel' do |channel|
      mq = MQ.new
      exchange = mq.fanout("leroy.#{channel}")
      queue = mq.queue(params[:uuid] || uuid.generate).bind(exchange)
      queue.subscribe do |message|
        body { message }
        queue.unsubscribe
      end
    end

    post '/:channel' do
      halt(400) if params[:type].nil? || params[:type] == ''
      halt(400) if params[:data].nil? || params[:data] == ''
      mq = MQ.new
      mq.fanout("leroy.#{params[:channel]}").publish([params[:type], params[:data]].to_json)
    end

  end
end
