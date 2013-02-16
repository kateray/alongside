Rails.application.config.middleware.use OmniAuth::Builder do
	#TODO Make environment variables
  provider :foursquare, '020IZEEQUQIGRHMFCXPLDHTTIXUWV40JUC1TMU32ZF14VY3C', 'BHDPKO2LWG22Y4DTWXL0A1NWHQNBN2XUAKK5DSYHZEWNZO35'
end