class Checkin < ActiveRecord::Base
  # attr_accessible :title, :body
  belongs_to :user
  has_many :overlaps
  has_many :friends, through: :overlaps

  def as_json(options)
    super(
      :except => [:id, :created_at, :updated_at, :user_id],
      :include => {:friends => {:only => [:name, :url_id]}}
    )
  end
end
