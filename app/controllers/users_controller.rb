class UsersController < ApplicationController

  before_filter(only: :show) do |controller|
    controller.send(:redirect_from_show, params[:id])
  end

  before_filter :login_required, except: [:show, :friends]

  caches_action [:show, :friends], :layout => false

  def loading
  end

  def get_overlaps
    current_user.get_overlaps(params[:x])

    if current_user.checkins.blank?
      render :json => {url: '/loser'}
    else
      render :json => {url: '/u/' + current_user.url_id.to_s}
    end

  end

  def show
    top = @user.checkins.first.time
    length = @user.checkins.last.time - top

    @tweet_url = "https://twitter.com/share?text=My+@foursquare+checkins+visualized+since+"+Time.at(top).strftime("%b+%Y")

    @initData = {}
    @initData['top'] = top*1000
    @initData['full_length'] = length*1000
    @initData['lines'] = @user.friends.includes(:checkins).order('checkins.time ASC')
    # @initData['points'] = @user.checkins.includes(:friends)
    @initData['secret'] = @user.secret
    @initData['tweet_url'] = @tweet_url
    @initData['single'] = false
    @initData['user_id'] = @user.url_id
    @initData['current_user'] = current_user ? current_user.url_id : false
    @initData['action'] = 'show'
    @initData = @initData.to_json

  end

  def friends
    @friend = Friend.includes(:checkins).order('checkins.time ASC').find_by_url_id(params[:friend_id])
    @user = @friend.user

    top = @friend.checkins.order('time ASC').first.time
    length = @friend.checkins.order('time ASC').last.time - top

    @initData = {}
    @initData['top'] = top*1000
    @initData['full_length'] = length*1000
    @initData['lines'] = [@friend]
    # @initData['points'] = @friend.checkins.includes(:friends)
    @initData['secret'] = @user.secret
    @initData['single'] = @friend.url_id
    @initData['user_id'] = @user.url_id
    @initData['current_user'] = current_user ? current_user.url_id : false
    @initData['action'] = 'friends'
    @initData = @initData.to_json

    render :action => 'show'

  end

  def loser
  end

  def update
    @user = current_user
    puts '*'*80
    puts params
    if @user.update_attributes(params[:user])
      if @user.secret
        @message = 'Page is private'
      else
        @message = 'This page is now public. Share it!'
      end
      render :text => @message
    else
      render :text => @user.errors.full_messages.join(", "), :status => :unprocessable_entity
    end
  end

  private

  def redirect_from_show(id)
    if @user = User.find_by_url_id(id)

      if @user.secret == true
        unless current_user && (current_user == @user || current_user.god == true)
          render 'public/404.html', :status => 404, :layout => false
        end
      end

      if @user.checkins.blank?
        if current_user && current_user == @user
          redirect_to '/loading'
        else
          render 'public/404.html', :status => 404, :layout => false
        end
      end

    else
      render 'public/404.html', :status => 404, :layout => false
    end
  end

end
