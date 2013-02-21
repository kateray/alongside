class Overlap < ActiveRecord::Base
  # attr_accessible :title, :body
  belongs_to :friend
  belongs_to :checkin
end
