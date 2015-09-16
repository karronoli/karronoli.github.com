"use strict";

var $ = function(id){return document.getElementById(id);};
window.onload = function()
{
    console.log("start");
    try {
        execute($("original"));
    } catch(e) {
        alert(e);
    }
    console.log("end");
};

var execute = function(org)
{
    var canvas = $("myCanvas");
    canvas.setAttribute("width", org.width);
    canvas.setAttribute("height", org.height);
    var context = canvas.getContext("2d");
    context.drawImage(org, 0, 0);

    var from = context.getImageData(0, 0, org.width, org.height);
    console.log("start length:%d, width:%d, height:%d, status:%d",
                from.data.length, org.width, org.height,
                from.data.length == org.width * org.height * 4);
    for (var i = 0; i < from.data.length; i += 4) {
        var R = from.data[i + 0];
        var G = from.data[i + 1];
        var B = from.data[i + 2];
        var average = getColorAverage(R, G, B);
        from.data[i + 0] = from.data[i + 1] = from.data[i + 2] =
           Math.floor(average);
            /*
            var average = getLuminance(R, G, B);
            if(average <= 128)
                pixelImage.data = [0, 0, 0, 255];  // 白色に設定
            else // RGB 平均値が閾値より大きい場合
                pixelImage.data = [255, 255, 255, 255];  // 白色に設定
            */

            /*
            R = R  * 2;
            if (R > 255) R = 255;
            G = Math.floor(G / 2);
            B = Math.floor(B / 2);
            pixelImage.data = [R, G, B, 255];
            */
    }
    context.putImageData(from, 0, 0);
};

var getColorAverage = function(r, g, b)
{
    return r*0.299 + g*0.587 + b*0.114;
};

var getLuminance = function(r, g, b)
{
    return (r + g + b)/3;
};
