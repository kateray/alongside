class AddErrorCodesToUsers < ActiveRecord::Migration
  def change
    add_column :users, :last_refreshed_error, :string
  end
end
