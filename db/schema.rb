# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20170524154726) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "checkins", force: :cascade do |t|
    t.integer  "user_id"
    t.string   "venue_name",    limit: 255
    t.string   "venue_id",      limit: 255
    t.string   "shout",         limit: 255
    t.integer  "time"
    t.string   "foursquare_id", limit: 255
    t.datetime "created_at",                null: false
    t.datetime "updated_at",                null: false
  end

  create_table "friends", force: :cascade do |t|
    t.integer  "user_id"
    t.string   "foursquare_id", limit: 255
    t.string   "url_id",        limit: 255
    t.string   "name",          limit: 255
    t.string   "color",         limit: 255
    t.datetime "created_at",                null: false
    t.datetime "updated_at",                null: false
  end

  create_table "overlaps", force: :cascade do |t|
    t.integer  "checkin_id"
    t.integer  "friend_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "user_sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.integer  "foursquare_id"
    t.string   "atoken",               limit: 255
    t.integer  "login_count"
    t.datetime "last_request_at"
    t.datetime "current_login_at"
    t.string   "current_login_ip",     limit: 255
    t.string   "persistence_token",    limit: 255
    t.boolean  "secret",                           default: false
    t.datetime "created_at",                                       null: false
    t.datetime "updated_at",                                       null: false
    t.boolean  "god",                              default: false
    t.string   "url_id",               limit: 255
    t.datetime "last_refreshed"
    t.string   "last_refreshed_error"
  end

end
