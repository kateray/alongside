class UserSessionsController < ApplicationController

  def new
    if current_user
      redirect_to current_user
    end
  end

  def callback
    user = User.find_or_create(auth_hash)
    UserSession.create(user, true)

    puts '*'*80
    puts user.id
    if UserSession.find
      puts 'yes'
    else
      puts 'no'
    end

    if user.overlaps == nil
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