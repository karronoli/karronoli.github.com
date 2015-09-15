"use strict";

var $ = function(id){return document.getElementById(id);}
window.onload = function()
{
    console.log("start");
    var img = new Image();
    img.src = "favicon.jpg";
    // document.body.appendChild(img);
    
    try {
        execute(img);
    } catch(e) {
        alert(e);
    }
    console.log("end");
}

var execute = function(org)
{
    var canvas = $("myCanvas");
    canvas.setAttribute("width", org.width);
    canvas.setAttribute("height", org.height);
    var context = canvas.getContext("2d");
    context.drawImage(org, 0, 0);

    var to = context.createImageData(org.width, org.height);
    var from = context.getImageData(0, 0, org.width, org.height);
    console.log("start length:%d, width:%d, height:%d, status:%d",
                from.data.length, org.width, org.height,
                from.data.length == org.width * org.height * 4);
    for (var i = 0; i < from.data.length; i += 4) {
        var R = from.data[i + 0];
        var G = from.data[i + 1];
        var B = from.data[i + 2];
        var average = getColorAverage(R, G, B);
        // 直接変更の必要有
        // to.data[i + 0] = to.data[i + 1] = to.data[i + 2] = 
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

    var dummy = $("dummy").getContext("2d");
    /*
    // Red Test
    var dummy_d = dummy.getImageData(0, 0, org.width, org.height);
    for (var i=0;i < dummy_d.data.length;i+=4) {
      dummy_d.data[i + 0] = 255;
      dummy_d.data[i + 1] = 0;
      dummy_d.data[i + 2] = 0;
      dummy_d.data[i + 3] = 255;
    }
    dummy.putImageData(dummy_d, 10, 10);
    */
    // context.clearRect(0, 0, org.width, org.height); // no
    // context.putImageData(to, 0, 0); // no
    dummy.putImageData(from, 0, 0);
    
}

var getColorAverage = function(r, g, b) 
{
    return r*0.299 + g*0.587 + b*0.114;
}

var getLuminance = function(r, g, b)
{
    return (r + g + b)/3;
}
