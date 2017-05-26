class UserSessionsController < ApplicationController

  def home
    if current_user
      redirect_to '/u/' + current_user.url_id
    end
  end

  def callback
    user = User.find_or_create(auth_hash)
    UserSession.create(user, true)

    if user.checkins.blank?
      redirect_to '/loading'
    else
      redirect_to '/u/' + user.url_id
    end

  end

  def destroy
    puts '*'*80
    puts current_user_session.to_json
    puts current_user.to_json
    if current_user_session
      puts 'we are here'
      current_user_session.destroy
    end
    redirect_to root_url
  end

  protected

  def auth_hash
    request.env['omniauth.auth']
  end
end
