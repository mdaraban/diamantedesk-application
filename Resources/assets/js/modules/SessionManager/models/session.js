define([
  'app',
  'User/models/user',
  '../common/wsse'], function(App, User, Wsse) {

  return App.module('SessionManager', function(SessionManager, App, Backbone, Marionette, $, _){

    var username = 'admin';
    var password = '5c76179545225078a3ba580dff644b0113faf9dc';


    SessionManager.SessionModel = Backbone.Model.extend({

      initialize: function () {
        var savedData = window.localStorage.getItem('authModel') || window.sessionStorage.getItem('authModel');
        if(savedData){
          this.set(JSON.parse(savedData));
        }
        this.addHeaders();
        $.ajaxSetup({
          statusCode: {
            401: function () {
              if(App.getCurrentRoute() !== 'login'){
                this.logout();
                App.alert({ title: "Authorization Required", messages: ["this action require authorization"] });
                App.trigger('session:login');
              }
            }.bind(this)
          }
        });
      },

      addHeaders: function(){
        $.ajaxPrefilter( function( options, originalOptions, jqXHR ) {
          if(this.get('username') && this.get('password')){
            jqXHR.setRequestHeader('Authorization', 'WSSE profile="UsernameToken"');
            jqXHR.setRequestHeader('X-WSSE', Wsse.getUsernameToken(this.get('username'), this.get('password')));
          }
        }.bind(this));
      },

      login: function(creds) {
        this.set(creds);
        this.getAuth().done(function(){
          this.set({ logged_in: true });
          this.trigger('login:success');
          if(creds.remember){
            window.localStorage.setItem('authModel', JSON.stringify(this));
          } else {
            window.sessionStorage.setItem('authModel', JSON.stringify(this));
          }
          App.trigger('session:login:success');
        }.bind(this)).fail(function(){
          this.trigger('login:fail');
          this.clear();
          this.set({ logged_in: false });
          App.trigger('session:login:fail');
          App.alert({ title: "Authorization Failed", messages: ["Username or password is wrong"] });
        }.bind(this));

      },

      logout: function() {
        this.clear();
        this.set({ logged_in: false });
        window.localStorage.removeItem('authModel');
        window.sessionStorage.removeItem('authModel');
        App.trigger('session:logout:success');
      },

      getAuth: function() {
        var defer = $.Deferred();
        if(this.get('username') && this.get('password')){
          return App.request('user:model:current');
        } else {
          defer.reject();
        }
        return defer.promise();
      }

    });



  });

});