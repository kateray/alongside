task :all_data => :environment do
  puts "Checking all users..."

  User.all.where('last_refreshed < ?', (2.weeks.ago - 2.days)).each_with_index do |user, i|
    perform_at = i*12
    RefreshWorker.perform_in(perform_at.minutes, user.id, 50)
    puts "Scheduled user #{user.id}"
  end
  puts "done."

end
