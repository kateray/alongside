class ApplicationController < ActionController::Base
  protect_from_forgery
  helper_method :current_user_session, :current_user

  private

  def login_required
    unless current_user
      render 'public/403.html', :status => 403, :layout => false
      return false
    end
  end
  
  def current_user_session
    return @current_user_session if defined?(@current_user_session)
    @current_user_session = UserSession.find
  end

  def current_user
    return @current_user if defined?(@current_user)
    @current_user = current_user_session && current_user_session.user
  end

end
