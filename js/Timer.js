Ext.define('alexzam.comp.Timer', {
    extend: 'Ext.draw.Component',
    alias:['widget.aztimer'],

    viewBox: false,
    autoRender:true,
    
    drawn:false,

    constructor: function (config) {
        this.callParent(arguments);

        this.on('afterrender', function(){
            if(this.drawn) return false;
            this.drawn = true;

            var size = Math.min(this.getWidth(), this.getHeight());
            var rad = Math.floor(size/2);
            var space = rad * 0.015;
	    var wid = rad * 0.05;
            var trans = {x:rad,y:rad};

  	    rad *= 0.9;

            /*this.surface.add({
                type: 'circle',
                stroke: '#FF3333',
                radius: rad,
                x: 0,
                y: 0,
                group:'all'
            });*/

   	    rad -= space;
	    this.drawSegments(60, 0.85, rad - wid, rad, 's');

 	    this.surface.getGroup('all').setAttributes({
                translate: trans
            }, false);
            this.surface.renderAll(); 
        });
    
        return this;
    },

    drawSegments: function(n,k,r1,r2,id){
	var i = 0;
	while(i<n){
		var a=2*Math.PI*i/n;
		var b=2*Math.PI*(i+k)/n;
                
		var path = [
                    ['M',r2*Math.sin(a), -r2*Math.cos(a)],
                    ['a',r2, r2, 0, 0, 1, (r2*Math.sin(b)), (-r2*Math.cos(b))],
                    ['l',(r1*Math.sin(b)), (-r1*Math.cos(b))],
                    ['a',r1, r1, 0, 0, 0, (r1*Math.sin(a)), (-r1*Math.cos(a))],
                    ['z']
                ];
		this.surface.add({
                    type: 'path',
                    path: path,
                    class:'sector '+id,
                    id:id+i,
                    val:i,
                    group:'all', stroke:'#ff3333'
                });
		i++;
	}
    }
});

/*
function azTimer(svg, func){
	this.timesvg = svg;
	this.fnCalc = func;

	var size = Math.min(svg._svg.width.baseVal.value, svg._svg.height.baseVal.value);
	var rad = Math.floor(size/2);
	var space = rad * 0.015;
	var wid = rad * 0.05;

	var g = svg.group({transform:"translate("+rad+","+rad+")"});
	rad *= 0.9;
	//svg.circle(g, 0, 0, rad, {fill: 'none', stroke: 'red', strokeWidth: 1});

	rad -= space;
	this.drawSegments(svg, g, 60, 0.85, rad - wid, rad, 's');
	rad -= wid + space;
	this.drawSegments(svg, g, 60, 0.85, rad - wid, rad, 'm');
	rad -= wid + space;
	this.drawSegments(svg, g, 24, 0.9, rad - wid, rad, 'h');
	rad -= wid + space;
	this.drawSegments(svg, g, 31, 0.85, rad - wid, rad, 'd');
	rad -= wid + space;
	this.drawSegments(svg, g, 12, 0.93, rad - wid, rad, 'mo');

	wid = rad * 0.25;
	svg.text(g, 0, Math.floor(wid/2), "Yooo 1234", {fontFamily:"Digital", fontSize:wid, textAnchor:'middle', id:'time'});
	$('#time', svg.root()).text('000 000000');
	this.notified = false;
}

azTimer.prototype.drawSegments = function(svg, parent,n,k,r1,r2,id){
	var i = 0;
	while(i<n){
		var a=2*Math.PI*i/n;
		var b=2*Math.PI*(i+k)/n;
		var path = svg.createPath();
		svg.path(parent,
			path.move((r2*Math.sin(a)), (-r2*Math.cos(a)))
				.arc(r2, r2, 0, 0, 1, (r2*Math.sin(b)), (-r2*Math.cos(b)))
				.line((r1*Math.sin(b)), (-r1*Math.cos(b)))
				.arc(r1, r1, 0, 0, 0, (r1*Math.sin(a)), (-r1*Math.cos(a)))
				.close()
			,
			{class:'sector '+id, id:id+i, val:i}
		);
		i++;
	}
}

azTimer.prototype.fillSectors = function(id, num){
	var circle = $('.sector', this.timesvg.root())
		.filter('.'+id);

	circle.filter(':gt('+num+')')
		.add(circle.filter(':eq('+num+')'))
		.addClass('inact');
//		.removeClass('act');
	circle.filter(':lt('+num+'),')
//		.addClass('act')
		.removeClass('inact');
}

azTimer.prototype.setRest = function(msec){
	var rest = Math.floor(msec / 1000);
	var cur = rest % 60;
	var text = ((cur<10)?'0':'') + cur;
	this.fillSectors('s', cur);

	rest = Math.floor(rest / 60);
	cur = rest % 60;
	text = ((cur<10)?'0':'') + cur + text;
	this.fillSectors('m', cur);

	rest = Math.floor(rest / 60);
	cur = rest % 24;
	text = ((cur<10)?' 0':' ') + cur + text;
	this.fillSectors('h', cur);

	rest = Math.floor(rest / 24);
	cur = rest % 31;
	text = ((cur<10)?'0':'') + cur + text;
	this.fillSectors('d', cur);

	rest = Math.floor(rest / 31);
	text = '' + (rest % 31) + text;
	this.fillSectors('mo', rest % 12);

	$('#time', this.timesvg.root()).text(text);
}

azTimer.prototype.updateTimer = function(){
	var rest = this.fnCalc();
	if(rest > 0){
		this.setRest(rest);
	} else if (!this.notified) {
		if (window.webkitNotifications) {
			window.webkitNotifications.createNotification(null, 'Timer is 0 now!', 'Webtimer came to its zero point.').show();
		}
		this.notified = true;
	}
}

var azTimerCollection = {
	timers:[],
	started:false,

	addTimer:function(t){
		azTimerCollection.timers.push(t);
	},
	updateTimers:function(){
		if(!azTimerCollection.started) return;
		for(i in azTimerCollection.timers){
			azTimerCollection.timers[i].updateTimer();
		}
		setTimeout(azTimerCollection.updateTimers, 1000);
	},
	start:function(){
		azTimerCollection.started = true;
		azTimerCollection.updateTimers();
	},
	stop:function(){
		azTimerCollection.started = false;
	},
	
	getFuncToTime:function(dt){
		return function(){
			return dt.getTime() - (new Date()).getTime();
		}
	},
	getFuncTotalTime:function(lng){
		var target = (new Date()).getTime() + lng;
		return function(){
			return target - (new Date()).getTime();
		}
	}
}

*/