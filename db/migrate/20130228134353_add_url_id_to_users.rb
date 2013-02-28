class AddUrlIdToUsers < ActiveRecord::Migration
  def self.up
    add_column :users, :url_id, :string
    change_column_default :users, :secret, false
    remove_column :users, :overlaps
  end

  def self.down
    remove_column :users, :url_id
    change_column_default :users, :secret, true
    add_column :users, :overlaps, :string
  end
end
