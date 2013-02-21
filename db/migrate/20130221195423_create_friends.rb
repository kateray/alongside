class CreateFriends < ActiveRecord::Migration
  def change
    create_table :friends do |t|
    	t.integer :user_id
      t.string :foursquare_id
      t.string :url_id
      t.string :name
      t.string :color
      t.timestamps
    end
  end
end
