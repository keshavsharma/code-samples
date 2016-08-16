// JavaScript Document
// JavaScript Document
	Array.prototype.each = function(fn){
		for(var i=0;i<this.length;i++){
			fn.apply(this, [i, this[i]]);
		}
	}
	function kvalidate(form){
		var cancel = null;
		var usingForm = true, groupEmptyV = false;
		var Controls=new Array(), Forms = new Array(), Groups= new Array();
		var base = this, form = null;var k = new kTools();
		this.Controls = Controls;
		this.init = function(){
			k = new kTools();
			$('body').children().each(function(){
				base.proc($(this));
			});
		};a
		var chkCtrl = function(elem){
			if(!elem){
				return true;
			}
			//alert(elem);
			return elem.is("input") || elem.is("select") || elem.is("textarea");
		};
		this.remove = function(elem){
			remove(elem);
		}
		var remove = function(v){
			v = $(v);
			if( chkCtrl(v)){
				var l = Controls.length;
				Controls.removeByKey(v.attr('id'));
				//alert("in remove  "+l+"  "+Controls.length);
			}
			else{
				v.children().each(function(i, v){
					remove(v);
				});
			}
		};
		this.proc = function(elem, form){
			//alert("in");
			if(elem.is("form")){
				id = elem.attr('id');
				//alert( id);
				Forms.push({'control': elem, 'salt': $(elem).attr('k-v-salt'), 'id': id});
				this.procForm(elem, id);
			}
			else if( elem.attr("k-v-group")){
				this.procGroup(elem, form);
			}
			else if(elem.attr("k-v-radios")){
				this.procRadio(elem, form);
			}
			else if( chkCtrl(elem)){
				this.procControl(elem, form);
			}
			else if(elem.attr('k-v-trigger') ){ 
				this.regTrigger(elem, form);
			}
			else if( elem.children().size()>0){
			 //alert("in child");
				var base = this;
				$(elem).children().each(function(i, v){
					base.proc($(v), form);
				});
			}
		};
		this.regTrigger = function(elem, isId){
			var salt = elem.attr('k-v-salt');
			 
			if(elem.attr('k-v-trigger')=='f'){
				for(var i=0; i<Forms.length; i++){
					if((isId ==true && Forms[i].id == id)||(isId && Forms[i].salt == salt)) {
						base.vForm(Forms[i].control);
						return;
					}
				}
			}
			else if(elem.attr('k-v-trigger')=='g'){
				for(var i=0; i<Groups.length; i++){
					if(Groups[i].salt == salt){
						base.vGroup(Groups[i].control);
						return;
					}
				}
			}
			else if(elem.attr('k-v-trigger')=='c'){
				for(var i=0; i<Controls.length; i++){
					if(Controls[i].salt == salt){
						base.vControl(Controls[i].control);
						return;
					}
				}
			}
		};
		this.procForm = function(elem, form){
			//alert("in form "+elem.attr("k-v-group"));
			var base = this;
			form = form==null?elem.attr('id'):form;
			if(elem.attr("k-v-group")){
				this.procGroup(elem, form);
			}
			else if(elem.attr("k-v-radios")){
				alert("in proc radio");
				this.procRadio(elem, form);
			}
			else if(chkCtrl(elem)){
				this.procControl(elem, form);
			}
			else{
			//alert("in proc form");
				$(elem).children().each(function(i, v){
					base.proc($(v), form);
				});
			}
		};
		var prevGroup = null;
		this.procGroup = function(elem, form, group ){
			if(prevGroup != group){
				var g = $(elem);
				Groups.push({ "name": k.split(g.attr('k-v-group')).merge(group), "control":g ,"rules":getGroupRules(g), "form":form, 'salt': $(elem).attr('k-v-salt'), 'id': $(elem).attr('id') }); 
			}
			group = group ? group: prevGroup;
			prevGroup = group;
			elem = elem==null?group:elem;
			if(chkCtrl(g)){
				this.procControl(elem, form, group);
			}
			else{
				$(elem).children().each(function(i, v){
					base.procGroup(this, form, group);
				});
			}
		};
		this.console = function(command, data){
			if(command == "rules"){
				for(var i=0;i<data.length;i++){
					data["control"] = $(data[i].id );
					data["salt"] = data["salt"]?data["salt"]:data["control"].attr('k-v-salt');
					data[i].rules = getRules(data[i]);
					if(data["type"]=="f"){
						Forms.push(data[i]);
					}
					else if(data.type == "g"){
						Groups.push(data[i]);
					}
					else if(data.type == "c"){
						Controls.push(data[i]);
					}
					evRegister(data.control, data[i]);
				}
			}
		}
		var getRules = function(control){
			var control = $(control);
				var ob = [{'handler': control.attr('k-v-handler')}, 
			{'handler2': control.attr('k-v-handler2')},
			{'k-v-required': control.attr('k-v-required')},
			{'k-v-alphanumeric': control.attr('k-v-alphanumeric')},
			{'k-v-int': control.attr('k-v-int')},
			{'k-v-decimal': control.attr('k-v-decimal')},
			{'k-v-min': control.attr('k-v-min')},
			{'k-v-max': control.attr('k-v-max')},
			{'k-v-length':control.attr('k-v-length')},
			{'k-v-date':control.attr('k-v-date')},
			{'k-v-email':control.attr('k-v-email')},
			{'k-v-file':control.attr('k-v-file')}
			];
			getDynRules(control,  ob);
			//if( ob[ob.length-1]['k-v-reg']) alert( ob[ob.length-1]['k-v-reg'][0].reg);
			return ob;
		}
		var getDynRules = function(control, ob){
			var i = 0;var _ob;
			while(1==1){
				var reg = control.attr('k-v-reg-'+i)
				if(reg == undefined){
					break;
				}
				else{
				// alert("got rule "+reg);
					if(i==0){ _ob =new Array(); }
					//alert(reg);
					_ob.push({'reg': reg , 'error': control.attr('k-v-reg-'+i+'-error')});
					i++;
				}
			}
			if(_ob){
				//alert(_ob);
				ob.push({'k-v-reg':_ob});
			}
			var comp = control.attr('k-v-compare');
			if(comp){
				ob.push({'k-v-compare':{"target":$('#'+comp), "error":control.attr('k-v-compare-error') }});
			}
			while(1==1){
				var reg = control.attr('k-v-custom-'+i)
				if(reg == null){
					break;
				}
				else{
					if(i==0){ ob['k-v-custom'] = Array(); }
					ob['k-v-custom'].push({'custom': reg , 'error': control.attr('k-v-custom-'+i+'-error')});
					i++;
				}
			}
		}
		this.procControl = function(control, form, group){
	//	alert(control.attr('id')+"  in proc "+group);
		var rules = getRules(control);
		//alert(rules);
			var o = {"rules": rules, "control":control, "form":form, "group":group, 'salt': $(control).attr('k-v-salt'), 'id': control.attr('id') };
			Controls.push(o);
			evRegister(o);
		};
		this.procRadio = function(control, form, group){
			var rules = [];
			var _radios = control.find('input');
			var radios = new Array();
			for(var i=0;i< _radios.length;i++){
				radios.push( $(_radios[i]) );
			}
			var o = {"rules": rules, "control":control, "form":form, "radios": radios, "group":group, 'salt': $(control).attr('k-v-salt'), 'id': control.attr('id') };
			Controls.push(o);
			evRegister(o);
		};
		this.isGroupEmpty = function(name){
			var res = true;
			var ctrls = Controls.findAllByKey(name, 'group') ;
			ctrls.each(function(i, v){
				var c = v.control;
				if(c.val()!="" || !(c.attr('placeholder') == c.val()) ){
					res = false;
				}
			});
			return res;
		};
  
		this.vGroup = function(name){
			var res = true;
			if(this.groupEmptyV &&  isGroupEmpty(name)){ return true; }
			for(var i=0;i<Controls.length;i++){
				var g = Controls[i].group;
				if(g==null){ continue; }
				g = g.findByKey(name, 'name');
				if(g==null){ continue; }
				res = res && this.vControl(g.Control);
			}
			return res;
		};
		this.gotoError = function(){
			 var oft;
			 var topOffset = 50;
			var ofts=$('.error');
			//alert("in");
			for(i=0;i<ofts.length;i++)
			{
			if(ofts[i].style.display!="none"){
				oft=ofts[i];
				break;
			}
			}
			if(oft==null)
			return;
			var t=$(oft).offset().top;
			t = t- topOffset;
			window.scrollTo(0,t);

		}
		this.vForm = function(ct, focus){
		 //alert("in vfrom"+Controls.length);
		 var form = ct.id;
			var res = true;
			for(var i=0;i<Controls.length;i++){
				//alert(Controls[i].form+" - "+form);
				if(Controls[i].radios){
					
				}
				else if(Controls[i].form != form || !Controls[i].control.attr('id')){ continue; }
				var control = $(Controls[i].control);
				//alert("id "+control.attr('id'));
				var rs = this.vControl(Controls[i]);
				res = res && rs
			}
			//alert("result"+focus);
			if(focus){
				this.gotoError();
			}
			return res;
		};
		var evRegister = function(ob){
			control = ob.control;
			if(control.attr("k-v-onchange")){
				control.change( function(){
					base.vControl(ob);
				});
			}
			if(control.attr("k-v-onkeyup")){
				control.keyup( function(){
					base.vControl(ob);
				});
			}
			if(control.attr("k-v-onblur")!=null){
			control.blur(function(){
					base.vControl(ob);
				});
			}
			if(control.attr("placeholder")!=null){
				//alert(control.attr("placeholder"));
				//control.placeholder();
			}
		};
		this.vControlById = function(id, focus, c){
			var o;
			Controls.each(function(i, v){
				if(v.id==id){
					o = v;
				}
			});
			var rs = this.vControl(o, focus, c)
			if(focus){
				this.gotoError();
			}
			return rs;
		}
		this.vRadio = function(ob, focus, c){
			var m = "";
			var chk = false;
			for(var i=0; i<ob.radios.length; i++){
				rad = ob.radios[i];
				chk = chk || (rad.attr('checked')=="checked"? true : rad.attr('checked'));
			}
			if(!chk){
				m = ob.control.attr('k-v-radios');
			}
			return throwGroupError(ob.control, m);
		}
		this.vControl = function(ob, focus, c){
			if(ob == null){
				return true;
			}
			cancel = c;
			var m, valid = true;
			//alert("rules length "+ob.rules.length);
			if(ob.radios){
				return this.vRadio(ob, focus, c);
					
			}
			for(var j=0;j<ob.rules.length;j++){
			for(var i in ob.rules[j]){
				//alert(i);
				v = ob.rules[j][i];
				if(v==null || valid==false){ continue; }
				
				m = ""; v=ob.rules[i];
				if(i == 'k-v-required'){
					m = v_required(ob.control, v);
					var vl = throwError(ob.control, m);
					if(!vl){ valid =false;  }
				}
				else if(i == 'k-v-alphanumeric'){
					m = v_alphanumeric(ob.control, v);
					var vl = throwError(ob.control, m);
					if(!vl){ valid =false;  }
				}
				else if(i == 'k-v-length'){
					m = v_length(ob.control, v);
					var vl = throwError(ob.control, m);
					if(!vl){ valid =false;  }
				}
				else if(i == 'k-v-int') {
					m= v_int(ob.control, v);
					var vl = throwError(ob.control, m);
					if(!vl){ valid =false;  }
				}
				else if(i == 'k-v-decimal') {
					m= v_decimal(ob.control, v);
					var vl = throwError(ob.control, m);
					if(!vl){ valid =false;  }
				}
				else if( i == 'k-v-max') {
					m= v_max(ob.control, v);
					var vl = throwError(ob.control, m);
					if(!vl){ valid =false;  }
				}
				else if(i == 'k-v-min') {
					m= v_min(ob.control, v);
					var vl = throwError(ob.control, m);
					if(!v1){ valid =false; }
				}
				else if(i == 'k-v-email') {
					m = v_email(ob.control, v);
					var v1 = throwError(ob.control, m);
					//alert("in email ");
					if(!v1){ valid =false; //alert("in email false");
					}
				}
				else if(i == 'k-v-date') {
					m = v_date(ob.control, v);
					var v1 = throwError(ob.control, m);
					//alert("in email ");
					if(!v1){ valid =false; //alert("in email false");
					}
				}
				else if(i == 'k-v-compare') {
					v = ob.rules[j][i];
					m = v_comp(ob.control, v);
					var v1 = throwError(ob.control, m);
					if(!v1){ valid =false; //alert("in email false");
					}
				}
				else if(i == 'k-v-file') {
					//alert("in file "+m);
					v = ob.rules[j][i];
					m = v_file(ob.control, v);
					var v1 = throwError(ob.control, m);
					if(!v1){ valid =false; //alert("in email false");
					}
				}
				else if(i == 'k-v-reg') {
				v = ob.rules[j][i];
				//alert(v);
				//if(v==null){ continue; }
					for(var x = 0; x<v.length;x++){
						var reg;
						eval("reg = "+v[x].reg);
						m = reg.test(ob.control.val());
						if(!m){ 
							m = v[x].error; var v1 = throwError(ob.control, m);  valid =false; break; 
						}
					}
				}
				//valid = v1;
				//alert("in "+vl);
				//valid = valid && vl;
			}
			if(cancel){
				cancel = null;
				return m;
			}
			if(valid == false){
				return false;
			}
			}
			return valid;
		}
		var v_required = function(control, ob){
			var m ="", res, attr ="k-v-required";
			res = /^[^\f\n\r\t\v\u00A0\u2028\u2029]+$/.test(control.val())
			if(res== false || control.attr('placeholder') == control.val()){
				m = control.attr(attr);
				if(m==""){
					m = "This field cannot be left blank";
				}
			}
			//alert("in req "+m);
			return m;
		}
		var v_date = function(control, ob){
			var attr="k-v-date", m="", patt = /^([0-9\-\/]{8,10})$/;
			if(patt.test(control.val())==false){
				m = control.attr(attr);
				if(m==""){
					m = "Invalid Date Input";
				}
			}
			return m;
		}
		var v_length = function(control, ob){
			var attr="k-v-length", attr2 = "k-v-length-error", m="";
			var l = control.attr(attr);
			if((control.val()).length < l){
				m = control.attr(attr2);
				if(!m || m==""){
					m = "atleast "+l+" characters required";
				}
			}
			//alert("in "+m);
			return m;
		}
		var v_email = function(control, ob){
			var attr="k-v-email", m="", patt = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
			if(patt.test(control.val())==false){
				m = control.attr(attr);
				if(m==""){
					m = "Invalid Email Address";
				}
			}
			return m;
		}
		var v_alphanumeric = function(control, ob){
			var attr="k-v-alphanumeric", m="", patt = /^([0-9a-zA-Z])$/;
			if(patt.test(control.val())==false){
				m = control.attr(attr);
				if(m==""){
					m = "Only alphabets and numbers allowed";
				}
			}
			return m;
		}
		var v_int = function(control, ob)	{
			var attr ="k-v-int",m="";
			res  = /^[\d]+$/.test(control.val());
			if(res==false){ 
				m = control.attr(attr);
				if( m == "" ){
					m = "value must be integer.";
				}
			}
			//alert(m);
			return m;
			
		} 
		var v_decimal = function(control, ob){
			attr  = 'k-v-decimal',m="";
			if(control.attr(attr)){
				res = /^[\d]+\.?[\d]*$/.test(control.val());
				//alert(res);
				if(res==true){	return m; }
				m = control.attr(attr);
				if( m == "" ){
					m = "value must be decimal.";
				}
			}
			return m;
		}
		var v_min = function(control, ob){
			attr = 'k-v-min',m="";
			if(control.attr(attr)){
				var min= parseInt(control.attr(attr));
				var val = parseInt(control.val());
				if(control.attr('k-v-decimal')){
					min = parseFloat(min);
				}
				
				if(min <= val ){ return ""; }
				m = control.attr(attr+"-error");
				if(! m ){
					m = "value must be greater then "+min
				}
			}
			//alert(m);
			return m;
		}
		var v_comp = function(control, ob){
			attr = 'k-v-compare',m="";
			if(control.attr(attr)){
				var min= parseInt(ob.target.attr(attr));
				var val = control.val();
				var val2 = ob.target.val();
				if( val == val2 ){ return ""; }
				m = control.attr(attr+"-error");
				if(! m ){
					m = "Password Must Match"
				}
			}
			//alert(m);
			return m;
		}
		var v_max = function(control, ob){
			attr = 'k-v-max',m="";
			if(control.attr(attr)){
				var max = parseInt(control.attr(attr)) ;
				var val = parseInt(control.val());
				if(control.attr('k-v-decimal')){
					max = parseFloat(max);
				}
			
				if( val<= max){ return ""; }
				m = control.attr(attr+"-error");
				if(! m ){
					m = "value must be less then "+max
				}
			}
			//alert(m);
			return m;
		}
		var v_file = function(control, ob){
			var attr = 'k-v-file',m= null;
			if(control.attr(attr)){
				var allow_exts = control.attr(attr) ;
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
					m = control.attr(attr+"-error");
				}
				if(m != "" ){
					m = "Please provide file of type ( "+allow_exts+" )";
				}
			}
			//alert("in v file "+m);
			return m;
		}
		
		var v_reg = function(control, ob, ix){
			attr = 'k-v-reg'+ix, m="";
			if(control.attr(attr)){
				var reg = control.attr(attr), m = control.attr(attr+"-error");
				res = reg.test(control.val());
				if(res==true){	return m; }
				if( m == "" ){ m = "error"; }
				
			}
			return m;
		}
		
		var throwError = function(control, m){
		//alert("in thr"+m);
			if(cancel == true){
				return m;
			}
			if(control.parent().find('.error-message')[0]==null){
				control.parent().append('<span class="error-message"></span>');	
			}
			if(m==""){
				control.parent().find('.error-message').html("").hide();
				control.removeClass('error_control');
				return true;
			}
			control.parent().find('.error-message').html(m).show();
			control.addClass('error_control');
			return false;
		}
		var throwGroupError = function(control, m){
			if(cancel == true){
				return m;
			}
			if(control.find('.error-message')[0]==null){
				control.append('<span class="error-message"></span>');	
			}
			if(m==""){
				control.find('.error-message').html("").hide();
				control.removeClass('error_control');
				return true;
			}
			control.find('.error-message').html(m).show();
			control.addClass('error_control');
			return false;
		}
	}
	var vControl = function (id){
		var sel = $(id), valid = true;
		if(sel.val()=='' || sel.val() == sel.val() == sel.attr('placeholder')){
			sel.parent().find('.error').html("Required").show();
			valid = false;
		}
		else{
			sel.parent().find('.error').html("").hide();
		}
		//alert(id +"   "+valid);
		return valid;
	 }