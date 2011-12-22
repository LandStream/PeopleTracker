#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import os

import datetime
from django.utils import simplejson
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import util
from google.appengine.api import users
import logging

class Greeting(db.Model):
  author = db.UserProperty()
  content = db.StringProperty(multiline=True)
  date = db.DateTimeProperty(auto_now_add=True)


class Location(db.Model):
    user    = db.UserProperty()
    latLong = db.GeoPtProperty()
    dateTime = db.DateTimeProperty(auto_now_add=True)
    def to_dict(self):
        return dict([(p, unicode(getattr(self, p))) for p in self.properties()])
    
class User(db.Model):
    user = db.UserProperty()
    firstName = db.StringProperty()
    lastName  = db.StringProperty()
    admin = db.BooleanProperty(default=False)
    superUser = db.BooleanProperty(default=False)
    


class LoginHandler(webapp.RequestHandler):
    def get(self):
        user = users.get_current_user()
        if user:
            greeting = ("Welcome, %s! (<a href=\"%s\">sign out</a>)" %
                        (user.nickname(), users.create_logout_url("/")))
        else:
            greeting = ("<a href=\"%s\">Sign in or register</a>." %
                        users.create_login_url("/"))

        self.response.out.write("<html><body>%s</body></html>" % greeting)
    

class MainPage(webapp.RequestHandler):
  def get(self):
      
      user = users.get_current_user()
      if not user:
          greeting = ("<a href=\"%s\">Sign in or register</a>." % users.create_login_url("/"))
          self.response.out.write("<html><body>%s</body></html>" % greeting)
          
          
      else:
         greeting = ("Welcome, %s! (<a href=\"%s\">sign out</a>)" %
                    (user.nickname(), users.create_logout_url("/")))
      
         self.response.out.write("<html><body>%s</body></html>" % greeting)
      
         f = open( 'PeopleTracker.htm' )
         self.response.out.write( f.read() )
      
      

    

class RPCHandler(webapp.RequestHandler):
    """ Allows the functions defined in the RPCMethods class to be RPCed."""
    def __init__(self):
        webapp.RequestHandler.__init__(self)
        self.methods = RPCMethods()

    def get(self):
        func = None

        action = self.request.get('action')
        if action:
            if action[0] == '_':
                self.error(403) # access denied
                return
            else:
                func = getattr(self.methods, action, None)

        if not func:
            self.error(404) # file not found
            return

        args = ()
        while True:
            key = 'arg%d' % len(args)
            val = self.request.get(key)
            if val:
                args += (simplejson.loads(val),)
            else:
                break
        result = func(*args)
        self.response.out.write(simplejson.dumps(result))

    
class RPCMethods:
    """ Defines the methods that can be RPCed.
    NOTE: Do not allow remote callers access to private/protected "_*" methods.
    """

    def SetLocation(self, *args):
        
       
        s = str( args[0]['Na'] ) + ', ' + str( args[0]['Oa'] )
        
        if len(args) >= 2:
            user = args[1]['user']
        else:
            user = users.get_current_user().nickname()
        
        location = Location.get_by_key_name( user )
        
        if location:
            location.latLong=s
            location.dateTime = datetime.datetime.now()
        else:  
            user=users.get_current_user()
            location = Location( latLong=s, user=user, key_name=user.nickname() ) 
            
        location.put()
        
    def GetAllMarkers(self, *args):
        
        markers = db.GqlQuery("SELECT * FROM Location") 
        markers = [marker.to_dict() for marker in markers]
        return markers
    
    def GetMarkerInfo(self, *args ):
        
        location = Location.get_by_key_name( args[0] )
                
        if location:            
            return location.to_dict()
            
                    
    def GetCurrentUser(self, *args ):
        
        return users.get_current_user()
        
def main():
    app = webapp.WSGIApplication([
        ('/', MainPage),
        ('/rpc', RPCHandler),
        ('/login', LoginHandler ),
        ], debug=True)
    util.run_wsgi_app(app)

if __name__ == '__main__':
    main()
