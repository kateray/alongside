class UsersController < ApplicationController

  before_filter(only: :show) do |controller|
    controller.send(:redirect_from_show, params[:id])
  end

  before_filter :login_required, only: :update

  def loading
  end

  def get_overlaps
    current_user.get_overlaps()

    render :json => {url: '/users/' + current_user.id.to_s}

  end

  def show
    colors = ['#f62323', '#f6b423', '#57d11b', '#06754a', '#3fc8e4', '#3f7ae4', '#603fe4', '#a73fe4', '#e43fa2', '#8e1e00', '#8e5b00', '#048e00', '#00768e', '#00278e', '#47008e', '#8e006e', '#ff7c7c', '#b0fbb4', '#b0fbf8', '#b0c4fb', '#ecb0fb', '#fbb0b6', '#490c03', '#493c03', '#264903', '#03493a', '#031f49', '#230349', '#490345', '#49031e']
    
    times = []
    lines = []
    points = []

    JSON.parse(@user.overlaps).each do |checkin|
      time = checkin['created_at']
      times << time

      #set up lines
      checkin['friends'].each do |f|
        if line = lines.find{|x| x['id'] == f['user_id']}
          line['time'] << time
          line['time'] = line['time'].sort
        else
          line = {}
          line['id'] = f['user_id']
          line['name'] = f['user_name']
          color = colors[0]
          colors = colors.drop(1)
          colors << color
          line['color'] = color          
          line['time'] = [time]
          lines << line
        end
      end

      #set up points
      point = {}
      point['time'] = time
      point['venue_name'] = checkin['venue_name']
      point['shout'] = checkin['shout']
      points << point

    end

    @initData = {}
    @initData['zoom'] = 1000
    @initData['top'] = times.min
    @initData['length'] = times.max - times.min
    @initData['lines'] = lines
    @initData['points'] = points
    @initData['secret'] = @user.secret
    @initData = @initData.to_json

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