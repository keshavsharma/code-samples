
function kvalidate(form, callbackUrl){
	var k = new kTools();
	this.validations = Array(); var th =this;
	var valid_response = new Array();
	var last_valid = false;
	var submitter;
	var grpRules = [];
	var t=this;
	this.controlWrap = 'div';
	this.addGroupRule = function(o){ 
		
		var rule = o.rule;
		var msg = o.message;
		var controls = o.controls;
		
		var grp = grpRules.findByKey(rule, 'rule');
		if(!grp){
			grpRules.push(o);
		}
		else{
			var delArray=[];
			var ct1,ct2,found;
			for(var i=0;i<controls.length;i++){
				ct1 = controls[i];
				found = false;
				for(var j=0;j<grp.controls.length;j++){
					ct2 = jQuery(grp.controls[j]);
					if(ct1[0].id==ct2[0].id){
						found = true; 
						break;
					}
					//console.log(ct1, ct2);
				}
				if(!found){
					grp.controls.push(ct1);
				}
			}
		}
	}
	this.evaluateGroupRules = function(ctrl){
		var m=""; var t = this;
		var errControls = null;
		var rs=true;
		grpRules.each(function(i, r){
			var found = false;
			for(var i=0;i<r.controls.length;i++){
				if(jQuery(r.controls[i])[0].id == ctrl[0].id){
					found = true;
					break;
				}
			}
			if(!found){
				return false;
			}
			if(r.rule == 'unique'){
				rs = t.v_group_unique(ctrl, r.controls);
				m = 'field value must be used once';
			}
			if(r.rule == 'required'){
				rs = t.v_group_required(ctrl, r.controls);
				m = 'Select one value';
			}
			if(!rs.valid){
				errControls = rs.fightingControls;
				rs = rs.valid;
			} else {
				return; 
			}
				
			m = v.message&&v.message!=""?v.message:m;
			if(!rs.valid && m!=""){
				throwError(ctrl, m, {'input':'form-error group-error'});
			}
		});
		return rs;
	}
	this.init = function(){
		var t = this;
		form = jQuery('#'+form); 
	//	console.log("init", form);
		submitter = form.find('input[type="submit"]').not('[kvaldiate="false"]');
		submitter.click(fnSend);
		
		submitter2 = form.find('.form-submit');
		submitter2.click(fnSend); 
		
	}
	var fnSend = function(){ 
			var rs = true, _rs;
			for(var i=0;i<th.validations.length;i++){  //console.log(th.validations[i].control , th.validations[i].rules);
				_rs = th.evaluate(th.validations[i].control , th.validations[i], true);
				_rs = _rs=='wait'?true:_rs;
				rs = _rs&&rs;
			}
			last_valid  = rs;
			if(rs===false){ return false; }
			th.exchange(); 
			var clrs = th.callBackResults();
			//console.log(clrs);
			if(clrs == 'busy'){
				setTimeout(reSend, 1000);
				return false;
			}
			return clrs;
		};
		
	var reSend = function(){
		submitter.trigger('click');
	}
	this.callBackResults = function(){
		for(var i in valid_response){
			if(valid_response[i].state=='wait'){
				return 'busy';
			}
			else if(valid_response[i].result===false){
				return false;
			}
		}
		return true;
	}
	this.controlIndex = function(ct_id){
		for(var i =0;i<this.validations.length;i++){
			if(this.validations[i].id == ct_id){
				return i;	
			}
		}
		return -1;
	}
	this.controlObject = function(ct_id){
		var ix = this.controlIndex (ct_id);
		var rt = null;
		if(ix!=-1){
			rt = this.validations[ix];
		}
		return rt;
	}
	
	this.addRule = function(ct_valid){ //console.log(ct_valid);
		var t = this;
		var v = this.validations;
		var ix = this.controlIndex(ct_valid.id);
		if(ix==-1){
			this.validations.push(ct_valid);
		}
		else{
			k.merge(this.validations[ix].rules, ct_valid.rules);
			k.arrayMerge(this.validations[ix].events, ct_valid.events);
		}
		ct_valid.control = jQuery('#'+ct_valid.id);  
		var k1f = function(){ //alert("in"); 
			var id = this.id;
			rs = t.evaluate(jQuery(this), t.controlObject(id) );
			t.exchange(); 
		}
		if(ct_valid.events!=null){
			for(var i=0;i<ct_valid.events.length; i++){
				var ev = ct_valid.events[i];
				ct_valid.control.bind(ev, k1f);
			}
		}
		
		
	}
	
	this.v_group_required = function(ctrl, controls){
		var res = {'valid':false,  };
		controls.each(function(i, c1 ){
			if(c1.is(':checked')){
				res.valid=true;
			}
		});
		//console.log(res);
		return res;
	}
	this.v_group_unique = function(ctrl, controls){
		var res = {'valid':true, 'fightingControls':[] };
		controls.each(function(i, c1 ){
			if(c1[0].id != ctrl[0].id){
				if(c1.val() !="" && c1.val() == ctrl.val()){
					res.valid = false;
					res.fightingControls.push(c1);
				}
			}
		});
		//console.log(res);
		return res;
	}
	this.proc = function(vob){
		for(var i=0;i< vob.length;i++){
			this.addRule(vob[i]);
		}
	}
	this.gotoError = function(){
		var oft;
		var topOffset = 100;
		var ofts=jQuery('.error-message');
		for(i=0;i<ofts.length;i++){
			if(ofts[i].style.display!="none"){
				oft=ofts[i];
				break;
			}
		}
		if(oft==null){
			return;
		}
		var t=jQuery(oft).offset().top;
		t = t- topOffset;
		window.scrollTo(0,t);

	}
	this.evaluate = function(_ctrl, cob, isPostBack){
		//console.log("in ",_ctrl); 
		var rs = this.evaluateControl(_ctrl, cob, isPostBack);
		if(rs=="wait"){
			var o = getObject(valid_response, cob.id);
			rs = true;
		}
		if(rs){
			rs = this.evaluateGroupRules(_ctrl);
		}
		this.gotoError();
		return rs;	
	}
	this.evaluateControl = function(_ctrl, cob, isPostBack){
			cancel = null;
			if(_ctrl.is('.disabled')){
				return true;
			}
			var m, valid = true; 
			var rules = cob.rules; 
			for(var i in rules){
			v = rules[i];
			if(v==null || v===false){ continue; }
			m = "";  
			if(i == 'required'){
				m = v_required(_ctrl, rules); 
				var vl = throwError(_ctrl, m);
				if(!vl){ valid =false;  }
			}
			else if(i == 'alphanumeric'){
					m = v_alphanumeric(_ctrl, rules);
					var vl = throwError(_ctrl, m);
					if(!vl){ valid =false;  }
				}
				else if(i == 'length'){
					m = v_length(_ctrl, rules);
					var vl = throwError(_ctrl, m);
					if(!vl){ valid =false;  }
				}
				else if(i == 'int') {
					m= v_int(_ctrl, rules);
					var vl = throwError(_ctrl, m);
					if(!vl){ valid =false;  }
				}
				else if(i == 'decimal') {
					m= v_decimal(_ctrl, rules);
					var vl = throwError(_ctrl, m);
					if(!vl){ valid =false;  }
				}
				else if( i == 'max') {
					m= v_max(_ctrl, rules);
					var vl = throwError(_ctrl, m);
					if(!vl){ valid =false;  }
				}
				else if(i == 'min') {
					m= v_min(_ctrl, rules);
					var vl = throwError(_ctrl, m);
					if(!v1){ valid =false; }
				}
				else if(i == 'email') {
					m = v_email(_ctrl, rules);
					var v1 = throwError(_ctrl, m);
					//alert("in email ");
					if(!v1){ valid =false; //alert("in email false");
					}
				}
				else if(i == 'date') {
					m = v_date(_ctrl, rules);
					var v1 = throwError(_ctrl, m);
					//alert("in email ");
					if(!v1){ valid =false; //alert("in email false");
					}
				}
				else if(i == 'compare') {
					m = v_comp(_ctrl, rules);
					var v1 = throwError(_ctrl, m);
					if(!v1){ valid =false; //alert("in email false");
					}
				}
				else if(i == 'file') {
					m = v_file(_ctrl, rules);
					var v1 = throwError(_ctrl, m);
					if(!v1){ valid =false; //alert("in email false");
					}
				}
				else if(i[0] == '/') {
					reg = eval(i);
					m = reg.test(_ctrl.val());
					if(!m){
						m = rules[i]; 
						var v1 = throwError(_ctrl, m);  
						valid =false; 
					}
				}
			
			if(!isPostBack){
				this.gotoError();
			}
			if(cancel){
				cancel = null;
				return m;
			}
			if(valid == false){
				return false;
			}
			}
			if(valid){
				if(cob.options && cob.options['callback']){
					this.v_callback(_ctrl, cob.options, cob.id, isPostBack);
					return "wait";
				}
			}
			return valid;
	}
	this.prevArgs=null;
	this.args = new Array();
	var getHandleResult = function(op, rs){
		var res = null;
		if(op.autoValidateCallback){ 
			for(var i=0;i<rs.handlers.length;i++){
				if(rs.handlers[i].result == false){
					res = rs.handlers[i].message;
					return res;
				}
			}
		}
		eval(" res = "+op.jsEvent+"(rs)");
		return res;
	}
	this.exchange = function(){
		if(this.args.length==0){ return; }
		var arg = JSON.stringify({'d': this.args });
		this.prevArgs = this.args;
		this.args = new Array()
		jQuery.ajax({
        	type: "POST",
			url: callbackUrl,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: arg,
			success: function(rsp){
				for(var i =0; i< rsp.length;i++){
					d = rsp[i];
					var ob = getObject(valid_response, d.id);
					m = ob.successMessage ? ob.successMessage : d.message;
					if(d.success && ob.jsEvent){
						var m2 = getHandleResult(ob, d);
						if(m2 && m2.length!=0){
							m = m2;
							d.success = false;
						}
					}
					throwError(ob.control, m, d.success);
					ob.msg = m; ob.result = d.success; ob.state = 'run';
				}
			
			}
		});
	}
	this.v_callback = function(control, ob, key, isPostBack){
		var m="", waitm = ob.waitMessage? ob.waitMessage : "";
		var t = this;
		var o = getObject(valid_response, key);
		if(o==null){
			//console.log("new ob ", key);
			valid_response.push({'id':key, 'result': null, 'lastval': control.val(), 'state':'wait', 'waitMessage':waitm, 'successMessage':ob.successMessage, 'control': control, 'handlers':ob.handlers, 'jsEvent': ob.jsEvent , 'autoValidateCallback':ob.autoValidateCallback});
		}
		else{
			//console.log("last",o);
			if(o.lastval == control.val() || o.state == 'wait'){ 
				if(o.msg){
					extra = o.result?({'input':{'css': ''}}):null;
					throwError(control, o.msg, extra );
				}
				return; 
			}
			o.lastval = control.val();
			o.state = "wait";
		}
		throwError(control, m, {'input':{'css': ''}});
		this.args.push( {'url':ob.url, "field":ob.field, "model":ob.model, "preindex": ob.preindex, "value":control.val(), 'handlers':ob.handlers, "id":key} );
		
	}
	
	var v_required = function(control, ob){
		var m ="", res, attr ="required";
		res = /^[^\f\n\r\t\v\u00A0\u2028\u2029]+$/.test(control.val())
		if(res== false || control.attr('placeholder') == control.val()){
			m = ob[attr];
			if(!m || m==""){
				m = ob[attr+"-error"];
			}
			if(!m || m==""){
				m = "This field cannot be left blank";
			}
		}
		// alert("in req "+m);
		return m;
	}
	var v_date = function(control, ob){
			var attr="date", m="", patt = /^([0-9\-\/]{8,10})$/;
			if(patt.test(control.val())==false){
				m = ob[attr];
				if(m==""){
					m = "Invalid Date Input";
				}
			}
			return m;
		}
		var v_length = function(control, ob){
			var attr="length", attr2 = "length-error", m="";
			var l = ob[attr];
			if((control.val()).length < l){
				m =ob[attr2];
				if(!m || m==""){
					m = "atleast "+l+" characters required";
				}
			}
			//alert("in "+m);
			return m;
		}
		var v_email = function(control, ob){
			var attr="email", m="", patt = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
			if(control.val()!="" && patt.test(control.val())==false){
				m = ob[attr];
				if(m==""){
					m = "Invalid Email Address";
				}
			}
			return m;
		}
		var v_alphanumeric = function(control, ob){
			var attr="alphanumeric", m="", patt = /^([0-9a-zA-Z])$/;
			if(patt.test(control.val())==false){
				m = ob[attr];
				
				if(m==""){
					m = "Only alphabets and numbers allowed";
				}
			}
			return m;
		}
		var v_int = function(control, ob)	{
			var attr ="int",m="";
			res  = /^[\d]+$/.test(control.val());
			if(res==false){ 
				m = ob[attr];
				
				if( m == "" ){
					m = "value must be integer.";
				}
			}
			//alert(m);
			return m;
			
		} 
		var v_decimal = function(control, ob){
			attr  = 'decimal',m="";
			if(ob[attr]){
				res = /^[\d]+\.?[\d]*$/.test(control.val());
				//alert(res);
				if(res==true){	return m; }
				m = ob[attr];
				
				if( m == "" ){
					m = "value must be decimal.";
				}
			}
			return m;
		}
		var v_min = function(control, ob){
			attr = 'min',m="";
			if(ob[attr]){
				var min= parseInt(ob[attr]);
				var val = parseInt(control.val());
				if(control.attr('k-v-decimal')){
					min = parseFloat(min);
				}
				
				if(min <= val ){ return ""; }
				m = ob[attr+"-error"];
				
				if(! m ){
					m = "value must be greater then "+min
				}
			}
			//alert(m);
			return m;
		}
		var v_comp = function(control, ob){
			attr = 'compare',m="";
			if(ob[attr]){
				var val = control.val();
				var val2 = jQuery('#'+ob.compare).val();
				if( val == val2 ){ return ""; }
				m = ob[attr+"-error"];
				if(! m ){
					m = "Password Must Match"
				}
			}
			//alert(m);
			return m;
		}
		var v_max = function(control, ob){
			attr = 'max',m="";
			if(ob[attr]){
				var max = parseInt(ob[attr]) ;
				var val = parseInt(control.val());
				if(ob['decimal']){
					max = parseFloat(max);
				}
			
				if( val<= max){ return ""; }
				m = ob[attr+"-error"];
				if(! m ){
					m = "value must be less then "+max
				}
			}
			//alert(m);
			return m;
		}
		var v_file = function(control, ob){
			var attr = 'file',m= null;
			if(ob[attr]){
				var allow_exts = ob[attr] ;
				//alert(allow_exts);
				var val = control.val();
				if(val==""){ return ""; }
				exts = allow_exts.split(",");
				ext = k.fext(val);
				for(var i=0;i<exts.length;i++){
					//alert(exts[i]+"   "+exts[i].length);
					if(k.trim(exts[i]) == ext){
						m="";
						break;
					}
					
				}
				if(m==null){
					m = ob[attr+"-error"];
				}
				if(m != "" ){
					m = "Please provide file of type ( "+allow_exts+" )";
				}
			}
			//alert("in v file "+m);
			return m;
		}
		
		var v_reg = function(control, ob, ix){
			attr = 'reg'+ix, m="";
			if(ob[attr]){
				var reg = ob[attr], m = ob[attr+"-error"];
				res = reg.test(control.val());
				if(res==true){	return m; }
				if( m == "" ){ m = "error"; }
				
			}
			return m;
		}
		
		var throwError = function(control, m, _extra){
			var extra = {'input': 'form-error', 'message':'' };
			var parentSel = t.controlWrap;
			if(_extra != null){
				k.merge(extra, _extra);
			}
			if(cancel == true){
				return m;
			}
			if(control.closest(parentSel).find('.error-message')[0]==null){
				control.closest(parentSel).append('<div class="error-message '+extra.input.message+'"><span></span><i class="tip"></i></div>');	
			}
			var errCont = control.closest(parentSel).find('.error-message');
			var errSpan = control.closest(parentSel).find('.error-message span');
			if(errSpan.length==0) {
				errSpan = errCont;
			}
			if(m==""){
				errSpan.html("");
				errCont.hide();
				control.removeClass(extra.input);
				return true;
			}
			if (errSpan[0]){
				errSpan.html(m);
				errCont.show();
			}
			if(!extra.input.css==""){
				control.addClass(extra.input);
			}
			return false;
		}
}
function getObject(o, f, key){
	var ix = getObjectIndex(o, f, key);
	return ix==-1? null : o[ix];
}
function getObjectIndex(o, f, key){
	key = key ? key :'id';
	for(var i in o){
		if(o[i][key]==f){
			return i;
		}
	}
	return -1;
}