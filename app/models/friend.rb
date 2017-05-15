class Friend < ActiveRecord::Base
  # attr_accessible :title, :body
  belongs_to :user
  has_many :overlaps
  has_many :checkins, through: :overlaps

  before_create :default_values

  def default_values
    begin
      self.url_id = generate_new_url_id
    end while Friend.pluck(:url_id).include? url_id
  end

  def as_json(options)
    super(
      except: [:id, :created_at, :updated_at, :user_id],
      include: {checkins: {only: [:date, :shout, :venue_name], methods: :date }}
    )
  end

  private

  def generate_new_url_id
    chars = (?a..?z).to_a + (?A..?Z).to_a + (0..9).to_a
    7.times.map { chars.sample }.join
  end

end
