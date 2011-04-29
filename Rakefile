require 'rake'
require File.expand_path('lib/leroy')

task :default => [:test]

task :test do
  Dir.glob('test/**/*_test.rb').each do |file|
    require File.expand_path(file)
  end
end
