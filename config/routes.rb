Alongside::Application.routes.draw do
  resources :users
  resources :user_sessions
  match '/auth/:provider/callback', to: 'user_sessions#callback'
  match '/logout', to: 'user_sessions#destroy'
  match '/users/privacy', to: 'users#update'
  match '/loading', to: 'users#loading'
  match '/overlaps', to: 'users#get_overlaps'
  root :to => "user_sessions#new"
end
