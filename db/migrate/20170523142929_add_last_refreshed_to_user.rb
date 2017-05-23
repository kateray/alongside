class AddLastRefreshedToUser < ActiveRecord::Migration
  def change
    add_column :users, :last_refreshed, :datetime
  end
end
