class ApplicationController < ActionController::Base
  protect_from_forgery
  helper_method :current_user_session, :current_user
  before_filter :add_www_subdomain


  def login_required
    unless current_user
      render file: "#{Rails.root}/public/403.html", layout: false, status: 403
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

  private
  def add_www_subdomain
    if Rails.env.production?
      unless /^www/.match(request.host)
        redirect_to("#{request.protocol}www.#{request.host_with_port}#{request.fullpath}",status: 301)
      end
    end
  end

end
