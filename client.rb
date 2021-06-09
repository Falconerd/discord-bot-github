require 'socket'
start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

s = TCPSocket.new 'localhost', 8080

s.write("whatever payload\n");

s.each_line do |line|
    #puts line
end

s.close
end_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
elapsed = end_time - start_time
puts "Elapsed: #{elapsed}"
