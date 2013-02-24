class UsersController < ApplicationController

  before_filter(only: :show) do |controller|
    controller.send(:redirect_from_show, params[:id])
  end

  before_filter :login_required, except: [:show, :friends]

  # caches_action [:show, :friends], :layout => false

  def loading
  end

  def get_overlaps
    current_user.get_overlaps(params[:x])

    render :json => {url: '/u/' + current_user.id.to_s}

  end

  def show
    top = @user.checkins.first.time
    length = @user.checkins.last.time - top

    @initData = {}
    @initData['top'] = top
    @initData['full_length'] = length
    @initData['lines'] = @user.friends.includes(:checkins).order('checkins.time ASC')
    @initData['points'] = @user.checkins.includes(:friends)
    @initData['secret'] = @user.secret
    @initData['single'] = false
    @initData['user_id'] = @user.id
    @initData['action'] = 'show'
    @initData = @initData.to_json

  end

  def friends
    @friend = Friend.includes(:checkins).find_by_url_id(params[:friend_id])
    @user = @friend.user

    top = @friend.checkins.order('time ASC').first.time
    length = @friend.checkins.order('time ASC').last.time - top

    @initData = {}
    @initData['top'] = top
    @initData['full_length'] = length
    @initData['lines'] = [@friend]
    @initData['points'] = @friend.checkins.includes(:friends)
    @initData['secret'] = @user.secret
    @initData['single'] = @friend.url_id
    @initData['user_id'] = @user.id
    @initData['action'] = 'friends'
    @initData = @initData.to_json

    render :action => 'show'

  end

  def update
    @user = current_user

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
    if @user = User.find_by_id(id)
      unless @user.secret == false || current_user == @user
        render 'public/404.html', :status => 404, :layout => false
      end
    else
      render 'public/404.html', :status => 404, :layout => false
    end
  end

end