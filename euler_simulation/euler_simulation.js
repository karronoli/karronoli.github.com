/**
 * @author p08831
 * @created 2009/3/20
 */
(function(){

var option = {
    V0: 5.0, dt: 3.5e-2,
    C: 1e-6, R: 1e6,
    grid_interval: 10,
    width: 1020, height: 760,
    display_id: "euler_simulation",
    //expand: {V:100, I:1e8, T:70} // cut & try values
    expand_V:100, expand_I:1e8, expand_T:70 // cut & try values

};

var $ = function(id) { return document.getElementById(id);}
var F = function(){}
if (typeof console == "undefined") {
    console = {log:F, dir:F, time:F, timeEnd:F, count:F};
}

var addListener = (function() {
        if ( window.addEventListener ) {
            return function(el, type, fn) {
                el.addEventListener(type, fn, false);
            };
        } else if ( window.attachEvent ) {
            return function(el, type, fn) {
                var f = function() {
                    fn.call(el, window.event);
                };
                el.attachEvent('on'+type, f);
            };
        } else {
            return function(el, type, fn) {
                el['on'+type] = fn;
            }
        }
    })();


/**
  * main draw function
  * @return canvas element
  * @depend getGridCanvasByInterval, getVICanvas
  */
var draw = function(calculate, colors)
{
    var canvas = document.createElement("canvas");
    canvas.width = option.width; canvas.height = option.height;
    if (!canvas.getContext) {
        alert("no support");// will read result image ?
        return ;
    }
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, option.width, option.height);
    ctx.drawImage(getGridCanvas(0.1), 0, 0);
    if (typeof calculate == "object") { // array
        for (var i=0; i < calculate.length; ++i) {
            ctx.drawImage(getVICanvas(calculate[i], colors[i]), 0, 0);
        }
    } else {
        ctx.drawImage(getVICanvas(calculate, colors), 0, 0);
    }
    return canvas;
}


    /**
     * create x,y grid
     * @depend moz* (text extension@Firefox3)
     * @return canvas element (x,y grid)
     */
var getGridCanvas = function (lineWidth)
{
    var canvas = document.createElement("canvas");
    //var bold_canvas = document.createElement("canvas");
    var ctx = canvas.getContext('2d');
    //var bold_ctx = canvas.getContext('2d');
    var _interval = option.grid_interval;
    var _lineWidth = ctx.lineWidth;
    canvas.height = option.height; canvas.width = option.width;
    ctx.lineWidth = lineWidth || 0.1;
    ctx.beginPath();

    // step by interval (y axis)
    for (var i = 0; i < canvas.width; i += _interval) {
        ctx.moveTo(i, _interval);
        ctx.lineTo(i, canvas.height - _interval);
    }


    //console.dir(ctx)
    // step by interval (x axis)
    for (var i = 0; i < canvas.height; i += _interval) {
        // number label (depend on Firefox3)
        ctx.save();
        ctx.translate(0, canvas.height - i - _interval);
        try {
            ctx.mozTextStyle = "5pt Arial";
            ctx.mozDrawText("" + i/100);
        } catch (e) {}
        ctx.restore();
        ctx.moveTo(_interval, i);
        ctx.lineTo(canvas.width - _interval, i);

    }
    ctx.stroke();
    return canvas;
}

    /**
     * caliculation Volatage & Concurrency, put dots to canvas
     * @todo improve graph magnitude value (to rearrange auto?)
     * @return canvas element (volatage & cocurrency graph)
     */
var getVICanvas = function(calculate, styles)
{
    var V_canvas = document.createElement("canvas"); // Volatage canvas
    var I_canvas = document.createElement("canvas"); // concurrency canvas
    V_canvas.width = I_canvas.width  = option.width;
    V_canvas.height = I_canvas.height = option.height;

    var V_ctx = V_canvas.getContext('2d');
    var I_ctx = I_canvas.getContext('2d');
    V_ctx.fillStyle = styles[0]; I_ctx.fillStyle = styles[1];

    //befora translate, save, after translate, restore
    V_ctx.save(); I_ctx.save();
    V_ctx.translate(option.grid_interval, option.height - option.grid_interval);
    I_ctx.translate(option.grid_interval, option.height - option.grid_interval);
    // x is lazy evaluation
    // draw from end to end
    V_ctx.beginPath();    I_ctx.beginPath();
    V_ctx.moveTo(0, 0); I_ctx.moveTo(0, 0);
    V_ctx.lineTo(0, 0);
    var V = 0, I = 0, T = 0, calculation_result = {};
    for (var x = function(){return T*option.expand_T;},
             end = option.width - 2 * option.grid_interval;
         x() < end; T += option.dt) {

        calculation_result = calculate(V, I, T); // {V:float,I:float}
        V = calculation_result.V; I = calculation_result.I;
        V_ctx.lineTo(x(), -V * option.expand_V);
        I_ctx.lineTo(x(), -I * option.expand_I);
        //V_ctx.moveTo(x(), -V * option.expand.V);
        // Y axis invert & expand V, I (old)
        V_ctx.save(); I_ctx.save();
        V_ctx.fillStyle = "black"; I_ctx.fillStyle = "black";
        V_ctx.fillRect(x(), -V * option.expand_V, 2, 2);
        I_ctx.fillRect(x(), -I * option.expand_I, 2, 2);
        V_ctx.restore(); I_ctx.restore();
        // path no houga sennga direct ni hikete yokunai?
        /*
        if (T < 0.3 || T > 14.5) {
            console.log("V:%d, I:%d",
            V * option.expand.V, I * option.expand.I);
        }
        */
    }
    V_ctx.lineTo(x(), 0);
    V_ctx.fill();  I_ctx.fill();
    //I_ctx.stroke();
    V_ctx.restore(); I_ctx.restore();

    V_ctx.drawImage(I_canvas, 0, 0);
    return V_canvas;
}

var getTheoreticalResult = function(V, I, T)
{
    V = option.V0 * (1 - Math.exp(-T/(option.R*option.C)));
    I = option.V0 / option.R * Math.exp(-T/(option.R*option.C));
    return {V:V, I:I};
}

var getEulerSimulationResult = function(V, I, T)
{
    V = V + I*option.dt/option.C;  I = (option.V0 - V)/option.R;
    return {V:V, I:I};

}



/**
 * DOM settings
 */
//addListener(window, "load", function()
var setDOM = function(e)
{
    console.log(new Date)
    var di = $(option.display_id);
    var id = Math.random();
    // short hand
    var d = document, b = d.body, e = 'createElement', c = 'appendChild';

    /*
    d.appendChild(document.createTextNode("Graph Expand Ratio "));
    for (var key in option.expand) {
        d.appendChild(document.createTextNode(key+":"+option.expand[key]+"; \n"));
    }
    d.appendChild(document.createElement("br"));
    */

    var div = d[e]("div");
    div.setAttribute("style", "float:left;");
    div.appendChild(document.createTextNode("Circuit Constant & graph option: "));

    var form = d[e]("form"), input = d[e]("input");
    input.type = "button";
    input.id = "manual_option" + id;
    input.value = "manual_option";
    form[c](input);

    var ul = d[e]("ul"), li = {};
    for (var key in option) {
        if (typeof option[key] == "object") continue;
        li = d[e]("li");
        li.textContent = key + ": ";
        input = d[e]("input");
        input.type = "text";
        input.name = key;
        input.value = option[key];
        li[c](input);
        ul[c](li);
    }
    form[c](ul);

    div[c](form); di[c](div);
    addListener($("manual_option" + id), "click", function(e) {
                    var inputs = $("manual_option" + id).form.getElementsByTagName("input");
                    //console.log(inputs,e)
                    var value  = 0;
                    for (var i = 0; i < inputs.length; ++i) {
                        //console.count("input count");
                        //console.log("key:%s, value:%s",
                        //            inputs[key].name, parseFloat(inputs[key].value));
                        value = inputs[i].value.match(/\d+/);
                        if (value) {
                            option[inputs[i].name] = parseFloat(inputs[i].value);
                        }
                    }
                    setDOM();
                });
    /* spacer */
    var div = d[e]("div");
    div.textContent = " "; div.setAttribute("style", "clear:both;");
    di[c](div);

    di[c](document.createTextNode("lastModified: " + document.lastModified));
    di[c](d[e]("br"));
    di[c](d[e]("br"));

    console.time("Euler Simulation");
    di[c](document.createTextNode("Euler Simulation Result; v:red, i:blue "));
    di[c](d[e]("br"));
    di[c](draw(getEulerSimulationResult, 
                       ['rgba(200, 0, 0, 0.2)',  'rgba(0, 0, 200, 0.2)']));
    di[c](d[e]("br"));
    di[c](d[e]("br"));
    console.timeEnd("Euler Simulation");

    console.time("Theoretical Result");
    di[c](document.createTextNode("Theoretical Result; v:green, i:magenta"));
    di[c](d[e]("br"));
    di[c](draw(getTheoreticalResult, 
                       ['rgba(0, 200, 0, 0.2)', 'rgba(200, 0, 200, 0.2)']));
    di[c](d[e]("br"));
    di[c](d[e]("br"));
    console.timeEnd("Theoretical Result");

    console.time("Euler Simulation & Theoretical Result");
    di[c](document.createTextNode("Euler Simulation & Theoretical Result; " +
                                          "v:red+green, i:blue+magenta"));
    di[c](d[e]("br"));
    di[c](draw([getEulerSimulationResult, getTheoreticalResult],
                       [['rgba(200, 0, 0, 0.2)',  'rgba(0, 0, 200, 0.2)'], 
                        ['rgba(0, 200, 0, 0.1)', 'rgba(200, 0, 200, 0.1)']]));
    console.timeEnd("Euler Simulation & Theoretical Result");
    console.log("\n");
};


addListener(window, "load", setDOM);



})();
