registerModule(this,'jqrouter', function(jqrouter, _jqrouter_){
	
	var pathname, hash, contextPath = "/",hashData = {};
	var HASH_PREFIX = "#_=";
	jqrouter.hashchange = function(){
		var _path = document.location.pathname
		var _hash = document.location.hash;
		if (hash != document.location.hash) {
			hash = document.location.hash;
			this.invoke(hash);
		}
		if (pathname != document.location.pathname) {
			pathname = document.location.pathname;
			this.invoke(pathname.replace(contextPath,"/"));
		}
	};
	
	jqrouter.cache = {};
	jqrouter.onchange_map = {};
	jqrouter.refineKey = function(_key){
		//(contextPath + _key).replace(/[\/]+/g,'/')
		return (_key).replace(/\{(.*?)\}/gi,'$')
		return _key;// .replace(/\[/gi, '#').replace(/\]/gi, '');
	};
	jqrouter.split = function(key){
		return key.split(/[\/]+/gi);
	};
	jqrouter.invoke = function(_key){
		console.warn("invokd..",_key)
		var key = this.refineKey(_key);
		return this.callFun(key);
	};
	jqrouter.on = function(_key, fun, isHTTP){
		var key = this.refineKey(_key);
		console.error("key",key);
		var keys = jqrouter.split(key);
		var ref = this.onchange_fun;
		var _nextKey = keys[0];
		var _key = keys[0];
		for ( var i = 0; i < keys.length ; i++) {
			_key = keys[i];
			_nextKey = keys[i + 1];
			_atKey = '@' + _key;
			ref[_atKey] = ref[_atKey] || {
					fun : [],
					key : _key, nextKey : _nextKey, next : jqrouter.next
				};
			ref = ref[_atKey];
		}
//		ref['@' + _nextKey] = ref['@' + _nextKey] || {
//			fun : [],
//			key : _nextKey, next : function(o){
//				console.debug("oooo>",this.key)
//				for(var i in this.fun){
//					this.fun[i].apply(jqrouter,o.arg);
//				}
//			}, isHTTP : isHTTP, nextKey : null
//		};
		ref.fun.push(fun);
	};

	// execute event handler
	jqrouter._callFun = function(key){
		var keys = jqrouter.split(key);
		if (this.onchange_fun.next) {
			return this.onchange_fun.next(0,{
				url : key, arg : [], index : 0, keys : keys
			});
		}
	};

	jqrouter.next = function(index,o){
		console.info(this,"===>",this.key,o.keys,index);
		var curIndex = o.index++;
		if (this['@' + o.keys[index]]) {
			this['@' + o.keys[index]].next(index+1,o);
		}
		if (this['@$']) {
			o.arg.push(o.keys[index]);
			this['@$'].next(index+1,o);
		}
		if(index==o.keys.length){
			for(var j in this.fun){
				this.fun[j].apply(jqrouter,o.arg);
			}
		}
		return true;
	};
	jqrouter.onchange_fun = {
		next : jqrouter.next,
	};
	
	jqrouter.TRIGGER = debounce(function(){
		jqrouter.trigger();
	});
	
	// Registers an event to be triggered
	jqrouter.callFun = function(key){
		this.onchange_map[key] = true;
		// return this._callFun(key);
		jqrouter.TRIGGER();
	};
	// process event queue
	jqrouter.trigger = function(){
		for ( var key in this.onchange_map) {
			var propagation = this._callFun(key);
			delete this.onchange_map[key]
		}
	};
	jqrouter.go = function(url){
		return window.history.pushState(null,null,(contextPath + url).replace(/[\/]+/g,'/'));
	};
	jqrouter._ready_ = function(){
	    var pushState = history.pushState;
	    
	    history.pushState = function(state) {
	    	console.warn("url pusing",state);
	        if (typeof history.onpushstate == "function") {
	           // history.onpushstate({state: state});
	        }
	        var ret = pushState.apply(history, arguments);
	        jqrouter.hashchange();
	        return ret;
	    }
		window.onpopstate = history.onpushstate = function(e) {
			console.warn("url changed",e);
			jqrouter.hashchange();
		}
		$('body').on('click','a', function(e){
			var href = this.getAttribute('href');
			if(!utils.url.isRemote(href) && !e.ctrlKey){
				if(href.indexOf(HASH_PREFIX) === 0){
					var params = href.replace(HASH_PREFIX,"").split(":");
					jqrouter.setKey.apply(jqrouter,params);
					var myEvent = new Event("jqrouter.key."+params[0])
					//this.dispatchEvent(myEvent);
					$(this).trigger("jqrouter.key."+params[0],{key : params[0], value : params[1]});
				} else {
					jqrouter.go(href.replace(contextPath,"/"));
				}
				return preventPropagation(e)
			}
		});
		jqrouter.on("#_/{hashdata}",function(a,b){
			hashData = JSON.parse(decode64(a));
		});
		return jqrouter.hashchange();
	};
	
	jqrouter.setKey = function(key,value){
		if(hashData[key] !== value){
			hashData[key] = value;
			jqrouter.go("#_/"+encode64(JSON.stringify(hashData)));
		}
	};
	jqrouter.getKey = function(key,defValue){
		return hashData[key] ===undefined ? defValue : hashData[key];
	};
	
	jqrouter.getKeys = function(keyMap){
		var retMap = {};
		for(var key in keyMap){
			retMap[key] = jqrouter.getKey(key,keyMap[key])
		}
		return retMap;
	};
	
	jqrouter._config_ = function(moduleConfig,appConfig){
		contextPath = appConfig.contextPath;
	};
});