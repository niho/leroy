ENV['RACK_ENV'] = 'test'

dir = File.dirname(File.expand_path(__FILE__))
$LOAD_PATH.unshift dir + '/../lib'

require 'test/unit'
require 'rack/test'
require 'leroy'
