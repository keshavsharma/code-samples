<?php
App::uses('FormHelper', 'View/Helper');
class VformHelper extends FormHelper
{
	public $isFirstCall = true;
	public $jsValidations = Array();
	public $jsValidatorName = Array();
	public $VformDefaultValid = Array();
	public $currentValiations = null;
	public $vjsBuffer = "";
	public function input($field=null, $options= Array()){
		$this->setEntity($field);
		$modelKey = $this->model();
		$fieldKey = $this->field();
		$this->_introspectModel($modelKey, 'validates', $fieldKey);
		$this->currentValiations = $this->loadErrors($modelKey, $fieldKey, $options);	
		return parent::input($field, $options);
	}
	public function create($model=null, $options= Array()){
		$this->_onsubmit = Array();
		if (is_array($model) && empty($options)) {
			$options = $model;
			$model = null;
		}

		if (empty($model) && $model !== false && !empty($this->request->params['models'])) {
			$model = key($this->request->params['models']);
		} elseif (empty($model) && empty($this->request->params['models'])) {
			$model = false;
		}
		$this->defaultModel = $model;

		$key = null;
		if ($model !== false) {
			$key = $this->_introspectModel($model, 'key');
			$this->setEntity($model, true);
		}
		if ($model !== false && $key) {
			$recordExists = (
				isset($this->request->data[$model]) &&
				!empty($this->request->data[$model][$key]) &&
				!is_array($this->request->data[$model][$key])
			);

			if ($recordExists) {
				$created = true;
				$id = $this->request->data[$model][$key];
			}
		}
		if (!isset($options['id'])) {
			$domId = isset($options['action']) ? $options['action'] : $this->request['action'];
			$options['id'] = $this->domId($domId . 'Form');
		}
		$frm = $options['id'];
		$this->jsValidatorName = 'val_'.$frm;
	 	
		$txt = '<script type="text/javascript" language="javascript">'.($this->isFirstCall ? "var kmonitor = null;":"").'var '.$this->jsValidatorName.' = new kvalidate("'.$frm.'", "'. $this->webroot.$this->request->controller.'/validate_by_model'. '");$(function(){ if(!kmonitor){ kmonitor = new monitor(); } kmonitor.regObject("validations", '.$this->jsValidatorName.', "'.$frm.'")});</script>';
		$this->isFirstCall = false;
		if(isset($options['validations']) && is_array($options['validations'])){
			$this->VformDefaultValid = $options['validations'];
			unset($options['validations']);
		}
		
		$buffer = "";
		$this->_View->Html->Script("Vform/kvalidate", Array("inline"=>false));
		$this->_View->Html->Script("klib/kTools", Array("inline"=>false));
		$this->_View->Html->Script("klib/monitor.js", Array("inline"=>false));
		return $buffer."\n".parent::create($model, $options).$txt;
			
	}
	
	public function end($text=null, $op=Array()){
		return parent::end($text, $op).'<script type="text/javascript" language="javascript"> jQuery(function(){'.$this->jsValidatorName.'.proc('.json_encode($this->jsValidations).");".$this->jsValidatorName.".init(); }); \n $this->vjsBuffer </script>";
	}
	
	private function extractModelErrors($model, $field, &$res, &$options){
		if(isset($this->_models[$model])){
			$vob = $this->_models[$model]->validator(); 
			if($vob!=null && isset($vob[$field])){
				$vob = $vob[$field];
				if($vob != null){
					$vob = $vob->getRules();
					foreach($vob as $r){
						$rule = null; $error = null; $val = "";
						$isCallBack = false;
						$v = $r->rule;
						if(is_array($v)){
							if(isset($v[0])){
								$rule =  $v[0];
								$val = isset($v[1])? $v[1]:"";
								$error = $r->message;
								
							
							} else{
								
							}
						} else{
							$rule = $v;
							$val = $r->message==null? "" : $r->message;
						}
						$rule = $this->filterValidOption($rule);
						$res[$rule] = $val;
						if(isset($error)){
							$res["$rule-error"] = $error;
						}
						
					}
				}
			}
		}
		return $res;
	}

	private function extractErrors($vob, &$rules, &$options){
		if(!is_array($vob)){
			//print_r("  it is ".$vob);
			$vob = $this->filterValidOption($vob);
			$rules[$vob]="";
			return;
		}
		foreach($vob as $k=>$v){
			$errMsg = null;
			if(!is_array($v)){
				$v = $this->filterValidOption($v);
				$rules[$v]="";
			}
			else{
				$er = ""; 
				if(isset($v["message"])){
					$er= $v["message"];
				}
				if(is_array($v)){
					//$x= Array('rule'=>''
					if(isset($v[0])){
						$rule =  $this->filterValidOption($v[0]);
						$er = $v[1];
					}
					else{
						if(is_array($v['rule'])){
							$rule = $this->filterValidOption($v['rule'][0]);
							$er = $v['rule'][1];
							$errMsg = isset($v['message']) ? $v['message'] : null;
						}
						else{
							$rule = $this->filterValidOption($v['rule']);
							$er = isset($v["message"]) ? $v["message"] : "";
						}
						
					}
					//print_r($rule);
					$rules[$rule] = $er;
				}
				else{
					if($rule=="e"){ continue; }
					if(substr($rule,0,1)=="/"){
						$er = isset($v['message']) ? $v['message'] : null;
					}
				}
				$rules[$rule] = $er;
				if(isset( $errMsg )){
					$rules[$rule."-error"] =  $errMsg ;
				}
			}
		}
		return $rules;
	}
	
