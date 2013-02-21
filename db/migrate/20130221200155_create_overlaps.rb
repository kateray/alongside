class CreateOverlaps < ActiveRecord::Migration
  def change
    create_table :overlaps do |t|
    	t.integer :checkin_id
      t.integer :friend_id
      t.timestamps
    end
  end
end
