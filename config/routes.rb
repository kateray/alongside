Alongside::Application.routes.draw do
  resources :users, :path => "u"
  match '/f/:friend_id' => 'users#friends'
  resources :user_sessions
  match '/auth/:provider/callback', to: 'user_sessions#callback'
  match '/logout', to: 'user_sessions#destroy'
  match '/users/privacy', to: 'users#update'
  match '/loading', to: 'users#loading'
  match '/overlaps', to: 'users#get_overlaps'
  root :to => "user_sessions#new"
end