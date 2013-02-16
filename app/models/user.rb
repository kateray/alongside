class User < ActiveRecord::Base
  # attr_accessible :title, :body

  def self.find_or_create(auth)
  	unless user = User.find_by_foursquare_id(auth["uid"])
  		create! do |user|
        user.foursquare_id = auth["uid"]
        user.atoken = auth["credentials"]["token"]
      end
    end

    user
  end
end
