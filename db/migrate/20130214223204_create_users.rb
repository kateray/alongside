class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.integer  :foursquare_id
      t.string   :atoken
    	t.integer  :login_count
      t.datetime :last_request_at
      t.datetime :current_login_at
      t.string   :current_login_ip
      t.timestamps
    end
  end
end
