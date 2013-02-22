class Checkin < ActiveRecord::Base
  default_scope :order => "time ASC"

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
