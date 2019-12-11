require 'atk_toolbox'

system "_ build"
previous_process_finished_successfully = $?.success?
if previous_process_finished_successfully
    system "project sync"
    if -"npm version patch"
        puts "Publishing"
        system "npm publish"
        puts "Finished Publishing"
    end
end
