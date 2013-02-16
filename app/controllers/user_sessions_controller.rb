class UserSessionsController < ApplicationController

  def create
    @user = User.find_or_create(auth_hash)

    redirect_to @user

  end

  def new
  end

  protected

  def auth_hash
    request.env['omniauth.auth']
  end
end