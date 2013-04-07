/**
  Write me...
 
  @class AnimatedContainerView
  @namespace Ember
  @extends Ember.ContainerView
*/
Ember.AnimatedContainerView = Ember.ContainerView.extend({

    classNames: ['ember-animated-container'],
    
    init: function() {
        this._super();
        //Register this view, so queued effects can be related with this view by name
        Ember.AnimatedContainerView._views[this.get('name')] = this;
    },
    
    willDestroy: function() {
        this._super();
        //Clean up
        var name = this.get('name');
        delete Ember.AnimatedContainerView._views[name];
        delete Ember.AnimatedContainerView._animationQueue[name];
    },
    
    //Override parent method
    _currentViewWillChange: Ember.beforeObserver(function() {
        var currentView = Ember.get(this, 'currentView');
        if (currentView) {
            //Store the old `currentView` (and don't destroy it yet) so we can use it for animation later
            this.set('oldView', currentView);
        }
    }, 'currentView'),

    _currentViewDidChange: Ember.observer(function() {
        var self = this,
            newView = Ember.get(this, 'currentView'),
            oldView = Ember.get(this, 'oldView'),
            name = this.get('name');
        if (newView) {
            this.pushObject(newView);
            //Only animate if there is both a new view and an old view
            if (oldView) {
                Ember.assert('Ember.AnimatedContainerView can only animate non-virtual views. You need to explicitly define your view class.', !oldView.isVirtual);
                Ember.assert('Ember.AnimatedContainerView can only animate non-virtual views. You need to explicitly define your view class.', !newView.isVirtual);
                //Get and validate a potentially queued effect
                var effect = Ember.AnimatedContainerView._animationQueue[name];
                if (effect && !Ember.AnimatedContainerView._effects[effect]) {
                    Ember.warn('Unknown animation effect: '+effect);
                    effect = null;
                }
                if (effect) {
                    //If an effect is queued, then start the effect when the new view has been inserted
                    delete Ember.AnimatedContainerView._animationQueue[name];
                    newView.on('didInsertElement', function() {
                        Ember.AnimatedContainerView._effects[effect](self, newView, oldView);
                    });
                } else {
                    //If there is no effect queued, then just remove the old view (as would normally happen in a ContainerView)
                    this.removeObject(oldView);
                    oldView.destroy();
                }
                //Forget about the old view
                this.set('oldView', null);
            }
        }
    }, 'currentView'),

    enqueueAnimation: function(effect) {
        Ember.AnimatedContainerView._animationQueue[this.get('name')] = effect;
    }

});

Ember.AnimatedContainerView.reopenClass({
    
    /**
      All animated outlets registers itself in this hash
       
      @private
      @property {Object} _views
    */
    _views: {},

    /**
      Whenever an animated route transition is set in motion, it will be stored here, so the animated outlet view can pick it up

      @private
      @property {Object} _animationQueue
    */
    _animationQueue: {},

    /**
      Enqueue effects to be executed by the given outlets when the next route transition happens.
      
      @param {Object} animations A hash with keys corresponding to outlet views and values with the desired animation effect.
    */
    enqueueAnimations: function(animations) {
        for (var name in animations) {
            if (!animations.hasOwnProperty(name)) continue;
            this._animationQueue[name] = animations[name];
        }
    },

    /**
      All animation effects are stored on this object and can be referred to by its key

      @private
      @property {Object} effects
    */
    _effects: {},


    /**
      Register a new effect.
     
      The `callback` function will be passed the following parameters:
     
      - The `Ember.AnimatedContainerView` instance.
      - The new view.
      - The old view.

      @param {String} effect The name of the effect, e.g. 'slideLeft'
      @param {Function} callback The function to call when effect has to be executed
    */
    registerEffect: function(effect, callback) {
        this._effects[effect] = callback;
    }

});
/**
  Write me...

  Straight-up stolen from `Handlebars.registerHelper('outlet', ...);`

  @method outlet
  @for Ember.Handlebars.helpers
  @param {String} property the property on the controller that holds the view for this outlet
*/
Handlebars.registerHelper('animatedOutlet', function(property, options) {
    var outletSource;

    if (property && property.data && property.data.isRenderData) {
        options = property;
        property = 'main';
    }

    outletSource = options.data.view;
    while (!(outletSource.get('template.isTop'))){
        outletSource = outletSource.get('_parentView');
    }

    options.data.view.set('outletSource', outletSource);
    options.hash.currentViewBinding = '_view.outletSource._outlets.' + property;

    //Only this line has been changed
    return Ember.Handlebars.helpers.view.call(this, Ember.AnimatedContainerView, options);
});

