/**
 * Node Converter
 * In this app, there are few rules to convert a low level (green) to high level node (gold)
 * This js class is to convert the nodes earned to high level nodes
 * Also, get the just realised node, if any, as a teaser to the user of what s/he going to get 
 * 
 */

function NodeConverter(){
	this.rules 				= APP_CONFIG.NODE_RULES		; 			 //in config file
	this.levels				= APP_CONFIG.NODE_LEVELS	;
	this.resultNodes 		= {}						;			 //what we going to return, count of nodes for each type
	this.unrealisedNode 	= ""						;
	this.gainedNode			= ""						;			 //the newly gained node by user, either from spin or conversion
	this.conversionNodes	= {}						;			 //with all valid nodes of user, how they can upgrade
};

NodeConverter.prototype.getNodeType = function(Node_dbObj){
	return ( Node_dbObj == null || Node_dbObj["node"] == undefined ) ? null : Node_dbObj["node"];
}

NodeConverter.prototype.getNodeStatus = function(Node_dbObj){
	return ( Node_dbObj == null || Node_dbObj["status"] == undefined ) ? null : Node_dbObj["status"];
}

NodeConverter.prototype.incrementNode = function(nodeType, add, by){
	if(nodeType == "") return;
	
	if(by == undefined){
		by = 1;
	}
	
	if(this.resultNodes[nodeType] == undefined){
		this.resultNodes[nodeType] = 0;
	}
	
	if(add){
		this.resultNodes[nodeType] += by;
	}else{
		this.resultNodes[nodeType] -= by;
	}
	
	return;
	
}

NodeConverter.prototype.groupNodes	= function(user_earned_nodes){
	
	var that = this;
	$.each(user_earned_nodes, function(i, earned_node){
		
		if(earned_node == null){
			return;
		}
		
		if(that.getNodeStatus(earned_node) == NODE_STATUS_REVEALED){
			//at any time, one user should only have one revealed node, save it to cached object
			//if not, throw error
			if(that.unrealisedNode != ""){
				throw new Error('Whoops! You seems to have more than one revealed node! How come?');
			}else{
				that.unrealisedNode = that.getNodeType(earned_node); //take note of the unrealised node, we will see if it earns the user any node of higher level later
				that.gainedNode		= that.unrealisedNode;			 //set the unrealised node as gained node by default
				return;
			}
			
		}
		
		that.incrementNode(that.getNodeType(earned_node), true, 1);
		
	});
	
	return true;
}

NodeConverter.prototype.scanRules = function(){
	
	if(jQuery.isEmptyObject(this.resultNodes)){
		return;
	}
	
	var that = this;
	$.each(this.rules, function(i, level_rules){
		
		var convert_from 	= level_rules.convertFrom	;
		var convert_to		= level_rules.convertTo		;
		var convert_unit	= level_rules.unit			;
		
		var unit_earned = that.resultNodes[convert_from];
		if(unit_earned == undefined){
			return; //no conversion for this level
		}
		
		if( unit_earned < convert_unit ){
			return; //not enough for conversion for this level
		}
		
		//conversion
		var num_of_converted = Math.floor(unit_earned / convert_unit); //to the nearest floor int
		that.incrementNode(convert_from, false, num_of_converted * convert_unit);
		that.incrementNode(convert_to, true, num_of_converted);
		
	});
	
	return;
} 

NodeConverter.prototype.calculateNodes = function(){
	
	if(jQuery.isEmptyObject(this.resultNodes) && this.unrealisedNode == ""){
		return;
	}
	
	var that = this;
	
	//go through all levels, from low to high, convert the realised nodes
	this.scanRules();
	
	//put the revealed node back in, take note of the gained node
	that.incrementNode(this.unrealisedNode, true, 1);
	
	var unrealised_node_level = this.levels[this.unrealisedNode];
	for(var i = unrealised_node_level; i < this.rules.length; i++){ //check from this lvl onwards
		
		var convert_from 	= this.rules[i].convertFrom		;
		var convert_to		= this.rules[i].convertTo		;
		var convert_unit	= this.rules[i].unit			;
		
		var unit_earned = this.resultNodes[convert_from] == undefined ? 0 : this.resultNodes[convert_from];
		if(unit_earned == undefined){
			return; //no conversion for this level
		}
		
		if( unit_earned < convert_unit ){
			return; //not enough for conversion for this level
		}
		
		//conversion
		var num_of_converted = Math.floor(unit_earned / convert_unit); //to the nearest floor int
		this.incrementNode(convert_from, false, num_of_converted * convert_unit);
		this.incrementNode(convert_to, true, num_of_converted);
		
		this.gainedNode = convert_to;
	}
	
	return true;
	
}

NodeConverter.prototype.clear = function(){
	this.resultNodes 	= {}						;
	this.unrealisedNode = ""						;
	this.gainedNode		= ""						;
	
	this.conversionNodes = {"blue" : 0, "gold" : 0}	;
}

NodeConverter.prototype.convertNodes = function(user_earned_nodes){
	
	this.clear();

	if(user_earned_nodes.length == 0){
		return {gainedNode : "", nodes : {"green":0, "blue":0, "gold":0}, unrealisedNode: ""};
	}
	
	try{
		var check;
		check = this.groupNodes(user_earned_nodes);
		check = this.calculateNodes();
		return {gainedNode : this.gainedNode, nodes : this.resultNodes, unrealisedNode: this.unrealisedNode};
		
	}catch(e){
		throw e; //throw it all out
	}
	
}

NodeConverter.prototype.scanUpgradeRules = function(){
	
	if(jQuery.isEmptyObject(this.resultNodes)){
		return;
	}
	
	var that = this;
	$.each(this.rules, function(i, level_rules){
		
		var convert_from 	= level_rules.convertFrom	;
		var convert_to		= level_rules.convertTo		;
		var convert_unit	= level_rules.unit			;
		
		var unit_earned = that.resultNodes[convert_from];
		if(unit_earned == undefined){
			return; //no conversion for this level
		}
		
		if( unit_earned < convert_unit ){
			return; //not enough for conversion for this level
		}
		
		//conversion
		var num_of_converted = Math.floor(unit_earned / convert_unit); //to the nearest floor int
		that.conversionNodes[convert_to] = num_of_converted;
		
	});
	
	return;
} 

NodeConverter.prototype.estimateNodes = function(){
	
	if(jQuery.isEmptyObject(this.resultNodes)){
		return;
	}//should not come here, but just in case
	
	//go through all levels, from low to high, convert the realised nodes
	this.scanUpgradeRules();
	
	return true;
	
}

NodeConverter.prototype.checkNodes = function(user_earned_nodes){
	
	this.clear();

	if(user_earned_nodes.length == 0){
		return {
				conversion : {"blue" : 0, "gold" : 0}, 
				nodes : {"green":0, "blue":0, "gold":0}
			};
	}
	
	try{
		var check;
		check = this.groupNodes(user_earned_nodes);
		check = this.estimateNodes();
		return {
			conversion : this.conversionNodes, 
			nodes : this.resultNodes
		};
		
	}catch(e){
		throw e; //throw it all out
	}
	
}

NodeConverter.prototype.groupAllCodes = function(user_earned_nodes){
	
	this.clear();

	if(user_earned_nodes.length == 0){
		return {
				conversion : {"blue" : 0, "gold" : 0}, 
				nodes : {"green":0, "blue":0, "gold":0}
			};
	}
	
	try{
		var check;
		check = this.groupNodes(user_earned_nodes);
		return {
			conversion : this.conversionNodes, 
			nodes : this.resultNodes
		};
		
	}catch(e){
		throw e; //throw it all out
	}
	
}





