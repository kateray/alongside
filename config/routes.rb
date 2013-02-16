Alongside::Application.routes.draw do
  resources :users
  resources :user_sessions
  match '/auth/:provider/callback', to: 'user_sessions#create'
  match '/map' => 'users#map'
  root :to => "user_sessions#new"
end
