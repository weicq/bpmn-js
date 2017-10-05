'use strict';

var isArray = require('lodash/lang/isArray'),
    inherits = require('inherits');

var CommandInterceptor = require('diagram-js/lib/command/CommandInterceptor');


/**
 * A behavior that makes sure connections are being layouted
 * on source or target reconnection.
 *
 * @param {EventBus} eventBus
 * @param {Layouter} layouter
 */
function ReconnectionLayoutBehavior(eventBus, layouter) {

  CommandInterceptor.call(this, eventBus);

  function layoutConnection(event) {

    var context = event.context,
        newSource = context.newSource,
        newTarget = context.newTarget,
        connection = context.connection,
        dockingOrPoints = context.dockingOrPoints;

    // don't intercept direct waypoint assignments
    if (isArray(dockingOrPoints)) {
      return;
    }

    // guards copied from ReconnectConnectionHandler to ensure
    // we detect misuse of the reconnection command
    if (!newSource && !newTarget) {
      throw new Error('newSource or newTarget are required');
    }

    if (newSource && newTarget) {
      throw new Error('must specify either newSource or newTarget');
    }

    var newWaypoints;

    if (newSource) {
      newWaypoints = layouter.layoutConnection(connection, {
        connectionStart: getDocking(dockingOrPoints)
      });
    }

    if (newTarget) {
      newWaypoints = layouter.layoutConnection(connection, {
        connectionEnd: getDocking(dockingOrPoints)
      });
    }

    // provide layouted waypoints to handlers next in chain
    context.dockingOrPoints = newWaypoints;
  }


  this.preExecute([
    'connection.reconnectStart',
    'connection.reconnectEnd'
  ], 500, layoutConnection);

}

inherits(ReconnectionLayoutBehavior, CommandInterceptor);

ReconnectionLayoutBehavior.$inject = [
  'eventBus',
  'layouter'
];

module.exports = ReconnectionLayoutBehavior;



////////// helpers ////////////////////////////////

function getDocking(point) {
  return point.original || point;
}