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
        name: '',
        closeButton:true
    },

    constructor: function (config) {
        var me = this;
        me.callParent(arguments);
        me.initConfig(config);

        me.on('afterrender', function() {
            if (me.drawn) return false;
            me.drawn = true;

            me.initGraphic();
            alexzam.comp.TimerManager.registerTimer(me);
            me.surface.on('mouseover', me.onMouseOver, me);
            me.surface.on('mouseout', me.onMouseOut, me);
            me.surface.on('click', me.onClick, me);
        });
        me.notified = false;
        if (Ext.isString(me.config.timeFunc))
            me.fnCalc = me.getTimeFuncByName(me.config.timeFunc, me.config.timeFuncParam);
        else me.fnCalc = me.config.timeFunc;
        me.running = me.config.autoRun;

        return me;
    },

    initGraphic:function() {
        var size = Math.min(this.getWidth(), this.getHeight());
        var rad = Math.floor(size / 2);
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

        wid = rad * 0.3;
        var surface = this.surface;
        var text = surface.add({
            type: 'text',
            x: 0,
            y: -Math.floor(wid / 2),
            text: "000 000000",
            font: '' + wid + " Digital",
            group: ['all', 'time']
        });
        surface.render(text);
        text.setAttributes({'text-anchor': 'middle'}, true);
        text.addCls('text');

        wid = rad * 0.2;
        text = surface.add({
            type: 'text',
            x: 0,
            y: Math.floor(wid / 2),
            text: this.config.name.substr(0, 10),
            font: '' + wid + " Digital",
            group: ['all', 'tname']
        });
        surface.render(text);
        text.setAttributes({'text-anchor': 'middle'}, true);
        text.addCls('text');

        surface.getGroup('all').setAttributes({
            translate: trans
        }, false);

        if (this.config.closeButton) {
            wid = size * .06;
            var lwid = wid * .25;
            var l1 = wid / 2 - lwid;
            var but = surface.add({
                type: 'path',
                path: [
                    ['M', size - 5 - wid, 5 + wid],
                    ['l', lwid, 0],
                    ['l', l1, l1],
                    ['l', l1, -l1],
                    ['l', lwid, 0],
                    ['l', 0, lwid],
                    ['l', -l1, l1],
                    ['l', l1, l1],
                    ['l', 0, lwid],
                    ['l', -lwid, 0],
                    ['l', -l1, -l1],
                    ['l', -l1, l1],
                    ['l', -lwid, 0],
                    ['l', 0, -lwid],
                    ['l', l1, -l1],
                    ['l', -l1, -l1],
                    ['z']
                ],
                group: 'btClose'
            });
            surface.render(but);
            but.addCls('bt-close');
        }

        surface.renderAll();
    },

    drawSegments: function(n, k, r1, r2, id) {
        var i = 0;
        while (i < n) {
            var a = 2 * Math.PI * i / n;
            var b = 2 * Math.PI * (i + k) / n;

            var path = [
                ['M',r2 * Math.sin(a), -r2 * Math.cos(a)],
                ['A',r2, r2, 0, 0, 1, (r2 * Math.sin(b)), (-r2 * Math.cos(b))],
                ['L',(r1 * Math.sin(b)), (-r1 * Math.cos(b))],
                ['A',r1, r1, 0, 0, 0, (r1 * Math.sin(a)), (-r1 * Math.cos(a))],
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

    fillSectors: function(id, num) {
        this.surface.getGroup(id).each(function(spr, i) {
            if (i >= num)spr.addCls('inact');
            else spr.removeCls('inact');
        });
    },

    setRest: function(msec) {
        var rest = Math.floor(msec / 1000);
        var cur = rest % 60;
        var text = ((cur < 10) ? '0' : '') + cur;
        this.fillSectors('s', cur);

        rest = Math.floor(rest / 60);
        cur = rest % 60;
        text = ((cur < 10) ? '0' : '') + cur + text;
        this.fillSectors('m', cur);

        rest = Math.floor(rest / 60);
        cur = rest % 24;
        text = ((cur < 10) ? ' 0' : ' ') + cur + text;
        this.fillSectors('h', cur);

        rest = Math.floor(rest / 24);
        cur = rest % 31;
        text = ((cur < 10) ? '0' : '') + cur + text;
        this.fillSectors('d', cur);

        rest = Math.floor(rest / 31);
        text = '' + (rest % 31) + text;
        this.fillSectors('mo', rest % 12);

        this.surface.getGroup('time').getAt(0).setAttributes({text:text}, true);
    },

    updateTimer: function() {
        if (!this.running) return;
        var rest = this.fnCalc();
        if (rest > 0) {
            this.setRest(rest);
        } else if (!this.notified) {
            this.running = false;
            if (window.webkitNotifications) {
                window.webkitNotifications.createNotification(null, 'Timer has finished!',
                    'Timer ' + this.config.name + ' came to its zero point.')
                    .show();
            }
            this.notified = true;
        }
    },

    getTimeFuncByName: function(name, param) {
        switch (name) {
            case "totime":
                return this.getFuncToTime(param);
            case "timer":
                return this.getFuncTotalTime(param);
        }
        return null;
    },

    getFuncToTime:function(dt) {
        return function() {
            return dt.getTime() - (new Date()).getTime();
        }
    },
    getFuncTotalTime:function(lng) {
        var target = (new Date()).getTime() + lng;
        return function() {
            return target - (new Date()).getTime();
        }
    },
    onMouseOver:function() {
        this.surface.getGroup('btClose').addCls('bt-close-active');
    },
    onMouseOut:function() {
        this.surface.getGroup('btClose').removeCls('bt-close-active');
    },
    onClick:function(ev) {
        console.dir();
        var x = ev.browserEvent.offsetX;
        var y = ev.browserEvent.offsetY;
        var box = this.surface.getGroup('btClose').getBBox();
        var bx = box.x;
        var by = box.y;

        var clicked = (x >= bx && y >= by && x <= bx + box.width && y <= by + box.height);
        if (clicked) this.remove();
    },
    remove:function() {
        alexzam.comp.TimerManager.removeTimer(this);
        this.destroy();
    },
    getState:function(){
        var state = this.initialConfig;
        if(Ext.isDate(state.timeFuncParam)) state.timeFuncParam = state.timeFuncParam.getTime();
        return state;
    }
});

Ext.define('alexzam.comp.TimerManager', {
    singleton: true,

    timers: [],
    running: false,

    registerTimer: function(timer) {
        if (!Ext.Array.contains(alexzam.comp.TimerManager.timers, timer)) alexzam.comp.TimerManager.timers.push(timer);
        if (!alexzam.comp.TimerManager.running && timer.running) {
            alexzam.comp.TimerManager.running = true;
            alexzam.comp.TimerManager.updateTimers();
        }
        alexzam.comp.TimerManager.saveState();
    },

    removeTimer: function(timer) {
        Ext.Array.remove(alexzam.comp.TimerManager.timers, timer);
        alexzam.comp.TimerManager.saveState();
    },

    updateTimers:function() {
        if (!alexzam.comp.TimerManager.running) return;
        for (i in alexzam.comp.TimerManager.timers) {
            alexzam.comp.TimerManager.timers[i].updateTimer();
        }
        setTimeout(alexzam.comp.TimerManager.updateTimers, 1000);
    },

    saveState:function() {
        var storage = window.localStorage;
        var state = [];

        Ext.Array.forEach(alexzam.comp.TimerManager.timers, function(item){
            state.push(item.getState());
        });
        storage.setItem('alexzam.comp.TimerManager', Ext.JSON.encode(state));
    },

    loadState:function(){
        var storage = window.localStorage;
        var state = Ext.JSON.decode(storage.getItem('alexzam.comp.TimerManager'));
        var timers = [];

        Ext.Array.forEach(state, function(item){
            if(item.timeFunc == 'totime') item.timeFuncParam = new Date(item.timeFuncParam);
            timers.push(Ext.create('alexzam.comp.Timer', item));
        });

        return timers;
    }
});
	