Ember.Route.reopen({

    /**
      Works as {@link Ember.Route.transitionTo}} except that it takes a third parameter, `animations`,
      which will enqueue animations.

      `animations` should be an object with outlet names as keys and effect names as value.

      @param name
      @param animations {Object} Animations to enqueue
      @param model
    */
    transitionToAnimated: function(name, animations, model) {
        Ember.AnimatedContainerView.enqueueAnimations(animations);
        Array.prototype.splice.call(arguments, 1, 1);
        return this.transitionTo.apply(this, arguments);
    },

    /**
      Works as {@link Ember.Route.replaceWith}} except that it takes a third parameter, `animations`,
      which will enqueue animations.

      `animations` should be an object with outlet names as keys and effect names as value.

      @param name
      @param animations {Object} Animations to enqueue
      @param model
    */
    replaceWithAnimated: function(name, animations, model) {
        Ember.AnimatedContainerView.enqueueAnimations(animations);
        Array.prototype.splice.call(arguments, 1, 1);
        return this.replaceWith.apply(this, arguments);
    }

});
Ember.ControllerMixin.reopen({

    /**
      Works as {@link Ember.ControllerMixin.transitionToRoute}} except that it takes a third parameter, `animations`,
      which will enqueue animations.
     
      `animations` should be an object with outlet names as keys and effect names as value.
     
      @param name
      @param animations {Object} Animations to enqueue
      @param model
    */
    transitionToRouteAnimated: function(name, animations, model) {
        Ember.AnimatedContainerView.enqueueAnimations(animations);
        Array.prototype.splice.call(arguments, 1, 1);
        return this.transitionToRoute.apply(this, arguments);
    },

    /**
      Works as {@link Ember.ControllerMixin.replaceRoute}} except that it takes a third parameter, `animations`,
      which will enqueue animations.

      `animations` should be an object with outlet names as keys and effect names as value.

      @param name
      @param animations {Object} Animations to enqueue
      @param model
    */
    replaceRouteAnimated: function(name, animations, model) {
        Ember.AnimatedContainerView.enqueueAnimations(animations);
        Array.prototype.splice.call(arguments, 1, 1);
        return this.replaceRoute.apply(this, arguments);
    }

});
Ember.AnimatedContainerView.registerEffect('fade', function(outlet, newView, oldView) {
    var outletEl = outlet.$(),
        newEl = newView.$(),
        oldEl = oldView.$();
    newEl.css({zIndex: 1});
    oldEl.css({zIndex: 2});
    oldEl.stop().animate({
        opacity: 0
    }, function() {
        outletEl.removeClass('ember-animated-container-fade-outlet');
        newEl.removeClass('ember-animated-container-fade-view-new');
        outlet.removeObject(oldView);
        oldView.destroy();
    });
});
Ember.AnimatedContainerView.registerEffect('flip', function(outlet, newView, oldView) {
    var outletEl = outlet.$(),
        newEl = newView.$(),
        oldEl = oldView.$();
    outletEl.wrap('<div class="ember-animated-container-flip-wrap"></div>')
    outletEl.addClass('ember-animated-container-flip-outlet');
    newEl.addClass('ember-animated-container-flip-back');
    oldEl.addClass('ember-animated-container-flip-front');
    setTimeout(function() {
        outletEl.addClass('ember-animated-container-flip-outlet-flipped');
        outletEl.one('transitionend MSTransitionEnd webkitTransitionEnd oTransitionEnd', function() {
            outletEl.unwrap();
            outletEl.removeClass('ember-animated-container-flip-outlet-flipped');
            outletEl.removeClass('ember-animated-container-flip-outlet');
            newEl.removeClass('ember-animated-container-flip-back');
            outlet.removeObject(oldView);
            oldView.destroy();
        });
    }, 0);
});
(function() {
    
var slide = function(outlet, newView, oldView, direction) {
    var outletEl = outlet.$(),
        outletWidth = outletEl.outerWidth(),
        outletOriginalLeft = outletEl.css('left'),
        newEl = newView.$(),
        newElOriginalLeft = newEl.css('left'),
        animateLeft;
    if (direction == 'left') {
        newEl.css('left', outletWidth+'px');
        animateLeft = -outletWidth;
    } else {
        newEl.css('left', (-outletWidth)+'px');
        animateLeft = outletWidth;
    }
    outletEl.stop().animate({
        left: animateLeft
    }, function() {
        outletEl.css('left', outletOriginalLeft);
        newEl.css('left', newElOriginalLeft);
        outlet.removeObject(oldView);
        oldView.destroy();
    });
};
    
Ember.AnimatedContainerView.registerEffect('slideLeft', function(outlet, newView, oldView) {
    slide(outlet, newView, oldView, 'left');
});

Ember.AnimatedContainerView.registerEffect('slideRight', function(outlet, newView, oldView) {
    slide(outlet, newView, oldView, 'right');
});

})();