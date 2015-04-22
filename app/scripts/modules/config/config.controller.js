'use strict';


angular
  .module('deckApp.config.controller', [
    'deckApp.applications.write.service',
    'deckApp.confirmationModal.service',
    'deckApp.caches.initializer',
    'deckApp.caches.infrastructure'
  ])
  .controller('ConfigController', function ($modal, $state, $log, applicationWriter, confirmationModalService,
                                            cacheInitializer, infrastructureCaches, application, notificationService) {
    var vm = this;
    vm.serverGroupCount = application.serverGroups.length;
    vm.hasServerGroups = Boolean(vm.serverGroupCount);
    vm.error = '';

    notificationService.getNotificationsForApplication(application.name).then(function (notifications) {
      vm.notifications = _.filter(_.flatten(_.map(['email', 'sms', 'hipchat'],
        function (type) {
          if (notifications[type]) {
            return _.map(notifications[type], function (entry) {
                return _.extend(entry, {type: type});
              }
            );
          }
        }
      )), function (allow) {
        return allow !== undefined;
      });
    });

    vm.editApplication = function () {
      $modal.open({
        templateUrl: 'scripts/modules/config/modal/editApplication.html',
        controller: 'EditApplicationController',
        controllerAs: 'editApp',
        resolve: {
          application: function () {
            return application;
          }
        }
      });
    };

    vm.deleteApplication = function () {

      var submitMethod = function () {
        return applicationWriter.deleteApplication(application.attributes);
      };

      var taskMonitor = {
        application: application,
        title: 'Deleting ' + application.name,
        hasKatoTask: false,
        onTaskComplete: function () {
          $state.go('home.applications');
        }
      };

      confirmationModalService.confirm({
        header: 'Really delete ' + application.name + '?',
        buttonText: 'Delete ' + application.name,
        destructive: true,
        provider: 'aws',
        taskMonitorConfig: taskMonitor,
        submitMethod: submitMethod
      });
    };

    vm.refreshCaches = function () {
      vm.clearingCaches = true;
      cacheInitializer.refreshCaches().then(
        function () {
          vm.clearingCaches = false;
        },
        function (e) {
          $log.error('Error refreshing caches:', e);
          vm.clearingCaches = false;
        });
    };

    vm.getCacheInfo = function (cache) {
      return infrastructureCaches[cache].getStats();
    };

    vm.refreshCache = function (key) {
      vm.clearingCache = vm.clearingCache || {};
      vm.clearingCache[key] = true;
      cacheInitializer.refreshCache(key).then(
        function () {
          vm.clearingCache[key] = false;
        },
        function (e) {
          $log.error('Error refreshing caches:', e);
          vm.clearingCaches = false;
        }
      );
    };

    vm.removeNotification = function (notification) {
      vm.notifications = vm.notifications.filter(function (el) {
          return el !== notification;
        }
      );
      vm.updateNotifications();
    };

    vm.editNotification = function (notification) {
      $modal.open({
        templateUrl: 'scripts/modules/config/modal/editNotification.html',
        controller: 'EditNotificationController',
        controllerAs: 'editNotification',
        resolve: {
          notification: function () {
            return notification;
          }
        }
      });
    };

    vm.addNotification = function(){
      vm.editNotification([]);
    };

    vm.updateNotifications = function(){

    };

    return vm;

  });