	private function loadErrors($m, $f, &$_op){
		$op = $this->domId($_op);
		$valRules = null;
		$this->lastId = $op['id'];
		//print_r($op);
		if(!$m){
			return;
		}
		//print_r(array_keys($this->_models)); die;
		$vob = $this->_models[$m]->validate; 
		
		$vob = isset($vob[$f])?$vob[$f]:Array();
		
	//	 print_r($vob);
		//////////////////////////
		
		$rules = Array(); $options = Array(); $events = null;
		
		$this->extractModelErrors($m, $f, $rules, $options);
		if(isset($this->VformDefaultValid['events'])){
			$events = $this->VformDefaultValid['events'];
			unset( $this->VformDefaultValid['events']);
		}
		
		$options = array_merge($options , Array('callback'=> false, 'autoValidateCallback'=> true, 'waitMessage'=>'', 'model'=>$m,'field' => $f, 'handlers'=>Array(), 'jsEvent'=> null));
		if(isset($_op['validations'])){
			if(isset($_op['validations']['callback']) ){
				$options['callback'] = $_op['validations']['callback'] == true?true:false;
			} 
			if(isset($_op['validations']['waitMessage'])){
				$options['waitMessage'] = $_op['validations']['waitMessage'];
			}
			if(isset($_op['validations']['successMessage'])){
				$options['successMessage'] = $_op['validations']['successMessage'];
			}
			if(isset($_op['validations']['handlers'])){
				$options['handlers'] = $_op['validations']['handlers'];
				unset($_op['validations']['handlers']);
			}
			if(isset($_op['validations']['jsEvent'])){
				$options['jsEvent'] = $_op['validations']['jsEvent'];
				unset($_op['validations']['jsEvent']);
			}
			if(isset($_op['validations']['autoValidateCallback'])){
				$options['autoValidateCallback'] = $_op['validations']['autoValidateCallback'];
				unset($_op['validations']['autoValidateCallback']);
			}
			
		}
		else{
			$options['callback'] = false;
		}
		$this->extractErrors($this->VformDefaultValid, $rules, $options);
		 $this->VformDefaultValid['events'] = $events;
		if(isset($_op['validations'])){
			if(isset($_op['validations']['events'])){
				if($_op['validations']['events']==false){ $events = null; }
				else {$events = array_merge($events, $_op['validations']['events']); }
				unset( $_op['validations']['events']);
			}
			$this->extractErrors($_op['validations'], $rules, $options);
			unset($_op['validations']);
		}
		
		if(count($rules)>0){
			$valRules = Array('id'=> $op['id'], 'rules'=> $rules);
			if($events!=null && count($events)>0){
				$valRules['events'] = $events;
			}
			if($options['callback'] ){
				$valRules['options'] = $options ;
			}
			$this->jsValidations[] = $valRules;
			//print_r($valRules);
		}
		return $valRules;
	}
	
		
	public function filterValidOption($o){
		//print_r($o);
		if(strtolower($o) == 'notempty'){
			return "required";
		}
		else if ($o == 'minLength'){ return "length"; }
		else { return substr($o,0,1)=="/" ? $o :	strtolower($o); }
	}
	
	public function dropDown($name, $dropOptions = Array()){
		$config = Array('type'=>'text', 'autocomplete'=> 'off');
		$View = $this->_View;
		$inpv = $this->restoreValue($name);
		$ops = "";
		$sel = null;
		if(isset($dropOptions['default'])){
			$dropOptions['selected'] = $sel = $dropOptions['default'];
			unset($dropOptions['default']);
		}
		if(!isset($dropOptions['hidden'])){
			$dropOptions['hidden'] = $name."_val";
		}
		$_sel = $this->restoreValue($dropOptions['hidden']);
		$sel = $_sel ? $_sel : $sel;
		
		if(!isset($dropOptions['value'])){
			if( $inpv!=null){
				$config['value'] = $inpv;
			}
			else if(isset($sel)){
				$config['value'] = $dropOptions['options'][$sel];
			}
		}	
		
		$updateText = 'Updating..';
		if(!isset($dropOptions)){ $dropOptions = Array(); }
		if(!isset($dropOptions['searchMode'])){ $dropOptions['searchMode'] = 'start'; }
		
		if(isset($dropOptions['updateText'])){
			$updateText = $dropOptions['updateText'];
			unset($dropOptions['updateText']);
		}
		$id = $View->uuid('drop', Array('action'=> $this->request->action));
		$config['before'] = '<div class="dropdown" id = "'.$id.'">'.$this->input($dropOptions['hidden'], Array('type'=>'hidden', 'value'=>$sel));
		$config['after'] = '<span class="update-label">'.$updateText.'</span><a class="arrow">&nbsp;</a><div class="drop-content"><div class="updator">'.$this->Html->image('icons/ajax-loader-bar.gif').'</div><ul class="drop-ctnt"> </ul></div></div>';
		$inp = $this->input($name, $config);
		$this->Html->script('klib/kEvents', Array('inline'=>false));
		$this->Html->script('klib/kDrop', Array('inline'=>false));
		$oid = "o_".$id;
		$this->vjsBuffer.= 'var '.$oid.' = new kDrop("#'.$id.'", '.json_encode($dropOptions).'); $(function(){ '.$oid.'.init(); }); '."\n" ;
		$this->lastDropDown = $oid;
		return $inp;
	}
	
	private function restoreValue($field){
		$this->setEntity($field);
		$ent = $this->entity();
		$d = $this->request->data;
		foreach($ent as $e){
			if(!isset($d[$e])){ $d = null; break; } 
			else{ $d = $d[$e]; }
		}
		return $d;
	}
}
?>