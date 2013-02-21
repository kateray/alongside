class CreateCheckins < ActiveRecord::Migration
  def change
    create_table :checkins do |t|
      t.integer :user_id
      t.string :venue_name
      t.string :venue_id
      t.string :shout
      t.integer :time
      t.string :foursquare_id
      t.timestamps
    end
  end
end
