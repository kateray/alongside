class User < ActiveRecord::Base
  has_many :friends
  has_many :checkins

  acts_as_authentic do |c|
    c.validate_email_field = false
    c.validate_login_field = false
    c.validate_password_field = false
  end

  before_create :default_values

  def default_values
    begin
      self.url_id = generate_new_url_id
    end while User.pluck(:url_id).include? url_id
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
    checkins = self.checkins
    friends = self.friends
    colors = ['#f62323', '#f6b423', '#57d11b', '#06754a', '#3fc8e4', '#3f7ae4', '#603fe4', '#a73fe4', '#e43fa2', '#8e1e00', '#8e5b00', '#048e00', '#00768e', '#00278e', '#47008e', '#8e006e', '#ff7c7c', '#6ed05c', '#17e1ba', '#91b0e6', '#ecb0fb', '#fbb0b6', '#490c03', '#493c03', '#264903', '#03493a', '#031f49', '#230349', '#490345', '#49031e']

    x.to_i.times do |num|
      offset = num*100
      #TODO - Pretty up url
      options = {:query => {:v => '20130214', :sort => 'newestfirst', :oauth_token => self.atoken, :offset => offset.to_s}}
      response = HTTParty.get("https://api.foursquare.com/v2/users/#{foursquare_id.to_s}/historysearch", options)
      response.parsed_response['response']['checkins']['items'].each do |i|
        if i['overlaps']
          unless checkins.find{|c| c.foursquare_id == i['id']}
            checkin = Checkin.create! do |c|
              c.user_id = self.id
              c.foursquare_id = i['id']
              c.time = i['createdAt'] + i['timeZoneOffset']
              c.shout = i['shout']
              c.venue_id = i['venue']['id']
              c.venue_name = i['venue']['name']
            end
            checkins << checkin
            i['overlaps']['items'].each do |item|
              if friends.find{|f| f.foursquare_id == item['user']['id'].to_s}
                friend = friends.find{|f| f.foursquare_id == item['user']['id'].to_s}
              else
                friend = Friend.create! do |f|
                  color = colors[0]
                  f.color = color
                  colors = colors.drop(1)
                  colors << color
                  f.user_id = self.id
                  f.foursquare_id = item['user']['id'].to_s
                  f.name = item['user']['firstName'] + ' ' + (item['user']['lastName'] || '')
                end
                friends << friend
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


  private

  def generate_new_url_id
    chars = (?a..?z).to_a + (?A..?Z).to_a + (0..9).to_a
    7.times.map { chars.sample }.join
  end

end
