class User < ActiveRecord::Base
  attr_accessible :secret

  acts_as_authentic do |c|
    c.validate_email_field = false
    c.validate_login_field = false
    c.validate_password_field = false
  end

  def self.find_or_create(auth)
  	unless user = User.find_by_foursquare_id(auth["uid"])
  		user = create! do |u|
        u.foursquare_id = auth["uid"]
        u.atoken = auth["credentials"]["token"]
      end
    end

    user
  end

  def get_overlaps
    overlaps = []
    
    10.times do |i|
      offset = i*100
      #TODO - Pretty up url
      response = HTTParty.get("https://api.foursquare.com/v2/users/" + self.foursquare_id.to_s + "/historysearch?&v=20130214&sort=newestfirst&oauth_token=" + self.atoken + "&offset=" + offset.to_s)
      response.parsed_response['response']['checkins']['items'].each do |i|
        if i['overlaps']
          checkin = {}
          checkin['id'] = i['id']
          checkin['created_at'] = i['createdAt'] + i['timeZoneOffset']
          checkin['shout'] = i['shout']
          checkin['venue_id'] = i['venue']['id']
          checkin['venue_name'] = i['venue']['name']
          friends = []
          i['overlaps']['items'].each do |o|
            friend = {}
            friend['user_id'] = o['user']['id']
            friend['user_name'] = o['user']['firstName'] + ' ' + (o['user']['lastName'] || '')
            friends << friend
          end
          checkin['friends'] = friends
          overlaps << checkin
        end
      end
    end

    self.overlaps = overlaps.to_json
    self.save
  end

end
