class UserSessionsController < ApplicationController

  def new
    if current_user
      redirect_to current_user
    end
  end

  def callback
    user = User.find_or_create(auth_hash)
    UserSession.create(user, true)

    if user.checkins.blank?
      redirect_to '/loading'
    else
      redirect_to user
    end

  end

  def destroy
    if current_user_session
      current_user_session.destroy
    end
    redirect_to '/'
  end

  protected

  def auth_hash
    request.env['omniauth.auth']
  end
end