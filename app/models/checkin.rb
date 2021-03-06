class Checkin < ActiveRecord::Base
  default_scope { order(:time) }

  belongs_to :user
  has_many :overlaps
  has_many :friends, through: :overlaps

  def date
    return self.time*1000
  end

  def as_json(options)
    super(
      :except => [:id, :created_at, :updated_at, :user_id],
      :include => {:friends => {:only => [:name, :url_id]}}
    )
  end
end
