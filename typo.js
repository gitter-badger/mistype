// Written by Marinin Tim, licensed under MIT license.


;(function(window, encodulator, noty, Mistype, config){

  // Simply make request
  var requster = function(opts) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function(){
      if (req.readyState === 4 && typeof opts.callback === 'function') {
        opts.callback(req.responseText);
      }
    };
    req.open(opts.method || 'get', opts.url, true);
    req.send(opts.data);
  }

  // encode json obj to formdata
  var encodulator = function(opts) {
    var memo = new FormData()
    memo.append('owner', config.owner || 'none')
    for (var key in opts) {
      if (opts[key] != null) memo.append(key, opts[key])
    }
    return memo;
  }

  // Simple notification
  var noty = function(e){
      var noty = document.createElement('div');
      noty.classList.add('mistype-notification')
      noty.innerHTML = config.text || 'Mistype was sended to our editors, thanks for your attentiveness';
      document.body.appendChild(noty)

      setTimeout(function(){
        noty.classList.add('in-action');
        setTimeout(function(){
          noty.classList.remove('in-action')
          setTimeout(noty.parentNode.removeChild.bind(noty.parentNode, noty), config.timeoutRemove || 3000);
        }, config.timeoutHide || 3000)
      }, config.timeoutShow || 100)
    }

  var Mistype = function() {
    for (var key in config.listeners) {
      window.addEventListener(key, config.listeners[key].bind(this))
    }
  }

  Mistype.prototype.get = function() {
    var selection = window.getSelection()

    if (selection.anchorNode !== null && selection.toString() !== '') {
      return {
        text: selection.toString(),
        classes: Array.prototype.slice.call(selection.anchorNode.parentElement.classList, 0),
        tag: selection.anchorNode.parentNode.tagName,
        url: window.location.href,
        additional: typeof window[config.additional] === 'function' ? window[config.additional]() : config.additional
      }
    } else {
      return null;
    }
  }  

  Mistype.prototype.send = function(data, callback) {
    requster({
      method: 'POST',
      url: config.endpoint,
      data: encodulator(data),
      callback: callback
    })
  }

  var me = document.querySelector('script[data-typo]').dataset
  var config = {}

  for (var key in me) {
    if (me.hasOwnProperty(key)) config[key] = me[key]
  }

  if(!config.endpoint) {
    config.endpoint = '//www.mistype.co/oh'
  }

  if(!config.listeners) {
    config.listeners = {
      keyup: function(e) {
        if(e.target === document.body && e.which == 13 && e.ctrlKey) {
          var text = this.get()
          if (text !== null) {
            this.send(text, noty)
          }
        }
      }
    }
  }

  if (!config.nocss) {
    requster({
      url: '//www.mistype.co/css', 
      callback: function(response) {
        var styleEl = document.createElement('style')
        styleEl.innerHTML = response
        document.body.appendChild(styleEl)
      }
    })
  }

  return window.mistype = new Mistype();
  
})(window)