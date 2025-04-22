
/*
 * EVENTS.JS (PART OF EASYMPV)
 *
 * Author:                  Jong
 * URL:                     https://github.com/JongWasTaken/easympv
 * License:                 MIT License
 */

Events = {};

/**
 * Base event class.
 * Can be used to create new events. Simply create a new event object like this: `var myEvent = new Events.Event(<limit>);`
 * Invoke event listeners by calling `myEvent.invoke(<ARGUMENTS_TO_PASS_ALONG>)`.
 *
 * An event may also be used to cancel execution, as registered callbacks can return a boolean to initiate cancellation.
 * If _any_ callback returns `true`, then `myEvent.invoke()` will also return `true`.
 *
 * @param {number} `limit` Optional: limits the number of possible registrants if given
 */
Events.Event = function (limit) {
    this.registrants = [];
    this.listeners = [];
    this.limit = 0;
    if (limit != undefined) this.limit = limit;
}

/**
 * Registers a listener for this event.
 * @param {string} registrant Name of the listener
 * @param {function} callback Function accepting arguments for this event
 * @returns {boolean} `true` if registration succeeded
 */
Events.Event.prototype.register = function (registrant, callback) {
    if (registrant == null) {
        return false;
    }
    if (callback != null) {
        for (var i = 0; i < this.registrants.length; i++) {
            if (this.registrants[i] == registrant) {
                return false;
            }
        }
        if (this.limit == 0 || this.registrants.length < this.limit) {
            this.registrants.push(registrant);
            this.listeners.push(callback);
            return true;
        }
    }
    return false;
}

/**
 * Registers a listener to this event if called from inside an extension.
 * Throws if called outside.
 */
Events.Event.prototype.$register = function () {
    throw "Event.$register called from outside of extension!";
}

/**
 * Unregisters a listener from this event if called from inside an extension.
 * Throws if called outside.
 */
Events.Event.prototype.$unregister = function () {
    throw "Event.$unregister called from outside of extension!";
}

/**
 * Removes listener and associated callback.
 * Extensions should use `Events.<EVENT_NAME>.$unregister()` instead!
 * @param {string} registrant Name of the listener
 */
Events.Event.prototype.kick = function (registrant) {
    for (var i = 0; i < this.registrants.length; i++) {
        if (this.registrants[i] == registrant) {
            this.registrants.splice(i, 1);
            this.listeners.splice(i, 1);
            return;
        }
    }
}

/**
 * Calls all listeners with provided arguments. If this event is cancellable, this function will return a boolean (`true` -> cancel).
 * @param {*} arguments Any arguments to pass along to listeners
 */
Events.Event.prototype.invoke = function () {
    var baseState = false;
    var tempState = false;
    for (var i = 0; i < this.listeners.length; i++) {
        try {
            tempState = this.listeners[i].apply(null, arguments);
            if (tempState != null) if (tempState) baseState = true;
        } catch (e) {}
    }
    return baseState;
}

/**
 * `Events` contains all easympv events.
 *
 * Register a listener by calling `Events.<EVENT_NAME>.register(<your_identifier_goes_here>, <callback_goes_here>)`.
 * Extensions should use `Events.<EVENT_NAME>.$register(<callback_goes_here>)` instead.
 * Required arguments for the callback can be derived from the documentation of a given event.
 */
Events.README = {};

/**
 * - Called first in `Core.startExecution()`, before any file checks, OS detection, update checks and first time launch check.
 * - Registered callbacks will receive no arguments.
 * - Cannot be cancelled.
 */
Events.earlyInit = new Events.Event();

/**
 * - Called late in `Core.startExecution()`, before menu construction and hotkeys registration.
 * - Registered callbacks will receive no arguments.
 * - Cannot be cancelled.
 */
Events.lateInit = new Events.Event();

/**
 * - Called last in `Core.startExecution()`, everything has finished at this point.
 * - Registered callbacks will receive no arguments.
 * - Cannot be cancelled.
 */
Events.afterInit = new Events.Event();

/**
 * - Called last in `Core.onFileLoad()`, but only if the current file is the first file to be loaded this session.
 * - Registered callbacks will receive 1 argument: `cFile string`, a string containing the full path to the loaded file.
 * - Cannot be cancelled.
 */
Events.onFirstFileLoad = new Events.Event();

/**
 * - Called last in `Core.onFileLoad()`.
 * - Registered callbacks will receive 1 argument: `cFile string`, a string containing the full path to the loaded file.
 * - Cannot be cancelled.
 */
Events.onFileLoad = new Events.Event();

/**
 * - Called before a menu gets instanciated durng easympv initialization.
 * - Registered callbacks will receive 2 arguments: `settings object, items array`.
 * - Cannot be cancelled.
 * - Arguments can be modified, e.g. to add items to the menu.
 */
Events.beforeCreateMenu = new Events.Event();

/**
 * - Called after a menu gets instanciated durng easympv initialization.
 * - Registered callbacks will receive 1 argument: `menu object`.
 * - Cannot be cancelled.
 */
Events.afterCreateMenu = new Events.Event();

/**
 * - Called before `Menus.Menu.prototype.showMenu()`, if no menu is on screen.
 * - Registered callbacks will receive 1 argument: `menu object`.
 * - Can be cancelled.
 */
Events.beforeShowMenu = new Events.Event();

/**
 * - Called after `Menus.Menu.prototype.showMenu()`, if no menu is on screen.
 * - Registered callbacks will receive 1 argument: `menu object`.
 * - Cannot be cancelled.
 */
Events.afterShowMenu = new Events.Event();

/**
 * - Called before `Menus.Menu.prototype.hideMenu()`, if the menu is on screen.
 * - Registered callbacks will receive 1 argument: `menu object`.
 * - Can be cancelled.
 */
Events.beforeHideMenu = new Events.Event();

/**
 * - Called after `Menus.Menu.prototype.hideMenu()`, if the menu is on screen.
 * - Registered callbacks will receive 1 argument: `menu object`.
 * - Cannot be cancelled.
 */
Events.afterHideMenu = new Events.Event();

/**
 * - Called during `Core.doRegistrations()`. Used for registering keybinds and mpv events.
 * - Registered callbacks will receive no arguments.
 * - Cannot be cancelled.
 * - **You should also register a listener for `Events.duringKeyUnregistration` which undoes all your changes!**
 */
Events.duringRegistration = new Events.Event();

/**
 * - Called during `Core.doUnregistrations()`. Used for unregistering keybinds and mpv events.
 * - Registered callbacks will receive no arguments.
 * - Cannot be cancelled.
 */
Events.duringUnregistration = new Events.Event();

/**
 * - Called before opening a file chosen by the user using the browser.
 * - Registered callbacks will receive 2 arguments: `entry object`, `path string`.
 * - Limited to a single listener!
 * - Can be cancelled, to implement support for specific special file extensions.
 */
Events.beforeBrowserFileOpen = new Events.Event(1);