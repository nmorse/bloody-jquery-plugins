/*  

    jQuery pub/sub plugin by Peter Higgins (dante@dojotoolkit.org)

    Loosely based on Dojo publish/subscribe API, limited in scope. Rewritten blindly.
    Updated to taste by nmorse: 
       subscribe functions take a single arg
       pub returns an array of the subscribers responses 
       debugging hooks
       subscribe to DOM events, and publish (a request) to a server URL

    Original is (c) Dojo Foundation 2004-2010. Released under either AFL or new BSD, see:
    http://dojofoundation.org/license for more information.

*/  

;(function(d){

    // the topic/subscription hash
    var cache = {};

    d.publish = function(/* String */topic, /* Any */data, options, /* Boolean */ squawk){
        // summary:
        //      Publish some data on a named topic.
        // topic: String
        //      The channel to publish on or a url to request
        // data: Any
        //      The datum to publish. The single
        //      argument (may be a hash of several data arguments) 
        //      passed to the subscribed functions. 
        // squawk: Boolean
        //      A debugging flag that enables alert dialogs.
        //
        // returns: Object
        //      An object that represents the combined results from the subscribers. The object will
        //      be the extended union of all the subscribers returned value.
        //
        // example:
        //      Publish stuff on 'some/topic'. Anything subscribed will be called
        //      with a function signature like: function(arg_obj){ ... }
        //
        //      Publish to the web url '/some/topic'. 
        //
        //  |       ret_val_obj = $.publish("some/topic", {"arg_name":arg_value});
        var results_obj = {};
        if (topic.charAt(0) == '/') {
            return d.publish2web(topic, data, options);
        }
        if (cache[topic]) {
            d.each(cache[topic], function() {
                if(squawk || this.squawk) {alert('pub '+topic+' with '+JSON.stringify(data));}
                results_obj = $.extend(true, results_obj, this.callback.apply(d, [data]) );
            });
        }
        else { alert('no subscribers to topic - '+topic); }
        return results_obj;
    };

    d.publish2web = function(url, data, options) {
        // summary: 
        //      Publish to a web service, some data, and on success, publish a named topic with response data.
        // url: String
        //      URL of the web service.
        // data: Any
        //      The datum to publish. The single
        //      argument (may be an object or array with several data arguments) 
        //      passed to the subscribed functions.
        // options {
        // responseTopic: String
        //      default is the url + '/response'
        //      The channel to publish on when a succesfull response comes back from the web server.
        // dataType: String ["json", "xml"]
        //      default json. 
        // method: String  ["GET", "POST"]
        //      default GET.
        //
        // example:
        //      Publish stuff to '/some/web/service/url/'
        //      $.publish2web("/some/web/service/url/", {"arg_name":arg_value}, "reply/topic", "json", "POST");
        // } /* end of options */
        var defaultRT = url.slice(1)+'/response';
        options = d.extend(true, {"dataType":"json", "method":"GET", "responseTopic":defaultRT}, options);
        if (options.dataType == "json") {
            data = {"json_str":JSON.stringify(data)};
        }
        $.ajax({
          "url": url,
          "dataType": options.dataType,
          "data": data,
          "type": options.method,
           "error": function(XMLHttpRequest, textStatus, errorThrown) {
            var e = errorThrown||''; 
            console.log("an error was reported after a request to "+url+" :: "+XMLHttpRequest.statusText+" :: "+textStatus+" :: "+JSON.stringify(e, null, " "));
            //alert("an error was reported after a request to "+url+" :: "+XMLHttpRequest.statusText+" :: "+textStatus+" :: "+JSON.stringify(e, null, " "));
          },
          "success": function(resp) {$.publish(options.responseTopic, resp);}
        });
    };

    d.subscribe = function(/* String */topic, /* Function */callback, /* Boolean */ squawk){
        // summary:
        //      Register a callback on a named topic.
        // topic: String
        //      The channel to subscribe to
        // callback: Function
        //      The handler event. Anytime something is $.publish'ed on a 
        //      subscribed channel, the callback will be called with the
        //      published array as ordered arguments.
        // squawk: Boolean
        //      A debugging flag that enables alert dialogs.
        //
        // returns: Array
        //      A handle which can be used to unsubscribe this particular subscription.
        //  
        // example:
        //  |   $.subscribe("some/topic", function(arg_obj){ /* handle arg_obj.data */ });
        //  |   $.subscribe("#tag_id[.class]/click", function(arg_obj){ /* handle click arg_obj.data */ });
        //
        var parts = topic.split('/');
        if(parts[0].charAt(0) == '.' || parts[0].charAt(0) == '#') {
            return $(parts[0]).unbind().bind(parts[1], callback);
        }
        if(!cache[topic]){
            cache[topic] = [];
        }
        cache[topic].push({"callback":callback, "squawk":squawk});
        return [topic, callback]; // Array
    };

    d.unsubscribe = function(/* Array */handle){
        // summary:
        //      Disconnect a subscribed function for a topic.
        // handle: Array
        //      The return value from a $.subscribe call.
        // example:
        //  |   var handle = $.subscribe("/something", function(){});
        //  |   $.unsubscribe(handle);
        
        var t = handle[0];
        cache[t] && d.each(cache[t], function(idx){
            if(this.callback == handle[1]){
                cache[t].splice(idx, 1);
            }
        });
    };

})(jQuery);
