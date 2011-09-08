Ext.define('alexzam.comp.Timer', {
    extend: 'Ext.draw.Component',
    alias:['widget.aztimer'],

    viewBox: false,
    autoRender:true,

    fnCalc: null,
    drawn:false,
    notified: false,
    running: false,

    config:{
        autoRun:true,
        name: ''
    },

    constructor: function (config) {
        this.callParent(arguments);
        this.initConfig(config);

        this.on('afterrender', function(){
            if(this.drawn) return false;
            this.drawn = true;

            this.initGraphic();
            alexzam.comp.TimerManager.registerTimer(this);
        });
        this.notified = false;
        if(Ext.isString(this.config.timeFunc)) this.fnCalc = this.getTimeFuncByName(this.config.timeFunc, this.config.timeFuncParam);
        else this.fnCalc = this.config.timeFunc;
        this.running = this.config.autoRun;
    
        return this;
    },

    initGraphic:function(){
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
   	    rad -= wid + space;
	    this.drawSegments(60, 0.85, rad - wid, rad, 'm');
	    rad -= wid + space;
	    this.drawSegments(24, 0.9, rad - wid, rad, 'h');
	    rad -= wid + space;
	    this.drawSegments(31, 0.85, rad - wid, rad, 'd');
	    rad -= wid + space;
	    this.drawSegments(12, 0.93, rad - wid, rad, 'mo');

            wid = rad * 0.25;
	    var text = this.surface.add({
                type: 'text',
                x: 0,
                y: Math.floor(wid/2),
                text: "000 000000",
                font: ''+wid+" Digital",
                group: ['all', 'time']
            });
            this.surface.render(text);
            text.setAttributes({'text-anchor': 'middle'}, true);
            text.addCls('text');

 	    this.surface.getGroup('all').setAttributes({
                translate: trans
            }, false);
            this.surface.renderAll(); 
    },

    drawSegments: function(n,k,r1,r2,id){
	var i = 0;
	while(i<n){
		var a=2*Math.PI*i/n;
		var b=2*Math.PI*(i+k)/n;
                
		var path = [
                    ['M',r2*Math.sin(a), -r2*Math.cos(a)],
                    ['A',r2, r2, 0, 0, 1, (r2*Math.sin(b)), (-r2*Math.cos(b))],
                    ['L',(r1*Math.sin(b)), (-r1*Math.cos(b))],
                    ['A',r1, r1, 0, 0, 0, (r1*Math.sin(a)), (-r1*Math.cos(a))],
                    ['z']
                ];
		var sector = this.surface.add({
                    type: 'path',
                    path: path,
                    group:['all',id]
                });
                this.surface.render(sector);
                sector.addCls(['sector', id]);
		i++;
	}
    },

    fillSectors: function(id, num){
        this.surface.getGroup(id).each(function(spr, i){
            if(i >= num)spr.addCls('inact');
            else spr.removeCls('inact');
        });
    },

    setRest: function(msec){
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

	this.surface.getGroup('time').getAt(0).setAttributes({text:text}, true);
    },

    updateTimer: function(){
        if(!this.running) return;
	var rest = this.fnCalc();
	if(rest > 0){
	    this.setRest(rest);
	} else if (!this.notified) {
            this.running = false;
	    if (window.webkitNotifications) {
	        window.webkitNotifications.createNotification(null, 'Timer has finished!', 'Timer '+this.config.name+' came to its zero point.').show();
	    }
	    this.notified = true;
	}
    },

    getTimeFuncByName: function(name, param){
        switch(name){
            case "totime":
                return this.getFuncToTime(param);
            case "timer":
                return this.getFuncTotalTime(param);
        }
        return null;
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
});

Ext.define('alexzam.comp.TimerManager', {
    singleton: true,

    timers: [],
    running: false,

    registerTimer: function(timer){
        if(!Ext.Array.contains(alexzam.comp.TimerManager.timers, timer)) alexzam.comp.TimerManager.timers.push(timer);
        if(!alexzam.comp.TimerManager.running && timer.running) {
            alexzam.comp.TimerManager.running = true;
            alexzam.comp.TimerManager.updateTimers();
        }
    },

    removeTimer: function(timer){
        Ext.Array.remove(alexzam.comp.TimerManager.timers, timer);
    },

    updateTimers:function(){
        if(!alexzam.comp.TimerManager.running) return;
	for(i in alexzam.comp.TimerManager.timers){
	    alexzam.comp.TimerManager.timers[i].updateTimer();
	}
	setTimeout(alexzam.comp.TimerManager.updateTimers, 1000);
    }

});
