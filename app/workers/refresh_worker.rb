class RefreshWorker
  include Sidekiq::Worker
  def perform(user_id, x)
    user = User.find(user_id)
    user.get_overlaps(x)
    user.update_attribute(:last_refreshed, Time.now)
  end
end
