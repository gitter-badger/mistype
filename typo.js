// Written by Marinin Tim, licensed under MIT license.


;(function(window){
  // return
  var encodulator = function(opts) {
    var memo = '?id=' + (encodeURIComponent(config.id) || 'none') + '&'
    for (var key in opts) {
      memo += encodeURIComponent(key) + '=' + encodeURIComponent(opts[key]) + '&'
    }
    return memo;
  }

  var Mistype = function(opts) {
    this.opts = opts;
    window.addEventListener('keyup', function(e) {
      if (e.which == 13 && e.ctrlKey) {
        this.send(this.get())
      }
    }.bind(this))
  }


  Mistype.prototype.get = function() {
    var selection = window.getSelection()
    if (selection.anchorNode !== null) {
      return {
        text: selection.toString(),
        classes: Array.slice.call(selection.anchorNode.parentElement.classList, 0),
        tag: selection.anchorNode.parentNode.tagName,
        url: window.location.href 
      }
    }
  }

  Mistype.prototype.send = function(data, callback) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function(){
      if (req.readyState === 4 && typeof callback === 'function') {
        callback(req.responseText);
      }
    };
    req.open('get', '//oh.mistype.co/' + encodulator(data), true);
    req.send();
  }

  var config = JSON.parse(document.querySelector('script[src$="typo.js"]').innerHTML)

  return window.mistype = new Mistype(config);
})(window)