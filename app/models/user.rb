class User < ActiveRecord::Base
  attr_accessible :secret

  has_many :friends
  has_many :checkins, :order => 'time ASC'

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

  def get_overlaps(x)
    colors = ['#f62323', '#f6b423', '#57d11b', '#06754a', '#3fc8e4', '#3f7ae4', '#603fe4', '#a73fe4', '#e43fa2', '#8e1e00', '#8e5b00', '#048e00', '#00768e', '#00278e', '#47008e', '#8e006e', '#ff7c7c', '#b0fbb4', '#b0fbf8', '#b0c4fb', '#ecb0fb', '#fbb0b6', '#490c03', '#493c03', '#264903', '#03493a', '#031f49', '#230349', '#490345', '#49031e']
    
    x.to_i.times do |num|
      offset = num*100
      #TODO - Pretty up url
      options = {:query => {:v => '20130214', :sort => 'newestfirst', :oauth_token => self.atoken, :offset => offset.to_s}}
      response = HTTParty.get("https://api.foursquare.com/v2/users/#{foursquare_id}/historysearch", options)
      response.parsed_response['response']['checkins']['items'].each do |i|
        if i['overlaps']
          unless self.checkins.find{|c| c.foursquare_id == i['id']}
            checkin = Checkin.create! do |c|
              c.user_id = self.id
              c.foursquare_id = i['id']
              c.time = i['createdAt'] + i['timeZoneOffset']
              c.shout = i['shout']
              c.venue_id = i['venue']['id']
              c.venue_name = i['venue']['name']
            end
            i['overlaps']['items'].each do |item|
              unless self.friends = friends.find{|f| f.foursquare_id == item['user']['id']}
                friend = Friend.create! do |f|
                  color = colors[0]
                  f.color = color
                  colors = colors.drop(1)
                  colors << color
                  f.user_id = self.id
                  f.foursquare_id = item['user']['id']
                  f.name = item['user']['firstName'] + ' ' + (item['user']['lastName'] || '')
                end
              end
              overlap = Overlap.create! do |o|
                o.friend_id = friend.id
                o.checkin_id = checkin.id
              end
            end
          end
        end
      end
    end

  end

end
